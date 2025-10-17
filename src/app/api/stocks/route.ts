// src/app/api/stocks/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrWarehouse, verifyTokenFromReq } from "@/lib/token";

type Qs = { productId?: string | null; warehouseId?: string | null };

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const warehouseId = url.searchParams.get("warehouseId");

    const where: any = {};
    if (productId) where.productId = Number(productId);
    if (warehouseId) where.warehouseId = Number(warehouseId);

    const stocks = await prisma.stock.findMany({
      where,
      orderBy: { id: "desc" },
      include: { product: true, warehouse: true },
    });

    return NextResponse.json(stocks, { status: 200 });
  } catch (err) {
    console.error("GET /api/stocks error:", err);
    return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = verifyTokenFromReq(req);
    if (!payload || !requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      productId,
      warehouseId,
      boxes = 0,
      itemsPerBox = 1,
      looseItems = 0,
      lowStockItems,
      lowStockBoxes,
    } = body;

    if (!productId || !warehouseId) {
      return NextResponse.json({ error: "productId and warehouseId are required" }, { status: 400 });
    }
    if (Number(itemsPerBox) <= 0) {
      return NextResponse.json({ error: "itemsPerBox must be >= 1" }, { status: 400 });
    }

    // check uniqueness: one record per product+warehouse
    const existing = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId: Number(productId), warehouseId: Number(warehouseId) } },
    });

    if (existing) {
      return NextResponse.json({ error: "Stock for this product and warehouse already exists" }, { status: 409 });
    }

    const totalItems = Number(boxes) * Number(itemsPerBox) + Number(looseItems);

    const data: any = {
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      boxes: Number(boxes),
      itemsPerBox: Number(itemsPerBox),
      looseItems: Number(looseItems),
      totalItems,
      lowStockItems: lowStockItems !== undefined ? Number(lowStockItems) : null,
      lowStockBoxes: lowStockBoxes !== undefined ? Number(lowStockBoxes) : null,
    };

    if (payload.role?.toUpperCase() === "ADMIN") data.createdByAdminId = payload.id;
    if (payload.role?.toUpperCase() === "WAREHOUSE") data.createdByWarehouseId = payload.id;

    const created = await prisma.stock.create({
      data,
      include: { product: true, warehouse: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/stocks error:", err);
    return NextResponse.json({ error: err.message || "Failed to create stock" }, { status: 500 });
  }
}
