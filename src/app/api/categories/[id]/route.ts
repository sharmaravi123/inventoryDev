import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";

type MaybePromiseParams = { params: { id: string } } | { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: MaybePromiseParams) {
  const params = await ctx.params;
  const id = Number(params.id);

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category, { status: 200 });
  } catch (err) {
    console.error("GET /api/categories/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
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
    const { name, description } = await req.json();

    const updated = await prisma.category.update({
      where: { id },
      data: { name, description },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/categories/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 500 });
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
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/categories/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 });
  }
}
