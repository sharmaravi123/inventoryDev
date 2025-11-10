// app/api/warehouse/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Warehouse from "@/models/Warehouse";
import { verifyAndGetUser, ensureAdmin } from "@/lib/authorize";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAndGetUser(req);
    ensureAdmin(user);

    await dbConnect();

    const warehouses = await Warehouse.find()
      .sort({ createdAt: -1 })
      .select("_id name address createdAt");

    return NextResponse.json({ success: true, warehouses }, { status: 200 });
  } catch (err: unknown) {
    console.error("Warehouse GET error:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
