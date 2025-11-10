// app/api/warehouse/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ensureAdmin, verifyAndGetUser } from "@/lib/authorize";
import Warehouse from "@/models/Warehouse";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAndGetUser(req); // will throw if token invalid
    ensureAdmin(user);

    const { name, address, meta } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await dbConnect();
    const existing = await Warehouse.findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Warehouse name already exists" }, { status: 400 });
    }

    const warehouse = await Warehouse.create({ name, address, meta });
    return NextResponse.json({ success: true, warehouse }, { status: 201 });
  } catch (error: any) {
    console.error("Warehouse create error:", error);
    const msg = error.message || "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
