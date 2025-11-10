"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { addProduct, updateProduct } from "@/store/productSlice";

export default function ProductForm({ onClose, editData }: { onClose: () => void; editData?: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const { categories } = useSelector((state: RootState) => state.category);

  const [form, setForm] = useState({
    name: editData?.name || "",
    categoryId: editData?.category?.id || "",
    purchasePrice: editData?.purchasePrice || "",
    sellingPrice: editData?.sellingPrice || "",
    description: editData?.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await dispatch(updateProduct({ id: editData.id, ...form })).unwrap();
        Swal.fire("Updated!", "Product updated successfully.", "success");
      } else {
        await dispatch(addProduct(form)).unwrap();
        Swal.fire("Added!", "Product added successfully.", "success");
      }
      onClose();
    } catch (error: any) {
      Swal.fire("Error", error || "Something went wrong.", "error");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.form
          onSubmit={handleSubmit}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl"
        >
          <h3 className="text-lg font-semibold mb-4 text-[var(--color-primary)]">
            {editData ? "Edit Product" : "Add Product"}
          </h3>

          <div className="space-y-3">
            <input
              placeholder="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full focus:border-[var(--color-primary)]"
            />

           <select
  value={form.categoryId}
  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
  className="input input-bordered w-full border-gray-300 rounded-md p-2 focus:border-[var(--color-primary)]"
>
  <option value="">Select Category</option>
  {categories.map((c) => (
    <option key={c.id || c._id} value={c.id || c._id}>
      {c.name}
    </option>
  ))}
</select>


            <input
              type="number"
              placeholder="Purchase Price"
              value={form.purchasePrice}
              onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full focus:border-[var(--color-primary)]"
            />

            <input
              type="number"
              placeholder="Selling Price"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full focus:border-[var(--color-primary)]"
            />

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-gray-300 rounded-md p-2 w-full focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white hover:bg-blue-700">
              {editData ? "Update" : "Add"}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
