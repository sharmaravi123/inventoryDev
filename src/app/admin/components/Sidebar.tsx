"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "@/store/authSlice";
import { AppDispatch } from "@/store/store";
import { useDispatch } from "react-redux";

const Sidebar: React.FC = () => {
  const [openMenu, setOpenMenu] = useState<string | null>("dashboards");
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();

  const toggleMenu = (menu: string) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      console.error("Logout failed", err);
    }
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    } catch { }
    // full reload so middleware runs with cleared cookie
    window.location.href = "/";
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium
     ${pathname === href
      ? "bg-[var(--color-primary)] text-white shadow"
      : "text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral)]"
    }`;

  const sections = [
    {
      key: "dashboards",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboards",
      items: [
        { href: "/admin", label: "Admin Dashboard" },
        { href: "/admin/warehouse", label: "Warehouse Manager" },
        { href: "/admin/user", label: "User Manager" },
        { href: "/admin/driver", label: "Driver Dashboard" },
        { href: "/admin/auditor", label: "Auditor Dashboard" },
      ],
    },
    {
      key: "core",
      icon: <Package size={18} />,
      label: "Core Modules",
      items: [
        { href: "/admin/product", label: "Products" },
        { href: "/admin/inventory", label: "Inventory" },
        { href: "/admin/category", label: "Categories" },
        { href: "/admin/billing", label: "Billing" },
        { href: "/admin/returns", label: "Returns & Transfers" },
        { href: "/admin/users", label: "User & Role Management" },
        { href: "/admin/reports", label: "Reports" },
        { href: "/admin/audit", label: "Audit Logs" },
      ],
    },
    {
      key: "settings",
      icon: <Settings size={18} />,
      label: "Settings",
      items: [
        { href: "/admin/settings/general", label: "General" },
        { href: "/admin/settings/tax", label: "Tax & HSN" },
        { href: "/admin/settings/notifications", label: "Notifications" },
        { href: "/admin/settings/backup", label: "Backup & Restore" },
      ],
    },
  ];

  const SidebarContent = () => (
    <nav className="flex flex-col h-full mt-0 lg:mt-14">
      <div className="px-4 py-6">


        {sections.map((section) => (
          <div key={section.key} className="mb-6">
            <button
              onClick={() => toggleMenu(section.key)}
              className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-[var(--text-primary)] mb-2"
              aria-expanded={openMenu === section.key}
            >
              <span className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">{section.icon}</span>
                <span>{section.label}</span>
              </span>
              <span className="text-[var(--text-secondary)]">
                {openMenu === section.key ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </button>

            <AnimatePresence>
              {openMenu === section.key && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="ml-2 mt-2 flex flex-col gap-1"
                >
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={linkClass(item.href)}>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-[var(--border-color)]">
        <button
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
  );

  return (
    <>
      {/* Mobile header button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen((s) => !s)}
          className="p-2 rounded-md bg-white shadow text-[var(--text-primary)]"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white border-r border-[var(--border-color)] min-h-screen fixed left-0 top-0">
        <div className="h-full overflow-y-auto">{SidebarContent()}</div>
      </aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              ref={sidebarRef}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg"
            >
              <div className="h-full overflow-y-auto">{SidebarContent()}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
