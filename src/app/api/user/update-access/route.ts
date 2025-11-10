import { ensureAdmin, verifyAndGetUser } from "@/lib/authorize";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/users/update-access
export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await verifyAndGetUser(req);
    ensureAdmin(adminUser);

    const { userId, access } = await req.json(); // { level: "limited", permissions: ["inventory", "orders"] }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      userId,
      { access },
      { new: true }
    );

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
