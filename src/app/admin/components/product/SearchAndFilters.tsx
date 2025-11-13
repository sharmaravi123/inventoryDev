"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface Props {
  search: string;
  setSearch: (val: string) => void;
  categoryId: string;
  setCategoryId: React.Dispatch<React.SetStateAction<string>>;
}

export default function SearchAndFilters({
  search,
  setSearch,
  categoryId,
  setCategoryId,
}: Props) {
  const { categories } = useSelector((state: RootState) => state.category);

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
      <input
        placeholder="Search by name or SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-gray-300 rounded-md p-2 w-full md:w-1/3 focus:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-primary)" }}
      />
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="border border-gray-300 rounded-md p-2 focus:border-[var(--color-primary)]"
        style={{ borderColor: "var(--color-primary)" }}
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
