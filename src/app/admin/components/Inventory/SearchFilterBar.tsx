"use client";

import React from "react";
import Select from "react-select";

type Props = {
  search: string;
  setSearch: (val: string) => void;
  selectedWarehouse: string;
  setSelectedWarehouse: (val: string) => void;
  selectedProduct: string;
  setSelectedProduct: (val: string) => void;
  warehouses: any[];
  products: any[];
};

export default function SearchFilterBar({ search, setSearch, selectedWarehouse, setSelectedWarehouse, selectedProduct, setSelectedProduct, warehouses, products }: Props) {
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));
  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name }));

  const handleClear = () => {
    setSearch("");
    setSelectedWarehouse("");
    setSelectedProduct("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
      <input
        type="text"
        placeholder="Search by product or warehouse"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded-lg w-full sm:w-1/3 focus:outline-none focus:border-[var(--color-primary)]"
      />

      <Select
        value={warehouseOptions.find(o => o.value === Number(selectedWarehouse)) || null}
        onChange={(val: any) => setSelectedWarehouse(val?.value || "")}
        options={warehouseOptions}
        placeholder="Select Warehouse"
        className="w-full sm:w-1/4"
      />

      <Select
        value={productOptions.find(o => o.value === Number(selectedProduct)) || null}
        onChange={(val: any) => setSelectedProduct(val?.value || "")}
        options={productOptions}
        placeholder="Select Product"
        className="w-full sm:w-1/4"
        isSearchable
      />

      <button onClick={handleClear} className="px-4 py-2 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-all">
        Clear
      </button>
    </div>
  );
}
