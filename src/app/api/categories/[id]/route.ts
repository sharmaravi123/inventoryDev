import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";

// Generic ctx type allowing either direct params or Promise<params>
type MaybePromiseParams = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: MaybePromiseParams) {
  const params = await ctx.params;
  const id = Number(params.id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true, // adjust as per your Prisma schema
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: MaybePromiseParams) {
  const params = await ctx.params;
  const id = Number(params.id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const payload = verifyTokenFromReq(req);
  if (!requireAdminOrWarehouse(payload)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.product.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: MaybePromiseParams) {
  const params = await ctx.params;
  const id = Number(params.id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const payload = verifyTokenFromReq(req);
  if (!requireAdminOrWarehouse(payload)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status: 500 });
  }
}
