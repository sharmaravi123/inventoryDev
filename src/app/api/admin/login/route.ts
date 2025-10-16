// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = jwt.sign({ id: admin.id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    return NextResponse.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
