// src/app/api/billing/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import BillModel, {
  BillDocument,
  BillItem,
  PaymentInfo,
} from "@/models/Bill";
import type { CreateBillPaymentInput } from "../route";

type UpdateBillCustomerInput = {
  name: string;
  shopName?: string;
  phone: string;
  address: string;
  gstNumber?: string;
};

type UpdateBillItemInput = {
  stockId: string;
  productId: string;
  warehouseId: string;
  productName: string;
  sellingPrice: number;
  taxPercent: number;
  quantityBoxes: number;
  quantityLoose: number;
  itemsPerBox: number;
};

type UpdateBillRequestBody = {
  customer?: UpdateBillCustomerInput;
  companyGstNumber?: string;
  billDate?: string;
  items?: UpdateBillItemInput[];

  payment?: CreateBillPaymentInput;
  driverId?: string;
  vehicleNumber?: string;
  status?: "PENDING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "PARTIALLY_PAID";
  amountCollected?: number;
};

type BillResponseBody = {
  bill: BillDocument;
};

function validatePaymentForUpdate(
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
    throw new Error("Collected amount cannot exceed grand total");
  }

  return {
    mode,
    cashAmount,
    upiAmount,
    cardAmount,
  };
}

function deriveStatus(
  amountCollected: number,
  grandTotal: number,
  explicit?: UpdateBillRequestBody["status"]
): BillDocument["status"] {
  if (explicit) return explicit;
  if (amountCollected === 0) return "PENDING";
  if (amountCollected >= grandTotal) return "DELIVERED";
  return "PARTIALLY_PAID";
}

type CalculatedLine = {
  item: BillItem;
  totalItems: number;
  totalBeforeTax: number;
  taxAmount: number;
  lineTotal: number;
};

function calculateLine(input: UpdateBillItemInput): CalculatedLine {
  const totalItems =
    input.quantityBoxes * input.itemsPerBox + input.quantityLoose;

  const gross = totalItems * input.sellingPrice;

  let taxAmount = 0;
  let totalBeforeTax = gross;

  if (input.taxPercent > 0) {
    taxAmount =
      (gross * input.taxPercent) / (100 + input.taxPercent);
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

// ✅ FIXED: context.params is Promise<{ id: string }>
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<BillResponseBody | { error: string }>> {
  try {
    await dbConnect();

    const { id } = await context.params;

    const bill = await BillModel.findById(id).exec();

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ bill });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// ✅ FIXED: same signature change for PUT
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<BillResponseBody | { error: string }>> {
  try {
    await dbConnect();

    const { id } = await context.params;

    const existing = await BillModel.findById(id).exec();

    if (!existing) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    const body = (await req.json()) as UpdateBillRequestBody;

    // 1) Customer snapshot update (optional)
    if (body.customer) {
      existing.customerInfo.name = body.customer.name;
      existing.customerInfo.shopName = body.customer.shopName;
      existing.customerInfo.phone = body.customer.phone;
      existing.customerInfo.address = body.customer.address;
      existing.customerInfo.gstNumber = body.customer.gstNumber;
    }

    // 2) Company GST / billDate update (optional)
    if (typeof body.companyGstNumber === "string") {
      existing.companyGstNumber = body.companyGstNumber;
    }

    if (body.billDate) {
      const newDate = new Date(body.billDate);
      if (!Number.isNaN(newDate.getTime())) {
        existing.billDate = newDate;
      }
    }

    // 3) Items + totals update (optional)
    let itemsChanged = false;

    if (body.items && body.items.length > 0) {
      itemsChanged = true;

      let totalItems = 0;
      let totalBeforeTax = 0;
      let totalTax = 0;
      let grandTotal = 0;

      const newItems = body.items.map((input) => {
        const calculated = calculateLine(input);
        totalItems += calculated.totalItems;
        totalBeforeTax += calculated.totalBeforeTax;
        totalTax += calculated.taxAmount;
        grandTotal += calculated.lineTotal;
        return calculated.item;
      });

      existing.items = newItems as unknown as BillDocument["items"];
      existing.totalItems = totalItems;
      existing.totalBeforeTax = totalBeforeTax;
      existing.totalTax = totalTax;
      existing.grandTotal = grandTotal;
    }

    const grandTotal = existing.grandTotal;

    // 4) Payment / status handling
    if (body.payment) {
      const updatedPayment = validatePaymentForUpdate(
        body.payment,
        grandTotal
      );

      existing.payment = updatedPayment;

      const collected =
        (updatedPayment.cashAmount ?? 0) +
        (updatedPayment.upiAmount ?? 0) +
        (updatedPayment.cardAmount ?? 0);

      existing.amountCollected = collected;
      existing.balanceAmount = grandTotal - collected;
      existing.status = deriveStatus(
        collected,
        grandTotal,
        body.status
      );
    } else if (typeof body.amountCollected === "number") {
      const collected = body.amountCollected;
      if (collected < 0) {
        return NextResponse.json(
          { error: "Collected amount cannot be negative" },
          { status: 400 }
        );
      }
      if (collected > grandTotal) {
        return NextResponse.json(
          { error: "Collected amount cannot exceed grand total" },
          { status: 400 }
        );
      }

      existing.amountCollected = collected;
      existing.balanceAmount = grandTotal - collected;
      existing.status = deriveStatus(
        collected,
        grandTotal,
        body.status
      );
    } else if (itemsChanged) {
      const currentPayment: CreateBillPaymentInput = {
        mode: existing.payment.mode,
        cashAmount: existing.payment.cashAmount,
        upiAmount: existing.payment.upiAmount,
        cardAmount: existing.payment.cardAmount,
      };

      const adjustedPayment = validatePaymentForUpdate(
        currentPayment,
        grandTotal
      );

      existing.payment = adjustedPayment;

      const collected =
        (adjustedPayment.cashAmount ?? 0) +
        (adjustedPayment.upiAmount ?? 0) +
        (adjustedPayment.cardAmount ?? 0);

      existing.amountCollected = collected;
      existing.balanceAmount = grandTotal - collected;
      existing.status = deriveStatus(
        collected,
        grandTotal,
        body.status
      );
    } else if (body.status) {
      existing.status = body.status;
    }

    // 5) Driver / vehicle assignment updates
    if (body.driverId) {
      existing.driver = new Types.ObjectId(body.driverId);
    }

    if (body.vehicleNumber) {
      existing.vehicleNumber = body.vehicleNumber;
    }

    await existing.save();

    return NextResponse.json({ bill: existing });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
