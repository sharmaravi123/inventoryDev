// app/admin/layout.tsx  (server component)
import "../globals.css";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import React from "react";

export const metadata = {
  title: "Admin Dashboard | BlackOSInventory",
  description: "Admin dashboard",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // server-side cookie read
  const token = (await cookies()).get("token")?.value ?? null;

  // If no token -> redirect to login page immediately (server-side)
  if (!token) {
    redirect("/");
  }

  // Optionally verify token and role; if invalid -> redirect
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "") as any;
    if (!payload || payload.role !== "admin") {
      // invalid or not admin -> redirect
      redirect("/");
    }
  } catch (err) {
    // invalid token -> redirect
    redirect("/");
  }

  // If we reach here, token is present and valid (server-side)
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-neutral)]">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64 overflow-y-auto bg-[var(--color-neutral)]">
          {children}
        </main>
      </div>
    </div>
  );
}
