// app/api/warehouse/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Warehouse from "@/models/Warehouse";
import { ensureAdmin, verifyAndGetUser } from "@/lib/authorize";

type MaybePromiseParams = { id: string } | Promise<{ id: string }>;

async function getIdFromContext(context: { params: MaybePromiseParams }) {
  const params = await Promise.resolve(context.params);
  return params.id;
}

export async function PUT(
  req: NextRequest,
  context: { params: MaybePromiseParams }
) {
  try {
    const user = await verifyAndGetUser(req);
    ensureAdmin(user);

    const id = await getIdFromContext(context);

    const { name, address, meta } = (await req.json()) as {
      name?: string;
      address?: string;
      meta?: Record<string, unknown>;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid warehouse ID" }, { status: 400 });
    }

    await dbConnect();

    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { $set: { name, address, meta } },
      { new: true }
    );

    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, warehouse }, { status: 200 });
  } catch (err: unknown) {
    console.error("Warehouse update error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: MaybePromiseParams }
) {
  try {
    const user = await verifyAndGetUser(req);
    ensureAdmin(user);

    const id = await getIdFromContext(context);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid warehouse ID" }, { status: 400 });
    }

    await dbConnect();

    const deleted = await Warehouse.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("Warehouse delete error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
