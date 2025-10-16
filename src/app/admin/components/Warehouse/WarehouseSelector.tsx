"use client";

import React from "react";

type Props = {
  warehouses: string[];
  active: string;
  onChange: (id: string) => void;
};

export default function WarehouseSelector({ warehouses, active, onChange }: Props) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 font-medium">Warehouse</label>
        <div className="flex items-center gap-2">
          {warehouses.map((w) => (
            <button
              key={w}
              onClick={() => onChange(w)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition
                ${active === w ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-white)] text-gray-700 border table-border"}
              `}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search products by name, SKU, or category..."
          className="px-4 py-2 rounded-md border table-border bg-[var(--color-white)] w-full md:w-96 focus:outline-none"
        />
        <button className="px-4 py-2 rounded-md bg-white border table-border">Filter</button>
        <button className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white">
          + Receive Stock
        </button>
      </div>
    </div>
  );
}
