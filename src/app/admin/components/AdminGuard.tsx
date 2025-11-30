"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const authRole = useSelector((state: RootState) => state.auth.role);

  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let storedRole: string | null = null;

    if (typeof window !== "undefined") {
      storedRole = window.localStorage.getItem("admin_role");
    }

    if (authRole === "admin" || storedRole === "admin") {
      setAllowed(true);
      setChecked(true);
      return;
    }

    setAllowed(false);
    setChecked(true);
    router.replace("/");
  }, [authRole, router]);

  if (!checked) {
    // guard check ho raha hai, kuch bhi mat dikhाओ
    return null;
  }

  if (!allowed) {
    // redirect ho chuka hoga
    return null;
  }

  return <>{children}</>;
}
