import { NextRequest, NextResponse } from "next/server";
import Category from "@/models/Category";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";
import dbConnect from "@/lib/mongodb";

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find().sort({ _id: -1 });
    return NextResponse.json(categories, { status: 200 });
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const payload = verifyTokenFromReq(req);
    if (!payload || !requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const data: Record<string, unknown> = { name, description: description ?? null };
    if (payload.role?.toUpperCase() === "ADMIN") data.createdByAdminId = payload.id;
    if (payload.role?.toUpperCase() === "WAREHOUSE") data.createdByWarehouseId = payload.id;

    const created = await Category.create(data);
    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json({ error: (err as Error).message || "Failed to create category" }, { status: 500 });
  }
}
