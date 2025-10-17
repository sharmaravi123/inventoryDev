"use client";

import React from "react";

type OverviewProps = {
  overview: { warehouse: string; totalProducts: number; totalAmount: number }[];
};

export default function InventoryOverview({ overview }: OverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {overview.map((o, idx) => (
        <div key={idx} className="p-4 rounded-lg shadow text-center bg-[var(--color-secondary)] text-[var(--color-sidebar)]">
          <div className="font-semibold text-lg capitalize">{o.warehouse}</div>
          <div className="mt-2">Total Products: <span className="font-medium">{o.totalProducts}</span></div>
          <div>Total Amount: <span className="font-medium">₹{o.totalAmount.toFixed(2)}</span></div>
        </div>
      ))}
    </div>
  );
}
