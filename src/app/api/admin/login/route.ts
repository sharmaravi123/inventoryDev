// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    await dbConnect();
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const adminDoc = admin as any;

    // ensure role is present in token payload
    const token = signToken({ id: adminDoc._id.toString(), role: "admin" });

    const res = NextResponse.json({
      success: true,
      admin: { id: adminDoc._id.toString(), name: adminDoc.name, email: adminDoc.email, role: "admin" },
    });

    // Use sameSite: 'lax' in dev to avoid navigation blocking; secure true in production
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
