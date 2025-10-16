"use client";

import React from "react";

type Stat = {
  title: string;
  value: string;
  subtitle?: string;
  hint?: string;
};

const stats: Stat[] = [
  { title: "Total Inventory", value: "5,230 Units", subtitle: "+5.2% last month" },
  { title: "Low Stock Items", value: "45 Items", subtitle: "-15% from last week" },
  { title: "Pending Orders", value: "18 Orders", subtitle: "+3 orders today" },
  { title: "Recent Returns", value: "3 Returns", subtitle: "0 today" },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="bg-[var(--color-white)] rounded-lg border table-border p-5 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500">{s.subtitle}</p>
              <h3 className="text-2xl font-extrabold text-[var(--color-sidebar)] mt-2">
                {s.value}
              </h3>
              <p className="text-sm text-gray-500">{s.title}</p>
            </div>
            <div className="ml-2">
              {/* simple icon placeholder */}
              <div className="h-10 w-10 rounded-md bg-[var(--color-neutral)] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7h16" stroke="#1F2937" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
