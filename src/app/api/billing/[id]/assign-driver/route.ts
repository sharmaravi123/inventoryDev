import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BillModel from "@/models/Bill";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params; // ✅ FIX

    const { driverId } = await req.json();

    if (!driverId) {
      return NextResponse.json(
        { error: "Driver ID required" },
        { status: 400 }
      );
    }

    const bill = await BillModel.findByIdAndUpdate(
      id,
      {
        driver: driverId,          // same logic
        status: "OUT_FOR_DELIVERY",
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!bill) {
      return NextResponse.json(
        { error: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, bill });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
