"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import TableRow from "./TableRow";
import SearchAndFilters from "./SearchAndFilters";
import ProductForm from "./ProductForm";

export default function ProductTable() {
  const { products, loading } = useSelector((state: RootState) => state.product);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // For search and category filter
  const [search, setSearch] = useState("");
 const [categoryId, setCategoryId] = useState<string>("");

const filteredProducts = products.filter((p) => {
  const matchesSearch =
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase());
  const matchesCategory = !categoryId || p.categoryId?.toString() === categoryId;
  return matchesSearch && matchesCategory;
});


  const handleEdit = (product: any) => {
    setEditData(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setEditData(null);
    setShowForm(false);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Product Inventory</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)] transition-all"
        >
          Add Product
        </button>
      </div>

      <SearchAndFilters
        search={search}
        setSearch={setSearch}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
      />

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="relative w-full overflow-x-auto rounded-md  mt-4">
            
          <table className="min-w-[700px] w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="p-4  min-w-[160px] text-left">SKU</th>
                <th className="p-4  min-w-[100px] text-left">Name</th>
                <th className="p-4  min-w-[100px] text-left">Category</th>
                <th className="p-4  min-w-[100px] text-left">Purchase</th>
                <th className="p-4  min-w-[100px] text-left">Selling</th>
                <th className="p-4  min-w-[120px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id} product={p} onEdit={handleEdit} />
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showForm && <ProductForm onClose={handleCloseForm} editData={editData} />}
    </section>
  );
}
