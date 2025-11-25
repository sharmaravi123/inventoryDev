import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

interface TokenPayload {
  sub: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "";

/**
 * GET /api/auth/me
 * Reads `token` cookie, verifies it, and returns the current user (without password).
 * Returns { user: null } if not authenticated.
 */
export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      console.warn("Invalid JWT in /api/auth/me:", err);
      return NextResponse.json({ user: null }, { status: 200 });
    }

    if (!payload?.sub) return NextResponse.json({ user: null }, { status: 200 });

    await dbConnect();

    const user = await User.findById(payload.sub).select("-password").populate("warehouses", "name").lean();
    if (!user) return NextResponse.json({ user: null }, { status: 200 });

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: (err as Error).message || "Server error" }, { status: 500 });
  }
}
