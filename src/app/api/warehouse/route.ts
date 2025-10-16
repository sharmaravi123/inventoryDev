// app/api/warehouse/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const token = auth.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      if (decoded.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const warehouses = await prisma.warehouse.findMany({
        where: { adminId: decoded.id },
        select: { id: true, name: true, username: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ warehouses });
    } catch (err: any) {
      console.error("Token verify error:", err.message);
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
