import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";
import { randomBytes } from "crypto";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

// ✅ GET all products
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const products = await Product.find({})
      .populate("categoryId", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Normalize response (_id → id)
    const formatted = products.map((p: any) => ({
      ...p,
      id: p._id.toString(),
      category: p.categoryId ? { id: p.categoryId._id, name: p.categoryId.name } : null,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// ✅ POST create product
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const payload = verifyTokenFromReq(req);
    if (!payload || !requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, categoryId, purchasePrice, sellingPrice, description } = await req.json();
    if (!name || !categoryId || !purchasePrice || !sellingPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await Category.findById(categoryId);
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

    const product = await Product.create(data);

    const populated = await product.populate("categoryId", "name");

    return NextResponse.json(
      {
        ...populated.toObject(),
        id: populated._id.toString(),
        category: { id: populated.categoryId._id, name: populated.categoryId.name },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}
