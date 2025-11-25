import { NextResponse } from "next/server";
import cookie from "cookie";

/**
 * POST /api/auth/logout
 * Clears the `token` cookie.
 */
export async function POST() {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const cookieStr = cookie.serialize("token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    const res = NextResponse.json({ success: true });
    res.headers.set("Set-Cookie", cookieStr);
    return res;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: (err as Error).message || "Server error" }, { status: 500 });
  }
}
