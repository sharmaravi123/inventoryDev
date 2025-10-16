"use client";
import React from "react";
import Swal from "sweetalert2";
import { MoreHorizontal } from "lucide-react";
import { Product } from "@/app/data/mockData";

export default function TableRow({ product }: { product: Product }) {
  const handleClick = () => {
    Swal.fire({
      title: "Reconcile Stock?",
      text: `Do you want to reconcile ${product.name}?`,
      icon: "question",
      showCancelButton: true,
    });
  };

  const getStatusClass = (status: Product["status"]) => {
    if (status === "In Stock") return "text-green-600";
    if (status === "Low Stock") return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  return (
    <tr className="border-t table-row-hover">
      <td className="p-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">📦</div>
      </td>
      <td className="p-4">{product.sku}</td>
      <td className="p-4">{product.name}</td>
      <td className="p-4">{product.category}</td>
      <td className="p-4">${product.price.toFixed(2)}</td>
      <td className="p-4">{product.stock}</td>
      <td className={`p-4 ${getStatusClass(product.status)}`}>{product.status}</td>
      <td className="p-4 text-right">
        <button onClick={handleClick} className="p-2 rounded-full hover:bg-gray-100 transition-all">
          <MoreHorizontal size={18} />
        </button>
      </td>
    </tr>
  );
}
