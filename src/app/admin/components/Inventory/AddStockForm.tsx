// "use client";

// import React, { useState } from "react";
// import Swal from "sweetalert2";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store/store";
// import { addInventory } from "@/store/inventorySlice";

// type Props = {
//   products: any[];
//   warehouses: any[];
//   stock?: any; // optional for edit
//   onSuccess?: () => void;
// };

// export default function AddStockForm({ products, warehouses, stock, onSuccess }: Props) {
//   const dispatch = useDispatch<AppDispatch>();
//   const [form, setForm] = useState({
//     productId: stock?.product?.id || "",
//     warehouseId: stock?.warehouse?.id || "",
//     boxes: stock?.boxes || 0,
//     itemsPerBox: stock?.itemsPerBox || 1,
//     looseItems: stock?.looseItems || 0,
//     lowStockLimit: stock?.lowStockItems || 0,
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!form.productId || !form.warehouseId) return Swal.fire("Error", "Select product & warehouse", "error");

//     try {
//       if (stock) {
//         await dispatch(updateInventory({ id: stock.id, ...form })).unwrap();
//         Swal.fire("Success", "Stock updated", "success");
//       } else {
//         await dispatch(addInventory({ ...form })).unwrap();
//         Swal.fire("Success", "Stock added", "success");
//       }
//       onSuccess?.();
//       setForm({ productId: "", warehouseId: "", boxes: 0, itemsPerBox: 1, looseItems: 0, lowStockLimit: 0 });
//     } catch (err: any) {
//       Swal.fire("Error", err?.message || "Operation failed", "error");
//     }
//   };

//   if (!products.length || !warehouses.length) return null;

//   return (
//     <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
//       <div>
//         <label className="block text-sm text-gray-600 mb-1">Product</label>
//         <select
//           value={form.productId}
//           onChange={(e) => setForm({ ...form, productId: e.target.value })}
//           className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]"
//         >
//           <option value="">Select Product</option>
//           {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className="block text-sm text-gray-600 mb-1">Warehouse</label>
//         <select
//           value={form.warehouseId}
//           onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
//           className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]"
//         >
//           <option value="">Select Warehouse</option>
//           {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//         </select>
//       </div>

//       <div>
//         <label className="block text-sm text-gray-600 mb-1">Boxes</label>
//         <input type="number" value={form.boxes} min={0} onChange={(e) => setForm({ ...form, boxes: Number(e.target.value) })}
//           className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
//       </div>

//       <div>
//         <label className="block text-sm text-gray-600 mb-1">Items/Box</label>
//         <input type="number" value={form.itemsPerBox} min={1} onChange={(e) => setForm({ ...form, itemsPerBox: Number(e.target.value) })}
//           className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
//       </div>

//       <div>
//         <label className="block text-sm text-gray-600 mb-1">Loose Items</label>
//         <input type="number" value={form.looseItems} min={0} onChange={(e) => setForm({ ...form, looseItems: Number(e.target.value) })}
//           className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
//       </div>

//       <div>
//         <label className="block text-sm text-gray-600 mb-1">Low Stock Limit</label>
//         <input type="number" value={form.lowStockLimit} min={0} onChange={(e) => setForm({ ...form, lowStockLimit: Number(e.target.value) })}
//           className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
//       </div>

//       <div className="col-span-full flex justify-center mt-2">
//         <button type="submit" className="px-8 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-blue-400 text-white transition-all">
//           {stock ? "Update Stock" : "Add Stock"}
//         </button>
//       </div>
//     </form>
//   );
// }
