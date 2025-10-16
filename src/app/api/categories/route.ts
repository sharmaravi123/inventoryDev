import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { id: "desc" } });
    return NextResponse.json(categories, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = verifyTokenFromReq(req);
    if (!payload || !requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const data: any = { name, description: description ?? null };
    if (payload.role?.toUpperCase() === "ADMIN") data.createdByAdminId = payload.id;
    if (payload.role?.toUpperCase() === "WAREHOUSE") data.createdByWarehouseId = payload.id;

    const created = await prisma.category.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json({ error: err.message || "Failed to create category" }, { status: 500 });
  }
}
