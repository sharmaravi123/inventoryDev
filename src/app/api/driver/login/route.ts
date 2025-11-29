// src/app/api/driver/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import DriverModel, { DriverDocument } from "@/models/Driver";
import { Types } from "mongoose";

type LoginBody = {
  email: string;
  password: string;
};

type DriverSafe = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
};

type SuccessBody = {
  driver: DriverSafe;
  token: string;
};

type ErrorBody = { error: string };

// yaha SAME cookie name rakho jo admin/user use kar rahe hain
const COOKIE_NAME = "token";

function toSafeDriver(doc: DriverDocument): DriverSafe {
  return {
    _id: (doc._id as Types.ObjectId).toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    vehicleNumber: doc.vehicleNumber,
    vehicleType: doc.vehicleType,
  };
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<SuccessBody | ErrorBody>> {
  try {
    await dbConnect();

    const body = (await req.json()) as LoginBody;

    if (!body.email?.trim() || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const driver = await DriverModel.findOne({
      email: body.email.toLowerCase(),
      isActive: true,
    }).exec();

    if (!driver) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(
      body.password,
      driver.passwordHash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }


    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET env");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        sub: (driver._id as Types.ObjectId).toString(),
        role: "DRIVER", // IMPORTANT
      },
      secret,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json(
      {
        driver: toSafeDriver(driver),
        token,
      },
      { status: 200 }
    );

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Driver login error:", message);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
