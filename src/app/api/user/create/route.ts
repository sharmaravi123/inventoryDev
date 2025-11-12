// ./src/app/api/user/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Warehouse from "@/models/Warehouse";

function genRandomPassword(len = 12) {
  return crypto.randomBytes(len).toString("base64").slice(0, len);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password, // optional
      role = "user",
      warehouseId, // single warehouse id (optional)
      access = { level: "limited", permissions: [] },
    } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: "admin" | "user";
      warehouseId?: string;
      access?: { level: "all" | "limited"; permissions: string[] };
    };

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields (name, email)" }, { status: 400 });
    }

    await dbConnect();

    // Validate single warehouse if provided
    let whIds: string[] = [];
    if (warehouseId) {
      const found = await Warehouse.findById(warehouseId).select("_id").lean();
      if (!found) {
        return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
      }
      whIds = [warehouseId];
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // If password not provided, generate one (we don't return it in response).
    const plain = password && password.trim() ? password : genRandomPassword(12);
    const hashed = await bcrypt.hash(plain, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role,
      warehouses: whIds, // store as array with single id or empty array
      access,
    });

    const populated = await User.findById(user._id).select("-password").populate("warehouses", "name").lean();

    return NextResponse.json({ success: true, message: "User created", user: populated }, { status: 201 });
  } catch (error: any) {
    console.error("User create error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
