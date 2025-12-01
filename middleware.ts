import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/api/admin/login",
  "/api/admin/signup",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/warehouse",
  "/api/warehouse/create",
  "/api/categories",
  "/api/products",
  "/api/stocks",
  "/api/user/create",
  "/favicon.ico",
  "/robots.txt",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

interface TokenPayload {
  role?: string;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // internal assets ignore
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const isAdminUI =
    pathname === "/admin" || pathname.startsWith("/admin/");

  const token = req.cookies.get("token")?.value ?? null;

  if (!token) {
    if (isApi) {
      return NextResponse.json(
        { error: "Unauthorized - Missing token" },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  try {
    const secret =
      process.env.JWT_SECRET || "dev_inventory_secret_key";

    const payload = jwt.verify(token, secret) as TokenPayload;

    // ⚠️ yaha role ko ab "ADMIN" (uppercase) se check karo
    if (isAdminUI && payload.role !== "ADMIN") {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    if (isApi) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    const res = NextResponse.redirect(url);
    res.cookies.set("token", "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/api/:path*", "/admin", "/admin/:path*"],
};
