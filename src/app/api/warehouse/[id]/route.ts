// app/api/warehouse/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/**
 * Workaround for Next.js validator typing: context.params can be a plain object
 * OR a Promise that resolves to the object. Accept both and resolve if needed.
 */
type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function resolveParams(params: { id: string } | Promise<{ id: string }>) {
  // If it's a Promise-like, await it; otherwise return directly
  if (params && typeof (params as any).then === "function") {
    return (await params) as { id: string };
  }
  return params as { id: string };
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const name = body?.name;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const resolved = await resolveParams(context.params);
    const warehouseId = Number(resolved.id);
    if (Number.isNaN(warehouseId)) {
      return NextResponse.json({ error: "Invalid warehouse id" }, { status: 400 });
    }

    const updated = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, username: true, createdAt: true },
    });

    return NextResponse.json({ warehouse: updated }, { status: 200 });
  } catch (err: any) {
    console.error("Update warehouse error:", err);
    // Prisma unique / other errors could be handled individually if needed
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolved = await resolveParams(context.params);
    const warehouseId = Number(resolved.id);
    if (Number.isNaN(warehouseId)) {
      return NextResponse.json({ error: "Invalid warehouse id" }, { status: 400 });
    }

    await prisma.warehouse.delete({ where: { id: warehouseId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Delete warehouse error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
