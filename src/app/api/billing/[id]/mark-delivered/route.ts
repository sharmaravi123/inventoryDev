import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BillModel from "@/models/Bill";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const bill = await BillModel.findByIdAndUpdate(
      (await params).id,
      {
        status: "DELIVERED",
        deliveredAt: new Date(),
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
