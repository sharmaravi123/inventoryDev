// src/app/api/driver/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import DriverModel, { DriverDocument } from "@/models/Driver";
import { Types } from "mongoose";

type RegisterDriverBody = {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
};

type DriverSafe = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
  isActive: boolean;
};

type SuccessBody = {
  driver: DriverSafe;
};

type ErrorBody = { error: string };
function toSafeDriver(doc: DriverDocument): DriverSafe {
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


export async function POST(
  req: NextRequest
): Promise<NextResponse<SuccessBody | ErrorBody>> {
  try {
    await dbConnect();

    const body = (await req.json()) as RegisterDriverBody;

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (!body.password || body.password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    if (!body.phone?.trim()) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      );
    }
    if (!body.vehicleNumber?.trim()) {
      return NextResponse.json(
        { error: "Vehicle number is required" },
        { status: 400 }
      );
    }

    const existing = await DriverModel.findOne({
      email: body.email.toLowerCase(),
    }).exec();

    if (existing) {
      return NextResponse.json(
        { error: "Driver with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const driver = new DriverModel({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      passwordHash,
      phone: body.phone.trim(),
      vehicleNumber: body.vehicleNumber.trim(),
      vehicleType: body.vehicleType?.trim(),
      isActive: true,
    });

    await driver.save();

    const driverSafe = toSafeDriver(driver);

    return NextResponse.json(
      { driver: driverSafe },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Driver register error:", message);
    return NextResponse.json(
      { error: "Failed to register driver" },
      { status: 500 }
    );
  }
}
