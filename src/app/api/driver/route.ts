// src/app/api/drivers/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import DriverModel, { DriverDocument } from "@/models/Driver";
import { Types } from "mongoose";

type DriverSummary = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
  isActive: boolean;
};

type SuccessBody = {
  drivers: DriverSummary[];
};

type ErrorBody = { error: string };

function toSummary(doc: DriverDocument): DriverSummary {
  return {
    _id: (doc._id as Types.ObjectId).toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    vehicleNumber: doc.vehicleNumber,
    vehicleType: doc.vehicleType,
    isActive: doc.isActive,
  };
}

export async function GET(
  _req: NextRequest
): Promise<NextResponse<SuccessBody | ErrorBody>> {
  try {
    await dbConnect();

    const drivers = await DriverModel.find()
      .sort({ createdAt: -1 })
      .exec();

    const summaries = drivers.map(toSummary);

    return NextResponse.json(
      { drivers: summaries },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Drivers list error:", message);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
