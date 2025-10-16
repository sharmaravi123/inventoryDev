"use client";

import { motion } from "framer-motion";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardOverview from "../admin/components/Dashboard/DashboardOverview";
import SalesOverviewChart from "../admin/components/Dashboard/SalesOverviewChart";
import TopProductsBySales from "../admin/components/Dashboard/TopProductsBySales";
import InventoryDistribution from "../admin/components/Dashboard/InventoryDistribution";
import RecentOrders from "../admin/components/Dashboard/RecentOrders";
import LowStockAlerts from "../admin/components/Dashboard/LowStockAlerts";

export default function AdminPage() {
  return (
    <ProtectedRoute role="warehouse">

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-[var(--color-sidebar)] py-2 px-3 md:px-8">
        Ware House  Dashboard
      </h1>

      <div className="p-6">
        <DashboardOverview />
      </div>
       <h1 className="text-2xl font-bold text-[var(--color-sidebar)] py-2 px-3 md:px-8">
        Analytics Overview
      </h1>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--color-white)] rounded-2xl shadow-md p-6">
          <SalesOverviewChart />
        </div>
        <TopProductsBySales />

      </div>

      {/* Row 2 — Low Stock + Recent Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InventoryDistribution />

      </div>

      {/* Row 3 — Top Products by Sales */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentOrders />
        <LowStockAlerts />

      </div>
    </motion.div>
    </ProtectedRoute>

  );
}
