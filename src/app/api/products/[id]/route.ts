import { NextRequest, NextResponse } from "next/server";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

// ✅ Define types
type RouteCtx<T extends Record<string, string>> =
  | { params: T }
  | { params: Promise<T> };

interface Category {
  _id: string;
  name: string;
}

interface ProductDoc {
  _id: string;
  name: string;
  categoryId?: Category | string;
  purchasePrice?: number;
  sellingPrice?: number;
  description?: string;
}

// =============================
// 🔹 GET PRODUCT BY ID
// =============================
export async function GET(req: NextRequest, context: RouteCtx<{ id: string }>) {
  const params = await context.params;
  const { id } = params;

  try {
    await dbConnect();

    const product = (await Product.findById(id)
      .populate("categoryId", "name")
      .lean()) as ProductDoc | null;

    if (!product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const formatted = {
      ...product,
      id: product._id.toString(),
      category:
        typeof product.categoryId === "object" && product.categoryId
          ? {
              id: (product.categoryId as Category)._id,
              name: (product.categoryId as Category).name,
            }
          : null,
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// =============================
// 🔹 UPDATE PRODUCT
// =============================
export async function PUT(req: NextRequest, context: RouteCtx<{ id: string }>) {
  const params = await context.params;
  const { id } = params;

  const payload = verifyTokenFromReq(req);
  if (!payload || !requireAdminOrWarehouse(payload))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const {
      name,
      categoryId,
      purchasePrice,
      sellingPrice,
      description,
    } = await req.json();

    const updateData: Partial<ProductDoc> = {};
    if (name) updateData.name = name;
    if (categoryId) updateData.categoryId = categoryId;
    if (purchasePrice) updateData.purchasePrice = Number(purchasePrice);
    if (sellingPrice) updateData.sellingPrice = Number(sellingPrice);
    if (description !== undefined) updateData.description = description;

    const updated = (await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("categoryId", "name")
      .lean()) as ProductDoc | null;

    if (!updated)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const formatted = {
      ...updated,
      id: updated._id.toString(),
      category:
        typeof updated.categoryId === "object" && updated.categoryId
          ? {
              id: (updated.categoryId as Category)._id,
              name: (updated.categoryId as Category).name,
            }
          : null,
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// =============================
// 🔹 DELETE PRODUCT
// =============================
export async function DELETE(
  req: NextRequest,
  context: RouteCtx<{ id: string }>
) {
  const params = await context.params;
  const { id } = params;

  const payload = verifyTokenFromReq(req);
  if (!payload || !requireAdminOrWarehouse(payload))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
