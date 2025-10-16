import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";

// reusable type for Next 15+ route handler
type RouteCtx<T extends Record<string, string>> =
  | { params: T }
  | { params: Promise<T> };

export async function GET(req: NextRequest, context: RouteCtx<{ id: string }>) {
  const params = await context.params;
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json(product, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteCtx<{ id: string }>) {
  const params = await context.params;
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const payload = verifyTokenFromReq(req);
  if (!payload || !requireAdminOrWarehouse(payload))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, categoryId, purchasePrice, sellingPrice, description } = await req.json();
    const data: any = {};
    if (name) data.name = name;
    if (categoryId) data.categoryId = categoryId;
    if (purchasePrice) data.purchasePrice = Number(purchasePrice);
    if (sellingPrice) data.sellingPrice = Number(sellingPrice);
    if (description !== undefined) data.description = description;

    const updated = await prisma.product.update({ where: { id }, data });
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteCtx<{ id: string }>) {
  const params = await context.params;
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const payload = verifyTokenFromReq(req);
  if (!payload || !requireAdminOrWarehouse(payload))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 500 });
  }
}
