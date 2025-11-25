// server component
import React from "react";
import "../globals.css";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export const metadata = {
  title: "Warehouse Dashboard | BlackOSInventory",
  description: "Warehouse dashboard",
};

interface JwtPayload {
  sub?: string;
  role?: string;
  iat?: number;
  exp?: number;
  access?: { level?: string; permissions?: string[] };
  warehouses?: Array<{ _id: string; name?: string }>;
}

export default async function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("token")?.value ?? null;
  if (!token) redirect("/");

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET ?? "") as JwtPayload;
    if (!payload || payload.role !== "user" || !payload.sub) redirect("/");
  } catch (err) {
    redirect("/");
  }

  // Try to use permissions from JWT first (faster). If not present, load user from DB and derive permissions.
  let allowedPerms: string[] = [];
  let warehouses: Array<{ _id: string; name?: string }> = [];

  if (payload.access?.permissions && payload.access.permissions.length > 0) {
    allowedPerms = payload.access.permissions;
  } else {
    // fallback: load user from DB once
    try {
      await dbConnect();
      const user = await User.findById(payload.sub).select("-password").populate("warehouses", "name").lean();
      if (!user) redirect("/");
      warehouses = Array.isArray(user.warehouses) ? user.warehouses.map((w: unknown) => {
        const warehouse = w as { _id: { toString(): string }; name: string };
        return { _id: warehouse._id.toString(), name: warehouse.name };
      }) : [];
      allowedPerms = user.access?.permissions ?? [];
      // If user must have at least one warehouse to enter:
      if (!warehouses.length) redirect("/");
    } catch (err) {
      console.error("Warehouse layout error:", err);
      redirect("/");
    }
  }

  // map permission -> route path used by Sidebar and server checks
  const permToPathMap: Record<string, string> = {
    inventory: "/warehouse/inventory",
    orders: "/warehouse/orders",
    reports: "/warehouse/reports",
    billing: "/warehouse/billing",
  };

  const allowedPaths = allowedPerms.map(p => permToPathMap[p]).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-neutral)]">
      <Topbar />
      <div className="flex flex-1">
        {/* pass allowedPerms & allowedPaths to client Sidebar so it only shows allowed links */}
        <Sidebar allowedPerms={allowedPerms} allowedPaths={allowedPaths} />
        <main className="flex-1 p-6 lg:ml-64 overflow-y-auto bg-[var(--color-neutral)]">
          {children}
        </main>
      </div>
    </div>
  );
}
