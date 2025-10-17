"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type Props = {
  items: any[];
  warehouses: any[];
  products: any[];
  onDelete: (id: number) => void;
};

export default function InventoryTable({ items, onDelete }: Props) {
  const router = useRouter();

  const getStatusColor = (item: any) => {
    const totalItems = item.boxes * item.itemsPerBox + item.looseItems;
    if (totalItems === 0) return "var(--color-error)";
    if (totalItems <= item.lowStockLimit) return "var(--color-warning)";
    return "var(--color-success)";
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border border-gray-200">
        <thead>
          <tr className="bg-[var(--color-primary)] text-white">
            <th className="border px-4 py-2">Product</th>
            <th className="border px-4 py-2">Warehouse</th>
            <th className="border px-4 py-2">Boxes</th>
            <th className="border px-4 py-2">Items/Box</th>
            <th className="border px-4 py-2">Loose Items</th>
            <th className="border px-4 py-2">Total Items</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(inv => {
            const totalItems = inv.boxes * inv.itemsPerBox + inv.looseItems;
            return (
              <tr key={inv.id} className="text-center capitalize hover:bg-blue-50 transition-all">
                <td className="border px-4 py-2">{inv.product?.name}</td>
                <td className="border px-4 py-2">{inv.warehouse?.name}</td>
                <td className="border px-4 py-2">{inv.boxes}</td>
                <td className="border px-4 py-2">{inv.itemsPerBox}</td>
                <td className="border px-4 py-2">{inv.looseItems}</td>
                <td className="border px-4 py-2">{totalItems}</td>
                <td className="border px-4 py-2">
                  <span className="px-2 py-1 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: getStatusColor(inv) }}>
                    {totalItems === 0 ? "Out of Stock" : totalItems <= inv.lowStockLimit ? "Low Stock" : "In Stock"}
                  </span>
                </td>
                <td className="border px-4 py-2 flex justify-center gap-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all" onClick={() => router.push(`/admin/inventory/edit/${inv.id}`)}>Edit</button>
                  <button
                    className="px-3 py-1 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-all"
                    onClick={() => {
                      Swal.fire({
                        title: "Are you sure?",
                        text: "This will delete the stock item!",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#F05454",
                        cancelButtonColor: "#A7C7E7",
                        confirmButtonText: "Yes, delete it!",
                      }).then((result) => {
                        if (result.isConfirmed) onDelete(inv.id);
                      });
                    }}
                  >Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
