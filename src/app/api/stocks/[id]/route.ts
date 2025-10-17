// src/app/api/stocks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";

type RouteCtx<T extends Record<string, string>> =
  | { params: T }
  | { params: Promise<T> };

export async function GET(req: NextRequest, context: RouteCtx<{ id: string }>) {
  const params = await context.params;
  const id = Number(params.id);
  try{
    if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const stock = await prisma.stock.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });

    if (!stock) return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    return NextResponse.json(stock, { status: 200 });
  } catch (err) {
    console.error("GET /api/stocks/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteCtx<{ id: string }>) {
    const params = await context.params;
  const id = Number(params.id);
  try {
    const payload = verifyTokenFromReq(req);
    if (!payload || !requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const { boxes, itemsPerBox, looseItems, lowStockItems, lowStockBoxes } = body;

    const stock = await prisma.stock.findUnique({ where: { id } });
    if (!stock) return NextResponse.json({ error: "Stock not found" }, { status: 404 });

    if (itemsPerBox !== undefined && Number(itemsPerBox) <= 0)
      return NextResponse.json({ error: "itemsPerBox must be >= 1" }, { status: 400 });

    const newBoxes = boxes !== undefined ? Number(boxes) : stock.boxes;
    const newItemsPerBox = itemsPerBox !== undefined ? Number(itemsPerBox) : stock.itemsPerBox;
    const newLoose = looseItems !== undefined ? Number(looseItems) : stock.looseItems;
    const totalItems = newBoxes * newItemsPerBox + newLoose;

    const updated = await prisma.stock.update({
      where: { id },
      data: {
        boxes: newBoxes,
        itemsPerBox: newItemsPerBox,
        looseItems: newLoose,
        totalItems,
        lowStockItems: lowStockItems !== undefined ? Number(lowStockItems) : stock.lowStockItems,
        lowStockBoxes: lowStockBoxes !== undefined ? Number(lowStockBoxes) : stock.lowStockBoxes,
      },
      include: { product: true, warehouse: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PUT /api/stocks/[id] error:", err);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteCtx<{ id: string }>) {
    const params = await context.params;
  const id = Number(params.id);
  try {
    const payload = verifyTokenFromReq(req);
    if (!payload || !requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = Number(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await prisma.stock.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/stocks/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete stock" }, { status: 500 });
  }
}
