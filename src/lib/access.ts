// server helper to centralize token -> user + access checks
import jwt from "jsonwebtoken";
import dbConnect from "./mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";

interface JwtPayload {
  sub?: string;
  role?: string;
  access?: { permissions?: string[]; level?: string };
  warehouses?: unknown[];
}

export async function getUserFromTokenOrDb(token?: string) {
  if (!token) return null;
  let payload: JwtPayload | null = null;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET ?? "") as JwtPayload;
  } catch (e) {
    return null;
  }

  // If permissions exist in token, return minimal object
  if (payload && payload.sub && payload.access?.permissions) {
    return {
      _id: payload.sub,
      role: payload.role,
      access: payload.access,
      warehouses: payload.warehouses ?? [],
    };
  }

  // fallback: load from DB
  try {
    await dbConnect();
    const user = await User.findById(payload?.sub).select("-password").lean();
    if (!user) return null;
    return user;
  } catch (e) {
    console.error("getUserFromTokenOrDb error:", e);
    return null;
  }
}

/**
 * ensureHasAccess - call at top of server page components
 * If user isn't allowed to view `requiredPermOrPath` then redirect to /warehouse (or 403)
 *
 * Usage in a server page:
 * const token = cookies().get('token')?.value;
 * await ensureHasAccess(token, { perm: 'inventory' });
 */
export async function ensureHasAccess(token: string | null | undefined, opts: { perm?: string; path?: string }) {
  const user = await getUserFromTokenOrDb(token ?? undefined);
  if (!user) {
    redirect("/"); // not logged in
  }

  // dashboard always allowed for user role
  const { perm, path } = opts;
  if (!perm && !path) return;

  const allowedPermissions: string[] = user.access?.permissions ?? [];
  // if user has 'all' level then allow everything
  if (user.access?.level === "all") return;

  // check permission
  if (perm) {
    if (!allowedPermissions.includes(perm)) {
      // redirect to dashboard or show 403 UI (we choose redirect)
      redirect("/warehouse");
    }
  } else if (path) {
    // map path->perm if you like, or check allowedPaths if passed
    const permMap: Record<string, string> = {
      "/warehouse/inventory": "inventory",
      "/warehouse/product": "product",
      "/warehouse/orders": "orders",
      "/warehouse/reports": "reports",
      "/warehouse/billing": "billing",
    };
    const requiredPerm = permMap[path];
    if (requiredPerm && !allowedPermissions.includes(requiredPerm)) {
      redirect("/warehouse");
    }
  }
}
