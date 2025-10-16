import React from "react";
import SearchAndFilters from "./SearchAndFilters";
import TableRow from "./TableRow";
import { products } from "@/app/data/mockData";

export default function ProductTable() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Product Inventory List</h2>
      <SearchAndFilters />

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">IMAGE</th>
              <th className="p-4 text-left">SKU</th>
              <th className="p-4 text-left">PRODUCT NAME</th>
              <th className="p-4 text-left">CATEGORY</th>
              <th className="p-4 text-left">PRICE</th>
              <th className="p-4 text-left">STOCK LEVEL</th>
              <th className="p-4 text-left">STATUS</th>
              <th className="p-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <TableRow key={p.id} product={p} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <button className="btn btn-outline">Previous</button>
        <span>Page 1 of 5</span>
        <button className="btn btn-outline">Next</button>
      </div>
    </section>
  );
}
