// app/api/warehouse/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

    const warehouse = await prisma.warehouse.findUnique({ where: { username } });
    if (!warehouse) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const valid = await bcrypt.compare(password, warehouse.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = jwt.sign({ id: warehouse.id, role: "warehouse" }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    return NextResponse.json({ success: true, token, warehouse: { id: warehouse.id, name: warehouse.name } });
  } catch (err) {
    console.error("Warehouse login error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
