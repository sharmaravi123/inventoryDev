import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "inventory_secret_key";

export type TokenPayload = {
  id: number;
  role?: "ADMIN" | "WAREHOUSE" | string;
  iat?: number;
  exp?: number;
};

export function getTokenFromReq(req: NextRequest | any): string | null {
  const auth = req.headers.get("authorization") || req.headers.Authorization;
  if (!auth) return null;
  const parts = String(auth).split(" ");
  if (parts.length !== 2) return null;
  return parts[1];
}

export function verifyTokenFromReq(req: NextRequest | any): TokenPayload | null {
  const token = getTokenFromReq(req);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload;
  } catch (err) {
    console.error("verifyTokenFromReq error:", err);
    return null;
  }
}

export function requireAdminOrWarehouse(payload: TokenPayload | null) {
  if (!payload) return false;
  const role = (payload.role || "").toUpperCase();
  return role === "ADMIN" || role === "WAREHOUSE";
}
