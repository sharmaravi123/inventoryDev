"use client";

import React from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { deleteProduct } from "@/store/productSlice";

export default function TableRow({ product, onEdit }: { product: any; onEdit: (p: any) => void }) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <tr className="border-t hover:bg-gray-50 transition-all duration-200">
      <td className="p-4">{product.sku}</td>
      <td className="p-4">{product.name}</td>
      <td className="p-4">{product.category?.name}</td>
      <td className="p-4">{product.purchasePrice.toFixed(2)}</td>
      <td className="p-4">{product.sellingPrice.toFixed(2)}</td>
      <td className="p-4 text-right space-x-2">
        <button
          onClick={() => onEdit(product)}
          className="px-3 py-1 border border-primary text-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-all"
        >
          Edit
        </button>
        <button
          onClick={() => dispatch(deleteProduct(product.id))}
          className="px-3 py-1 border border-error text-[var(--color-error)] rounded hover:bg-[var(--color-error)] hover:text-white transition-all"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
