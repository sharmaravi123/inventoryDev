import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Bill from "@/models/Bill";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const {
      billId,
      amountCollected,
      balanceAmount,
      payment,
    } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return NextResponse.json(
        { error: "Invalid Bill ID" },
        { status: 400 }
      );
    }

    const updated = await Bill.findByIdAndUpdate(
      billId,
      {
        $set: {
          amountCollected,
          balanceAmount,
          payment: {
            cashAmount: payment.cashAmount || 0,
            upiAmount: payment.upiAmount || 0,
            cardAmount: payment.cardAmount || 0,
          },
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
