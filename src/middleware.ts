import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // List of open (public) API routes
  const openRoutes = [
    "/api/admin/login",
    "/api/admin/signup",
    "/api/warehouse/create",
    "/api/warehouse",
    "/api/warehouse/login",
    "/api/auth/logout",
    "/api/categories",
  ];

  // Skip JWT check for these
  if (openRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Token check for protected APIs
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/:path*"], // applies to all API routes
};
