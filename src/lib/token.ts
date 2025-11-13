// src/lib/token.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "inventory_secret_key";

export type TokenPayload = {
  id: number;
  role?: "ADMIN" | "WAREHOUSE" | string;
  iat?: number;
  exp?: number;
};

export function getTokenFromReq(req?: NextRequest): string | null {
  // Server/edge: try NextRequest headers
  if (req) {
    try {
      const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
      if (!authHeader) return null;
      const parts = authHeader.split(" ");
      return parts.length === 2 ? parts[1] : null;
    } catch (err) {
      // safe fallback if headers access unexpectedly fails
      // console.warn allowed for debugging
      // eslint-disable-next-line no-console
      console.warn("getTokenFromReq: header read failed:", (err as Error)?.message ?? err);
      return null;
    }
  }

  // Browser fallback: localStorage
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    const stored = window.localStorage.getItem("token");
    if (!stored) return null;
    const parts = stored.split(" ");
    return parts.length === 2 ? parts[1] : stored;
  }

  return null;
}

export function verifyTokenFromReq(req?: NextRequest): TokenPayload | null {
  const token = getTokenFromReq(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload | string;

    if (typeof payload === "object" && payload !== null) {
      const p = payload as Record<string, unknown>;
      const id =
        typeof p.id === "number"
          ? p.id
          : typeof p.id === "string" && /^\d+$/.test(p.id)
          ? Number(p.id)
          : undefined;
      const role = typeof p.role === "string" ? p.role : undefined;

      if (typeof id === "number") {
        return {
          id,
          role,
          iat: typeof p.iat === "number" ? p.iat : undefined,
          exp: typeof p.exp === "number" ? p.exp : undefined,
        };
      }
    }

    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("verifyTokenFromReq error:", (err as Error)?.message ?? err);
    return null;
  }
}

export function requireAdminOrWarehouse(payload: TokenPayload | null): boolean {
  if (!payload || typeof payload.role !== "string") return false;
  const role = payload.role.toUpperCase();
  return role === "ADMIN" || role === "WAREHOUSE";
}
