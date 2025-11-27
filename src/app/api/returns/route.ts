import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BillReturn, { BillReturnDocument } from "@/models/BillReturn";
import { Types } from "mongoose";

type ReturnItemResponse = {
  productName: string;
  quantityBoxes: number;
  quantityLoose: number;
  itemsPerBox: number;
  totalItems: number;
  unitPrice?: number;
  lineAmount?: number;
};

type ReturnRecordResponse = {
  _id: string;
  billId: string;
  invoiceNumber?: string;
  customerInfo: BillReturnDocument["customerInfo"];
  reason?: string;
  note?: string;
  items: ReturnItemResponse[];
  totalAmount?: number;
  createdAt: string;
};

type ReturnsResponseBody = {
  returns: ReturnRecordResponse[];
};

export async function GET(
  _req: NextRequest
): Promise<NextResponse<ReturnsResponseBody | { error: string }>> {
  try {
    await dbConnect();

    const docs = await BillReturn.find()
      .populate({ path: "bill", select: "invoiceNumber" })
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();

    type PopulatedBill = { invoiceNumber?: string };

    const returns: ReturnRecordResponse[] = docs.map((doc) => {
      const bill = doc.bill as PopulatedBill | Types.ObjectId;

      const invoiceNumber: string | undefined =
        typeof (bill as PopulatedBill).invoiceNumber === "string"
          ? (bill as PopulatedBill).invoiceNumber
          : undefined;

      return {
        _id: (doc._id as Types.ObjectId).toString(),
        billId: doc.bill.toString(),
        invoiceNumber,
        customerInfo: doc.customerInfo,
        reason: doc.reason,
        note: doc.note,
        totalAmount: doc.totalAmount,
        createdAt: doc.createdAt.toISOString(),
        items: doc.items.map((it) => ({
          productName: it.productName,
          quantityBoxes: it.quantityBoxes,
          quantityLoose: it.quantityLoose,
          itemsPerBox: it.itemsPerBox,
          totalItems: it.totalItems,
          unitPrice: it.unitPrice,
          lineAmount: it.lineAmount,
        })),
      };
    });

    return NextResponse.json({ returns });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Returns GET error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
