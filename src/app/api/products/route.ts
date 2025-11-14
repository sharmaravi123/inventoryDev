// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

/**
 * Local Type definitions for lean/populated documents we return.
 * These reflect the plain objects returned by mongoose().lean() / .toObject()
 */
type ObjIdLike = string | { toString?: () => string };

interface LeanCategory {
  _id: ObjIdLike;
  name: string;
  id?: string;
}

interface LeanProduct {
  _id: ObjIdLike;
  name: string;
  sku?: string;
  categoryId?: LeanCategory | string | null;
  purchasePrice?: number;
  sellingPrice?: number;
  description?: string | null;
  createdByAdminId?: string | null;
  createdByWarehouseId?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number;
  taxPercent?: number | string | null;
}

/** Convert an ObjIdLike (string or ObjectId-like) to string safely */
function objIdToString(id: unknown): string {
  if (id == null) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object" && typeof (id as { toString?: unknown }).toString === "function") {
    try {
      return String((id as { toString: () => string }).toString());
    } catch {
      return String(id);
    }
  }
  return String(id);
}

/** Narrower shape for incoming categoryId object */
type IncomingCategoryIdObj = { _id: unknown };

/** Type guard for incoming categoryId object */
function isIncomingCategoryIdObj(x: unknown): x is IncomingCategoryIdObj {
  return typeof x === "object" && x !== null && Object.prototype.hasOwnProperty.call(x, "_id");
}

/* --------------------
   GET /api/products
   -------------------- */
export async function GET() {
  try {
    await dbConnect();

    // raw result typed as unknown then narrowed below to LeanProduct[]
    const raw = await Product.find({}).populate("categoryId", "name").sort({ createdAt: -1 }).lean();

    const products = raw as unknown as LeanProduct[];

    const formatted = products.map((p) => {
      // Normalize category object if populated
      const categoryObj =
        p?.categoryId && typeof p.categoryId === "object"
          ? {
              id: objIdToString((p.categoryId as LeanCategory)._id),
              name: (p.categoryId as LeanCategory).name,
            }
          : null;

      return {
        ...p,
        id: objIdToString(p._id),
        category: categoryObj,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

/* --------------------
   POST /api/products
   -------------------- */

type IncomingBody = {
  name?: unknown;
  categoryId?: unknown;
  purchasePrice?: unknown;
  sellingPrice?: unknown;
  description?: unknown;
  taxPercent?: unknown;
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json()) as IncomingBody;

    // support categoryId as either string or object { _id: '...' }
    const incomingCategoryId =
      typeof body.categoryId === "string"
        ? body.categoryId
        : isIncomingCategoryIdObj(body.categoryId)
        ? objIdToString(body.categoryId._id)
        : undefined;

    const name = typeof body.name === "string" ? body.name : undefined;
    const purchasePrice = body.purchasePrice !== undefined ? Number(body.purchasePrice as unknown) : undefined;
    const sellingPrice = body.sellingPrice !== undefined ? Number(body.sellingPrice as unknown) : undefined;
    const description = body.description === undefined ? null : String(body.description);
    const taxPercentRaw = body.taxPercent;

    if (!name || !incomingCategoryId || purchasePrice === undefined || sellingPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await Category.findById(incomingCategoryId);
    if (!category) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const tax =
      taxPercentRaw === undefined || taxPercentRaw === null ? 0 : Number(taxPercentRaw as unknown);
    if (Number.isNaN(tax) || tax < 0 || tax > 100) {
      return NextResponse.json({ error: "Invalid taxPercent (must be 0-100)" }, { status: 400 });
    }

    const sku = "SKU-" + randomBytes(4).toString("hex").toUpperCase();

    // build typed payload
    const data: {
      name: string;
      sku: string;
      categoryId: string;
      purchasePrice: number;
      sellingPrice: number;
      taxPercent: number;
      description: string | null;
    } = {
      name,
      sku,
      categoryId: incomingCategoryId,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      taxPercent: tax,
      description,
    };

    const product = await Product.create(data);
    const populated = await product.populate("categoryId", "name");

    // toObject returns plain object; narrow its type
    const obj = populated.toObject();

    const categoryField = populated.categoryId as LeanCategory | undefined;

    return NextResponse.json(
      {
        ...obj,
        id:
          obj._1d && typeof (obj as Record<string, unknown>)._1d === "object" && typeof (obj as Record<string, unknown>)._1d === "function"
            ? objIdToString((obj as Record<string, unknown>)._1d)
            : objIdToString((obj as Record<string, unknown>)._id),
        category: categoryField
          ? {
              id: objIdToString(categoryField._id),
              name: categoryField.name,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message || "Failed to create product" }, { status: 500 });
  }
}
