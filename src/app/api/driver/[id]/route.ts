// src/app/api/drivers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import DriverModel from "@/models/Driver";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const driver = await DriverModel.findById(id).select("-password");

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ driver });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error fetching driver";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      vehicleNumber: body.vehicleNumber,
      vehicleType: body.vehicleType,
      isActive: body.isActive,
    };

    // if password provided, hash it
    if (typeof body.password === "string" && body.password.trim().length >= 6) {
      const hashed = await bcrypt.hash(body.password.trim(), 10);
      updates.password = hashed;
    }

    const updatedDriver = await DriverModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).select("-password");

    if (!updatedDriver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ driver: updatedDriver });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error updating driver";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
 context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid driver ID" },
        { status: 400 }
      );
    }

    const result = await DriverModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error deleting driver";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
