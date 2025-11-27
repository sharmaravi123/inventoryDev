import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import BillModel, {
  BillDocument,
  BillItem,
  PaymentInfo,
  CustomerSnapshot,
} from "@/models/Bill";
import CustomerModel, {
  CustomerDocument,
} from "@/models/Customer";
import { getNextInvoiceNumber } from "@/models/InvoiceCounter";
import Stock from "@/models/Stock";

type CreateBillCustomerInput = {
  name: string;
  shopName?: string;
  phone: string;
  address: string;
  gstNumber?: string;
};

// 👇 yahan stockId add kiya
type CreateBillItemInput = {
  stockId: string; // Stock / Inventory document _id
  productId: string;
  warehouseId: string;
  productName: string;
  sellingPrice: number; // per piece (GST included)
  taxPercent: number;
  quantityBoxes: number;
  quantityLoose: number;
  itemsPerBox: number;
};

type PaymentMode = "CASH" | "UPI" | "CARD" | "SPLIT";

export type CreateBillPaymentInput = {
  mode: PaymentMode;
  cashAmount?: number;
  upiAmount?: number;
  cardAmount?: number;
};

type CreateBillRequestBody = {
  customer: CreateBillCustomerInput;
  companyGstNumber?: string;
  billDate?: string;
  items: CreateBillItemInput[];
  payment: CreateBillPaymentInput;
  driverId?: string;
  vehicleNumber?: string;
};

type StockShape = {
  _id: Types.ObjectId | string;
  product?: Types.ObjectId | string;
  warehouse?: Types.ObjectId | string;
  productId?: Types.ObjectId | string;
  warehouseId?: Types.ObjectId | string;
  boxes: number;
  itemsPerBox: number;
  looseItems?: number;
  loose?: number;
};

type BillSummary = {
  _id: string;
  invoiceNumber: string;
  billDate: string;
  grandTotal: number;
};

type CreateBillResponseBody = {
  bill: BillSummary;
};

// ----------------- helpers -----------------

function validatePaymentInput(
  payment: CreateBillPaymentInput,
  grandTotal: number
): PaymentInfo {
  const mode = payment.mode;
  const cashAmount = payment.cashAmount ?? 0;
  const upiAmount = payment.upiAmount ?? 0;
  const cardAmount = payment.cardAmount ?? 0;

  if (cashAmount < 0 || upiAmount < 0 || cardAmount < 0) {
    throw new Error("Payment amounts cannot be negative");
  }

  const sum = cashAmount + upiAmount + cardAmount;

  if (sum > grandTotal + 0.001) {
    throw new Error("Total collected amount cannot exceed grand total");
  }

  // Ab hum mode ko sirf informational treat kar rahe:
  // - sum 0 ho sakta hai (PENDING)
  // - sum < total (PARTIALLY_PAID)
  // - sum == total (DELIVERED)

  return {
    mode,
    cashAmount,
    upiAmount,
    cardAmount,
  };
}

function buildCustomerSnapshot(
  customer: CustomerDocument,
  input: CreateBillCustomerInput
): CustomerSnapshot {
  return {
    customer: customer._id,
    name: input.name,
    shopName: input.shopName,
    phone: input.phone,
    address: input.address,
    gstNumber: input.gstNumber,
  };
}

async function upsertCustomer(
  input: CreateBillCustomerInput
): Promise<CustomerDocument> {
  const existing = await CustomerModel.findOne({
    phone: input.phone,
  }).exec();

  if (existing) {
    existing.name = input.name;
    existing.shopName = input.shopName ?? existing.shopName;
    existing.address = input.address;
    existing.gstNumber = input.gstNumber ?? existing.gstNumber;
    await existing.save();
    return existing;
  }

  const customer = new CustomerModel({
    name: input.name,
    shopName: input.shopName,
    phone: input.phone,
    address: input.address,
    gstNumber: input.gstNumber,
  });

  await customer.save();
  return customer;
}

type CalculatedLine = {
  item: BillItem;
  totalItems: number;
  totalBeforeTax: number;
  taxAmount: number;
  lineTotal: number;
};

/**
 * sellingPrice already INCLUDES GST.
 *
 * For a given line:
 *   gross = qty * sellingPrice
 *   taxAmount = gross * taxPercent / (100 + taxPercent)
 *   totalBeforeTax = gross - taxAmount
 *   lineTotal = gross
 */
function calculateLine(input: CreateBillItemInput): CalculatedLine {
  const totalItems =
    input.quantityBoxes * input.itemsPerBox + input.quantityLoose;

  const gross = totalItems * input.sellingPrice;

  let taxAmount = 0;
  let totalBeforeTax = gross;

  if (input.taxPercent > 0) {
    taxAmount =
      (gross * input.taxPercent) /
      (100 + input.taxPercent);
    totalBeforeTax = gross - taxAmount;
  }

  const lineTotal = gross;

  const item: BillItem = {
    product: new Types.ObjectId(input.productId),
    warehouse: new Types.ObjectId(input.warehouseId),
    productName: input.productName,
    sellingPrice: input.sellingPrice,
    taxPercent: input.taxPercent,
    quantityBoxes: input.quantityBoxes,
    quantityLoose: input.quantityLoose,
    itemsPerBox: input.itemsPerBox,
    totalItems,
    totalBeforeTax,
    taxAmount,
    lineTotal,
  };

  return {
    item,
    totalItems,
    totalBeforeTax,
    taxAmount,
    lineTotal,
  };
}

type GroupedUsage = {
  stockId: string;
  totalLooseEquivalent: number;
};

async function reserveStockForNewBill(
  items: CreateBillItemInput[]
): Promise<void> {
  const grouped: Record<string, GroupedUsage> = {};

  items.forEach((input) => {
    const looseEquivalent =
      input.quantityLoose + input.quantityBoxes * input.itemsPerBox;

    const existing = grouped[input.stockId];
    if (existing) {
      existing.totalLooseEquivalent += looseEquivalent;
    } else {
      grouped[input.stockId] = {
        stockId: input.stockId,
        totalLooseEquivalent: looseEquivalent,
      };
    }
  });

  const entries = Object.values(grouped);

  for (const entry of entries) {
    const stock = await Stock.findById(entry.stockId)
      .lean<StockShape>()
      .exec();

    if (!stock) {
      throw new Error("Stock not found for selected product and warehouse");
    }

    const looseCount =
      typeof stock.looseItems === "number"
        ? stock.looseItems
        : typeof stock.loose === "number"
        ? stock.loose
        : 0;

    const availableLooseEquivalent =
      looseCount + stock.boxes * stock.itemsPerBox;

    if (entry.totalLooseEquivalent > availableLooseEquivalent) {
      throw new Error(
        "Requested quantity is more than available stock"
      );
    }

    const remainingLooseEquivalent =
      availableLooseEquivalent - entry.totalLooseEquivalent;

    const remainingBoxes = Math.floor(
      remainingLooseEquivalent / stock.itemsPerBox
    );
    const remainingLoose =
      remainingLooseEquivalent % stock.itemsPerBox;

    const update: {
      boxes: number;
      looseItems: number;
      loose: number;
    } = {
      boxes: remainingBoxes,
      looseItems: remainingLoose,
      loose: remainingLoose,
    };

    await Stock.updateOne(
      { _id: stock._id },
      { $set: update }
    ).exec();
  }
}

// ----------------- POST: create bill -----------------

export async function POST(
  req: NextRequest
): Promise<NextResponse<CreateBillResponseBody | { error: string }>> {
  try {
    await dbConnect();

    const body = (await req.json()) as CreateBillRequestBody;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "Bill must contain at least one item" },
        { status: 400 }
      );
    }

    // 1) Inventory validation + stock update
    await reserveStockForNewBill(body.items);

    // 2) Calculate all line items + totals
    let totalItems = 0;
    let totalBeforeTax = 0;
    let totalTax = 0;
    let grandTotal = 0;

    const lineItems: BillItem[] = body.items.map((input) => {
      const calculated = calculateLine(input);
      totalItems += calculated.totalItems;
      totalBeforeTax += calculated.totalBeforeTax;
      totalTax += calculated.taxAmount;
      grandTotal += calculated.lineTotal;
      return calculated.item;
    });

    // 3) Payment validation
    const paymentInfo = validatePaymentInput(
      body.payment,
      grandTotal
    );

    // 4) Customer create / update
    const customerDoc = await upsertCustomer(body.customer);
    const customerSnapshot = buildCustomerSnapshot(
      customerDoc,
      body.customer
    );

    // 5) Invoice number + bill date
    const invoiceNumber = await getNextInvoiceNumber();

    const billDate = body.billDate
      ? new Date(body.billDate)
      : new Date();

    // 6) Amount collected / balance / status
    const amountCollected =
      (paymentInfo.cashAmount ?? 0) +
      (paymentInfo.upiAmount ?? 0) +
      (paymentInfo.cardAmount ?? 0);

    const balanceAmount = grandTotal - amountCollected;

    let status: BillDocument["status"] = "PENDING";
    if (amountCollected <= 0) {
      status = "PENDING";
    } else if (amountCollected < grandTotal) {
      status = "PARTIALLY_PAID";
    } else {
      status = "DELIVERED";
    }

    // 7) Save bill
    const billDoc = new BillModel({
      invoiceNumber,
      billDate,
      customerInfo: customerSnapshot,
      companyGstNumber: body.companyGstNumber,
      items: lineItems,
      totalItems,
      totalBeforeTax,
      totalTax,
      grandTotal,
      payment: paymentInfo,
      driver: body.driverId ?? undefined,
      vehicleNumber: body.vehicleNumber ?? undefined,
      amountCollected,
      balanceAmount,
      status,
    });

    await billDoc.save();

    const billSummary: BillSummary = {
      _id: billDoc._id.toString(),
      invoiceNumber: billDoc.invoiceNumber,
      billDate: billDoc.billDate.toISOString(),
      grandTotal: billDoc.grandTotal,
    };

    return NextResponse.json(
      { bill: billSummary },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Billing POST error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// ----------------- GET: list / history -----------------

export async function GET(
  req: NextRequest
): Promise<NextResponse<{ bills: BillDocument[] } | { error: string }>> {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const customerQuery = searchParams.get("customer");
    const phoneQuery = searchParams.get("phone");

    const filter: Record<string, unknown> = {};

    if (customerQuery) {
      filter["customerInfo.name"] = {
        $regex: customerQuery,
        $options: "i",
      };
    }
    if (phoneQuery) {
      filter["customerInfo.phone"] = {
        $regex: phoneQuery,
        $options: "i",
      };
    }

    const bills = await BillModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();

    return NextResponse.json({ bills });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
