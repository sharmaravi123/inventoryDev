import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Warehouse from "@/models/Warehouse";
import { ensureAdmin, verifyAndGetUser } from "@/lib/authorize";

export async function POST(req: NextRequest) {
  try {
    const adminUser = await verifyAndGetUser(req);
    ensureAdmin(adminUser);

    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "user",
      warehouseId = null,
      access = { level: "limited", permissions: [] },
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    if (warehouseId) {
      const wh = await Warehouse.findById(warehouseId);
      if (!wh)
        return NextResponse.json(
          { error: "Warehouse not found" },
          { status: 404 }
        );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      warehouse: warehouseId,
      access, // store level + permissions
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          warehouse: user.warehouse,
          access: user.access,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("User create error:", error);
    const msg = error.message || "Unauthorized";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
