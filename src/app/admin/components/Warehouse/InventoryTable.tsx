"use client";

import React from "react";

export type InventoryRow = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockByWarehouse: Record<string, number>;
  location: string;
  lastUpdated: string;
};

type Props = {
  rows: InventoryRow[];
  warehouse: string;
};

function StatusPill({ count }: { count: number }) {
  if (count === 0)
    return <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-error)] text-white">Out of Stock</span>;
  if (count <= 5)
    return <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-warning)] text-black">Low Stock</span>;
  return <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-success)] text-white">In Stock</span>;
}

export default function InventoryTable({ rows, warehouse }: Props) {
  return (
    <div className="bg-[var(--color-white)] rounded-lg border table-border p-4 shadow-sm overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--color-neutral)] px-3 py-2 rounded-md text-sm">Inventory</div>
          <div className="text-sm text-gray-500">Orders</div>
          <div className="text-sm text-gray-500">Transfers</div>
          <div className="text-sm text-gray-500">Returns</div>
        </div>
      </div>

       <div className="relative w-full overflow-x-auto rounded-md border mt-4">
            <table className="min-w-[700px] w-full text-sm text-left border-collapse">
        <thead>
          <tr className="text-gray-500 border-y">
            <th className="py-3 min-w-[180px] ">Product Name</th>
            <th className="py-3 min-w-[180px]">SKU</th>
            <th className="py-3 min-w-[180px]">Category</th>
            <th className="py-3 min-w-[180px]">Current Stock ({warehouse})</th>
            <th className="py-3 min-w-[180px]">Location</th>
            <th className="py-3 min-w-[180px]">Status</th>
            <th className="py-3 min-w-[180px]">Last Updated</th>
            <th className="py-3 min-w-[180px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const stock = r.stockByWarehouse[warehouse] ?? 0;
            return (
              <tr key={r.id} className="border-b last:border-0 hover:bg-[var(--color-neutral)]">
                <td className="py-4 pr-4 w-60">{r.name}</td>
                <td className="py-4 pr-4 text-gray-600">{r.sku}</td>
                <td className="py-4 pr-4 text-gray-600">{r.category}</td>
                <td className="py-4 pr-4 font-semibold">{stock}</td>
                <td className="py-4 pr-4 text-gray-600">{r.location}</td>
                <td className="py-4 pr-4">
                  <StatusPill count={stock} />
                </td>
                <td className="py-4 pr-4 text-gray-500">{r.lastUpdated}</td>
                <td className="py-4 pr-4 text-gray-500">🔍</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
