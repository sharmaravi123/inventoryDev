import React from "react";

export default function SearchAndFilters() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
      <input
        placeholder="Search products..."
        className="w-full md:w-1/3 border border-gray-300 rounded-md p-2 focus:outline-primary"
      />
      <select className="border border-gray-300 rounded-md p-2">
        <option>Filter Category</option>
      </select>
      <select className="border border-gray-300 rounded-md p-2">
        <option>Filter Status</option>
      </select>
      <button className="btn btn-outline">Reconcile Stock</button>
      <button className="btn btn-primary">Add Product</button>
    </div>
  );
}
