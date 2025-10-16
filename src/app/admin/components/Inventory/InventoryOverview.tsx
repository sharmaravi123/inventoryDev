import React from "react";

const StatCard = ({
  title,
  value,
  hint,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <div className="card hover:shadow-md transition-all duration-300">
    <div className="text-sm text-gray-500 font-medium">{title}</div>
    <div className="text-2xl font-semibold mt-3">{value}</div>
    {hint && <div className="text-xs text-gray-400 mt-2">{hint}</div>}
  </div>
);

export default function InventoryOverview() {
  return (
    <section>
      <h1 className="text-2xl font-bold mb-6">Inventory Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value="2,345" hint="+12% since last month" />
        <StatCard title="Total Stock Value" value="$1.2M" hint="-0.5% in last 24h" />
        <StatCard title="Low Stock Alerts" value="18" hint="+3 new alerts" />
        <StatCard title="Products Out of Stock" value="7" hint="Stable" />
      </div>
    </section>
  );
}
