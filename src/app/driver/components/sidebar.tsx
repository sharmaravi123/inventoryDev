// app/driver/components/sidebar.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { Menu, LogOut, ListChecks, ListOrdered } from "lucide-react";
import { logoutUser } from "@/store/authSlice";
import type { AppDispatch } from "@/store/store";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/driver",
    label: "Today Orders",
    icon: <ListChecks size={18} />,
  },
  {
    href: "/driver/orders",
    label: "All Orders",
    icon: <ListOrdered size={18} />,
  },
];

const DriverSidebar: React.FC = () => {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  const linkClass = (href: string) => {
    const active =
      pathname === href ||
      pathname === `${href}/` ||
      pathname.startsWith(`${href}/`);

    return [
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 truncate",
      active
        ? "bg-[var(--color-primary)] text-white shadow-md"
        : "text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral)]",
    ].join(" ");
  };

  const SidebarContent = useMemo(
    () => (
      <nav className="flex flex-col h-full lg:mt-14">
        <div className="px-4 py-6 flex-1">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass(item.href)}>
                  <span className="text-[var(--text-secondary)]">
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-4 py-4 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
          <p className="mt-3 text-xs text-[var(--text-secondary)] text-center">
            © {new Date().getFullYear()} BlackOS Inventory
          </p>
        </div>
      </nav>
    ),
    [pathname]
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setMobileOpen((state) => !state)}
          className="p-2 rounded-md bg-white shadow text-[var(--text-primary)]"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white border-r border-[var(--border-color)] min-h-screen fixed left-0 top-0">
        <div className="h-full overflow-y-auto">{SidebarContent}</div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              ref={sidebarRef}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg"
            >
              <div className="h-full overflow-y-auto">{SidebarContent}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setMobileOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default DriverSidebar;
