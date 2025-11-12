// ./src/app/api/user/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Optional: log model info for debugging
    try {
      console.log("Mongoose model keys:", Object.keys((User as any).schema.paths));
    } catch (e) {
      console.log("Could not read schema paths:", e);
    }

    // ✅ Fetch only users with role "user" (exclude admins)
    const users = await User.find({ role: "user" })
      .populate("warehouses", "name")
      .lean();

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error("User list error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
