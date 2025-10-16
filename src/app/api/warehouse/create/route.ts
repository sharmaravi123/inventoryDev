// app/api/warehouse/create/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or malformed authorization header" }, { status: 401 });
    }
    const token = auth.split(" ")[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, email, username, password } = await req.json();
    if (!name || !email || !username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check unique constraints (email or username)
    const existing = await prisma.warehouse.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        email,
        username,
        password: hashed,
        adminId: decoded.id, // IMPORTANT: use admin id from token
      },
      select: { id: true, name: true, username: true, email: true, createdAt: true },
    });

    return NextResponse.json({ success: true, warehouse }, { status: 201 });
  } catch (err: any) {
    console.error("Create warehouse error:", err);
    // Prisma unique error code handling
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
