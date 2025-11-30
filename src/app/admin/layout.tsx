// src/app/admin/layout.tsx
"use client";
export const dynamic = "force-dynamic";

import "../globals.css";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

// export const metadata = {
//   title: "Admin Dashboard | BlackOSInventory",
//   description: "Admin dashboard",
// };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const authRole = useSelector((state: RootState) => state.auth.role);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // client-side guard
    let storedRole: string | null = null;

    if (typeof window !== "undefined") {
      storedRole = window.localStorage.getItem("admin_role");
    }

    // Redux role ya localStorage me admin hai to allow
    if (authRole === "admin" || storedRole === "admin") {
      setChecked(true);
      return;
    }

    // otherwise login page
    router.replace("/");
  }, [authRole, router]);

  // Jab tak check nahi hua, kuch render mat karo (flash avoid)
  if (!checked) {
    return null;
  }

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
