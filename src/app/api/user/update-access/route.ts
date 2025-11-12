// ./src/app/api/user/update-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Warehouse from "@/models/Warehouse";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, access, warehouseId, warehouseIds } = body as {
      userId?: string;
      access?: { level: "all" | "limited"; permissions: string[] };
      warehouseId?: string;
      warehouseIds?: string[] | string;
    };

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await dbConnect();

    // Normalize warehouse ids if provided (support single warehouseId OR warehouseIds array)
    let whIds: string[] | undefined;
    if (typeof warehouseId !== "undefined") {
      whIds = warehouseId ? [warehouseId] : [];
    } else if (typeof warehouseIds !== "undefined") {
      whIds = Array.isArray(warehouseIds) ? warehouseIds : warehouseIds ? [warehouseIds] : [];
    }

    if (whIds && whIds.length > 0) {
      const found = await Warehouse.find({ _id: { $in: whIds } }).select("_id").lean();
      if (found.length !== whIds.length) {
        return NextResponse.json({ error: "One or more warehouses not found" }, { status: 404 });
      }
    }

    const updateObj: any = {};
    if (access) updateObj.access = access;
    if (typeof whIds !== "undefined") updateObj.warehouses = whIds;

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: updateObj }, { new: true })
      .select("-password")
      .populate("warehouses", "name")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Update access error:", error);
    return NextResponse.json({ error: error?.message || "Server error" }, { status: 500 });
  }
}
