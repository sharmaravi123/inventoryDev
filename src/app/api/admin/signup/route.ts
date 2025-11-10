// ./src/app/api/admin/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      // access will use schema default
    });

    // Convert to plain object so we can safely access createdAt/updatedAt
    const adminObj = admin.toObject();

    return NextResponse.json(
      {
        success: true,
        admin: {
          id: adminObj._id?.toString(),
          name: adminObj.name,
          email: adminObj.email,
          createdAt: adminObj.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Admin register error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
