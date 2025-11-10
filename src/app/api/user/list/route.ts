import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ensureAdmin, verifyAndGetUser } from "@/lib/authorize";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const adminUser = await verifyAndGetUser(req);
    ensureAdmin(adminUser);

    await dbConnect();

    const users = await User.find().populate("warehouse", "name");
    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
