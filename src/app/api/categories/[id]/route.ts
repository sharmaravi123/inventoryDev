import { NextRequest, NextResponse } from "next/server";
import Category from "@/models/Category";
import { verifyTokenFromReq, requireAdminOrWarehouse } from "@/lib/token";
import dbConnect from "@/lib/mongodb";

type MaybePromiseParams = { id: string } | Promise<{ id: string }>;

async function getIdFromContext(context: { params: MaybePromiseParams }) {
  // Works whether context.params is a plain object or a Promise
  const params = await Promise.resolve(context.params);
  return params.id;
}

export async function GET(
  req: NextRequest,
  context: { params: MaybePromiseParams }
) {
  try {
    const id = await getIdFromContext(context);

    await dbConnect();
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category, { status: 200 });
  } catch (err) {
    console.error("GET /api/categories/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: MaybePromiseParams }
) {
  try {
    const id = await getIdFromContext(context);

    await dbConnect();
    const payload = verifyTokenFromReq(req);
    if (!requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();
    const updated = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/categories/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: MaybePromiseParams }
) {
  try {
    const id = await getIdFromContext(context);

    await dbConnect();
    const payload = verifyTokenFromReq(req);
    if (!requireAdminOrWarehouse(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/categories/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 });
  }
}
