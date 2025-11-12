// ./src/app/api/user/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await dbConnect();

    const deleted = await User.findByIdAndDelete(userId).lean();
    if (!deleted) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "User deleted" }, { status: 200 });
  } catch (e: any) {
    console.error("Delete user error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
