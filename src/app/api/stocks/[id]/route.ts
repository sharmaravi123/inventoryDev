// src/app/api/stocks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Stock from "@/models/Stock";
import { getUserFromTokenOrDb, ensureHasAccess } from "@/lib/access";

function normalize(n: unknown, fallback = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

/** Strict warehouse type */
interface UserWarehouse {
  _id: string;
}

/** Strict user type */
interface UserType {
  role?: string;
  access?: { level?: string };
  warehouses?: UserWarehouse[];
}

/** Handles Next.js promise/normal param */
async function resolveParams(input: { params: unknown } | undefined) {
  if (!input) return null;

  const raw = input.params;
  const finalValue =
    raw && typeof (raw as Promise<unknown>).then === "function"
      ? await (raw as Promise<unknown>)
      : raw;

  if (!finalValue || typeof finalValue !== "object") return null;

  const id = (finalValue as { id?: unknown }).id;

  return typeof id === "string" ? id : null;
}

export async function PUT(req: NextRequest, ctx: { params: unknown }) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value ?? null;

    await ensureHasAccess(token, { perm: "inventory" });

    const user = (await getUserFromTokenOrDb(token ?? undefined)) as UserType | null;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const id = await resolveParams(ctx);
    if (!id) {
      return NextResponse.json({ error: "Missing id param" }, { status: 400 });
    }

    const body = await req.json();

    const existing = await Stock.findById(id).exec();
    if (!existing) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    // warehouse permission check
    if (user.access?.level !== "all" && user.role !== "admin") {
      const warehouses = user.warehouses ?? [];

      const allowedIds = warehouses.map((w): string => String(w._id));

      if (!allowedIds.includes(String(existing.warehouseId))) {
        return NextResponse.json(
          { error: "Forbidden", detail: "Not allowed to modify this stock" },
          { status: 403 }
        );
      }
    }

    const boxes = normalize(body.boxes ?? existing.boxes, existing.boxes);
    const itemsPerBox = Math.max(1, normalize(body.itemsPerBox ?? existing.itemsPerBox, existing.itemsPerBox));
    let looseItems = Math.max(0, normalize(body.looseItems ?? existing.looseItems, existing.looseItems));

    const lowStockItems =
      typeof body.lowStockItems === "number" ? normalize(body.lowStockItems, 0) : existing.lowStockItems;

    const lowStockBoxes =
      typeof body.lowStockBoxes === "number" ? normalize(body.lowStockBoxes, 0) : existing.lowStockBoxes;

    const tax = normalize(body.tax ?? existing.tax, existing.tax);

    if (itemsPerBox > 0 && looseItems >= itemsPerBox) {
      const extra = Math.floor(looseItems / itemsPerBox);
      looseItems = looseItems % itemsPerBox;
      // NOTE: boxes += extra; (if required)
    }

    const totalItems = boxes * itemsPerBox + looseItems;

    existing.boxes = boxes;
    existing.itemsPerBox = itemsPerBox;
    existing.looseItems = looseItems;
    existing.totalItems = totalItems;
    existing.lowStockItems = lowStockItems ?? null;
    existing.lowStockBoxes = lowStockBoxes ?? null;
    existing.tax = tax;

    const saved = await existing.save();
    const out = saved.toObject();

    out._id = String(out._id);
    out.productId = String(out.productId);
    out.warehouseId = String(out.warehouseId);

    return NextResponse.json(out, { status: 200 });
  } catch (err) {
    console.error("PUT ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update stock" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: { params: unknown }) {
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value ?? null;
    await ensureHasAccess(token, { perm: "inventory" });

    const user = (await getUserFromTokenOrDb(token ?? undefined)) as UserType | null;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const id = await resolveParams(ctx);
    if (!id) {
      return NextResponse.json({ error: "Missing id param" }, { status: 400 });
    }

    const existing = await Stock.findById(id).exec();
    if (!existing) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    if (user.access?.level !== "all" && user.role !== "admin") {
      const warehouses = user.warehouses ?? [];
      const allowedIds = warehouses.map((w): string => String(w._id));

      if (!allowedIds.includes(String(existing.warehouseId))) {
        return NextResponse.json(
          { error: "Forbidden", detail: "Not allowed to delete this stock" },
          { status: 403 }
        );
      }
    }

    await existing.deleteOne();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete stock" },
      { status: 500 }
    );
  }
}
