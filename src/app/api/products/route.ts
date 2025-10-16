import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";
import { randomBytes } from "crypto";

// GET all products
export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({ orderBy: { id: "desc" }, include: { category: true } });
    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST create product
export async function POST(req: NextRequest) {
  try {
    const payload = verifyTokenFromReq(req);
    if (!payload || !requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, categoryId, purchasePrice, sellingPrice, description } = await req.json();
    if (!name || !categoryId || !purchasePrice || !sellingPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const sku = "SKU-" + randomBytes(4).toString("hex").toUpperCase();

    const data: any = {
      name,
      sku,
      categoryId,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      description: description || null,
    };

    if (payload.role === "ADMIN") data.createdByAdminId = payload.id;
    if (payload.role === "WAREHOUSE") data.createdByWarehouseId = payload.id;

    const product = await prisma.product.create({ data });
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}
