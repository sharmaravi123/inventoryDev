import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { Document } from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

interface LoginBody {
  email?: string;
  password?: string;
}

interface JwtPayload {
  sub: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Minimal shape for a warehouse returned by population.
 * _id can be any mongoose id type, we'll string-cast it when sending to client.
 */
interface Warehouse {
  _id: unknown;
  name: string;
}

/**
 * User document shape used in this handler.
 * We include the optional password field because we `.select("+password")` for verification.
 */
interface UserDoc extends Document {
  _id: unknown;
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  warehouses?: Warehouse[];
  access?: Record<string, unknown>;
}

const JWT_SECRET = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) {
  // In production ensure JWT_SECRET is provided; token creation will fail predictably otherwise.
}

/**
 * POST /api/auth/login
 * Accepts JSON { email, password }.
 * On success: sets HttpOnly cookie "token" and returns user (without password).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await dbConnect();

    // include password for verification, and populate warehouses (only name)
    const userDoc = (await User.findOne({ email })
      .select("+password")
      .populate("warehouses", "name")) as UserDoc | null;

    if (!userDoc) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const hashedPassword = userDoc.password ?? "";
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // create token payload and sign
    const payload: JwtPayload = { sub: String(userDoc._id), role: userDoc.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // Remove sensitive fields before sending user to client
    const userSafe = {
      id: String(userDoc._id),
      name: userDoc.name ?? "",
      email: userDoc.email ?? "",
      role: userDoc.role ?? "",
      warehouses: (userDoc.warehouses ?? []).map((w: Warehouse) => ({
        _id: String(w._id),
        name: w.name,
      })),
      access: userDoc.access ?? {},
    };

    const isProd = process.env.NODE_ENV === "production";
    const cookieStr = cookie.serialize("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    const res = NextResponse.json({ success: true, user: userSafe }, { status: 200 });
    res.headers.set("Set-Cookie", cookieStr);
    return res;
  } catch (err) {
    console.error("Auth login error:", err);
    return NextResponse.json({ error: (err as Error).message || "Server error" }, { status: 500 });
  }
}
