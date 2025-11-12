// src/app/admin/inventory/page.tsx
"use client";

import React, { JSX, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { RootState, AppDispatch } from "@/store/store";
import {
  fetchInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  InventoryItem,
} from "@/store/inventorySlice";
import { fetchProducts } from "@/store/productSlice";
import { fetchWarehouses } from "@/store/warehouseSlice";
import { X } from "lucide-react";

interface Product {
  _id?: string;
  id?: string | number;
  name: string;
  stableKey?: string;
}
interface Warehouse {
  _id?: string;
  id?: string | number;
  name: string;
  stableKey?: string;
}
interface InventoryForm {
  _id?: string;
  productId: string;
  warehouseId: string;
  boxes: number;
  itemsPerBox: number;
  looseItems: number;
  lowStockBoxes?: number;
  lowStockItems?: number;
}

const cssVarsStyle: React.CSSProperties = {
  ["--color-primary" as any]: "#1A73E8",
  ["--color-secondary" as any]: "#A7C7E7",
  ["--color-success" as any]: "#00C48C",
  ["--color-warning" as any]: "#FFC107",
  ["--color-error" as any]: "#F05454",
  ["--color-neutral" as any]: "#F8FAFC",
  ["--color-sidebar" as any]: "#0F172A",
  ["--color-white" as any]: "#FFFFFF",
};

export default function InventoryManagerPage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading } = useSelector((s: RootState) => s.inventory);
  const rawProducts = useSelector((s: RootState) => s.product.products ?? []);
  const rawWarehouses = useSelector((s: RootState) => s.warehouse.list ?? []);

  const products: Product[] = rawProducts.map((p: any, i: number) => ({ ...p, stableKey: String(p._id ?? p.id ?? `p-${i}`) }));
  const warehouses: Warehouse[] = rawWarehouses.map((w: any, i: number) => ({ ...w, stableKey: String(w._id ?? w.id ?? `w-${i}`) }));

  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "stock" | "low stock" | "out of stock">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<InventoryForm>({
    productId: "",
    warehouseId: "",
    boxes: 0,
    itemsPerBox: 1,
    looseItems: 0,
    lowStockBoxes: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    dispatch(fetchInventory());
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
  }, [dispatch]);

  // Helpers to resolve name from either populated object or id using store lists
  const getProductName = (inv: any): string => {
    if (inv.product?.name) return inv.product.name as string;
    const pid = inv.productId ?? inv.product?._id ?? inv.product?.id;
    if (!pid) return "—";
    const p = products.find((x) => String(x._id ?? x.id) === String(pid));
    return p?.name ?? String(pid);
  };

  const getWarehouseName = (inv: any): string => {
    if (inv.warehouse?.name) return inv.warehouse.name as string;
    const wid = inv.warehouseId ?? inv.warehouse?._id ?? inv.warehouse?.id;
    if (!wid) return "—";
    const w = warehouses.find((x) => String(x._id ?? x.id) === String(wid));
    return w?.name ?? String(wid);
  };

  // filter & search use resolved names now
  const filteredItems = useMemo(() => {
    return (items ?? []).filter((inv: any) => {
      const total = inv.boxes * inv.itemsPerBox + inv.looseItems;
      const productName = getProductName(inv).toLowerCase();
      const warehouseName = getWarehouseName(inv).toLowerCase();

      const matchesProduct = filterProduct ? String(inv.productId ?? inv.product?._id ?? inv.product?.id) === String(filterProduct) : true;
      const matchesWarehouse = filterWarehouse ? String(inv.warehouseId ?? inv.warehouse?._id ?? inv.warehouse?.id) === String(filterWarehouse) : true;
      const matchesSearch = search
        ? productName.includes(search.toLowerCase()) || warehouseName.includes(search.toLowerCase())
        : true;

      let matchesStock = true;
      if (stockFilter === "out of stock") matchesStock = total === 0;
      if (stockFilter === "low stock") {
        const lowTotal = (inv.lowStockBoxes ?? 0) * inv.itemsPerBox + (inv.lowStockItems ?? 0);
        matchesStock = total > 0 && total <= lowTotal;
      }
      if (stockFilter === "stock") {
        const lowTotal = (inv.lowStockBoxes ?? 0) * inv.itemsPerBox + (inv.lowStockItems ?? 0);
        matchesStock = total > lowTotal;
      }
      return matchesProduct && matchesWarehouse && matchesSearch && matchesStock;
    });
  }, [items, search, filterProduct, filterWarehouse, stockFilter, products, warehouses]);

  const openAdd = () => {
    setForm({
      productId: "",
      warehouseId: "",
      boxes: 0,
      itemsPerBox: 1,
      looseItems: 0,
      lowStockBoxes: 0,
      lowStockItems: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (inv: InventoryItem) => {
    setForm({
      _id: inv._id,
      productId: String(inv.product?._id ?? inv.product?.id ?? inv.productId ?? ""),
      warehouseId: String(inv.warehouse?._id ?? inv.warehouse?.id ?? inv.warehouseId ?? ""),
      boxes: inv.boxes,
      itemsPerBox: inv.itemsPerBox,
      looseItems: inv.looseItems,
      lowStockBoxes: inv.lowStockBoxes ?? 0,
      lowStockItems: inv.lowStockItems ?? 0,
    });
    setModalOpen(true);
  };

  const normalizeLooseToBoxes = (boxes: number, itemsPerBox: number, looseItems: number) => {
    if (itemsPerBox <= 0) itemsPerBox = 1;
    if (looseItems >= itemsPerBox) {
      const extra = Math.floor(looseItems / itemsPerBox);
      boxes += extra;
      looseItems = looseItems % itemsPerBox;
    }
    return { boxes, looseItems };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // for create, productId & warehouseId must be present
    if (!form._id && (!form.productId || !form.warehouseId)) {
      return Swal.fire("Error", "Please select product and warehouse", "error");
    }

    const normalized = normalizeLooseToBoxes(form.boxes, form.itemsPerBox, form.looseItems);

    const createPayload = {
      productId: form.productId,
      warehouseId: form.warehouseId,
      boxes: normalized.boxes,
      itemsPerBox: form.itemsPerBox,
      looseItems: normalized.looseItems,
      lowStockBoxes: form.lowStockBoxes ?? 0,
      lowStockItems: form.lowStockItems ?? 0,
    };

    const updatePayload = {
      boxes: normalized.boxes,
      itemsPerBox: form.itemsPerBox,
      looseItems: normalized.looseItems,
      lowStockBoxes: form.lowStockBoxes ?? 0,
      lowStockItems: form.lowStockItems ?? 0,
    };

    try {
      if (form._id) {
        // update: do NOT change productId/warehouseId
        await dispatch(updateInventory({ id: form._id, data: updatePayload })).unwrap();
        Swal.fire("Updated", "Stock updated successfully", "success");
      } else {
        await dispatch(addInventory(createPayload)).unwrap();
        Swal.fire("Added", "Stock created successfully", "success");
      }
      setModalOpen(false);
      dispatch(fetchInventory());
    } catch (err: any) {
      Swal.fire("Error", err?.message || "Operation failed", "error");
    }
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    Swal.fire({
      title: "Delete stock?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F05454",
      cancelButtonColor: "#A7C7E7",
      confirmButtonText: "Yes, delete",
    }).then((res) => {
      if (res.isConfirmed) dispatch(deleteInventory(id));
    });
  };

  const handleEditClick = (inv: InventoryItem) => openEdit(inv);

  const getStatusColor = (inv: any) => {
    const total = inv.boxes * inv.itemsPerBox + inv.looseItems;
    const lowTotal = (inv.lowStockBoxes ?? 0) * inv.itemsPerBox + (inv.lowStockItems ?? 0);
    if (total === 0) return "var(--color-error)";
    if (total <= lowTotal) return "var(--color-warning)";
    return "var(--color-success)";
  };

  return (
    <div style={cssVarsStyle} className="min-h-screen p-6 bg-[var(--color-neutral)]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-sidebar)]">Inventory Manager</h1>
            <p className="text-sm text-gray-600">Add new stock or edit quantities (product/warehouse are immutable after create).</p>
          </div>

          <div className="flex gap-3 items-center">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product / warehouse" className="px-3 py-2 rounded border w-56" />
            <button onClick={openAdd} className="px-4 py-2 rounded bg-[var(--color-primary)] text-white hover:brightness-95">Add Stock</button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className="p-2 border rounded">
                <option value="">All Warehouses</option>
                {warehouses.map((w) => <option key={w.stableKey} value={String(w._id ?? w.id)}>{w.name}</option>)}
              </select>
              <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="p-2 border rounded">
                <option value="">All Products</option>
                {products.map((p) => <option key={p.stableKey} value={String(p._id ?? p.id)}>{p.name}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
  {loading ? (
    <div className="py-8 text-center text-gray-500">Loading...</div>
  ) : (
    <table className="min-w-[900px] w-full table-auto text-sm md:text-base">
      <thead className="bg-[var(--color-neutral)] text-[var(--color-sidebar)]">
        <tr>
          <th className="py-3 px-3 text-left whitespace-nowrap">Product</th>
          <th className="py-3 px-3 text-left whitespace-nowrap">Warehouse</th>
          <th className="py-3 px-3 text-center whitespace-nowrap">Boxes</th>
          <th className="py-3 px-3 text-center whitespace-nowrap">Items/Box</th>
          <th className="py-3 px-3 text-center whitespace-nowrap">Loose</th>
          <th className="py-3 px-3 text-center whitespace-nowrap">Total</th>
          <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
          <th className="py-3 px-3 text-center whitespace-nowrap">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredItems.map((inv: any) => {
          const total = inv.boxes * inv.itemsPerBox + inv.looseItems;
          const lowTotal = (inv.lowStockBoxes ?? 0) * inv.itemsPerBox + (inv.lowStockItems ?? 0);
          const prodName = getProductName(inv);
          const whName = getWarehouseName(inv);

          return (
            <tr
              key={inv._id ?? inv.id}
              className="border-t hover:bg-[var(--color-neutral)] transition capitalize"
            >
              <td className="py-3 px-3 font-medium whitespace-nowrap">
                {prodName ?? "—"}
              </td>
              <td className="py-3 px-3 font-medium whitespace-nowrap">
                {whName ?? "—"}
              </td>
              <td className="py-3 px-3 text-center whitespace-nowrap">{inv.boxes}</td>
              <td className="py-3 px-3 text-center whitespace-nowrap">{inv.itemsPerBox}</td>
              <td className="py-3 px-3 text-center whitespace-nowrap">{inv.looseItems}</td>
              <td className="py-3 px-3 text-center whitespace-nowrap">{total}</td>
              <td className="py-3 px-3 text-center whitespace-nowrap">
                <span
                  className="px-2 py-1 rounded text-white text-xs md:text-sm"
                  style={{ backgroundColor: getStatusColor(inv) }}
                >
                  {total === 0 ? "Out of Stock" : total <= lowTotal ? "Low Stock" : "In Stock"}
                </span>
              </td>
              <td className="py-3 px-3 text-center whitespace-nowrap">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => handleEditClick(inv)}
                    className="px-3 py-1 rounded bg-[var(--color-primary)] text-white hover:opacity-90"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(inv._id)}
                    className="px-3 py-1 rounded bg-[var(--color-error)] text-white hover:opacity-90"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  )}
</div>

          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold text-[var(--color-sidebar)]">Overview</h3>
              <div className="mt-3">
                <div>Total items: <strong>{items.reduce((acc: number, i: any) => acc + (i.boxes * i.itemsPerBox + i.looseItems), 0)}</strong></div>
                <div className="text-sm text-gray-500 mt-1">Warehouses: {warehouses.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold">Filters</h3>
              <div className="mt-3 flex flex-col gap-2">
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} className="p-2 border rounded">
                  <option value="all">All</option>
                  <option value="stock">Stock</option>
                  <option value="low stock">Low stock</option>
                  <option value="out of stock">Out of stock</option>
                </select>
                <button onClick={() => { setSearch(""); setFilterProduct(""); setFilterWarehouse(""); setStockFilter("all"); }} className="px-3 py-2 rounded bg-[var(--color-secondary)] text-[var(--color-sidebar)]">Reset</button>
              </div>
            </div>
          </aside>
        </section>

        <AnimatePresence>
          {modalOpen && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

              <motion.form
                onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="relative bg-white w-full max-w-2xl rounded-xl p-6 shadow-2xl z-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{form._id ? "Edit Stock" : "Add Stock"}</h3>
                  <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-slate-100"><X /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* If creating: allow selecting product & warehouse. If editing: show readonly labels (no selects). */}
                  {form._id ? (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">Product (immutable)</label>
                        <div className="w-full border rounded px-3 py-2 bg-gray-50 text-sm">{products.find(p => String(p._id ?? p.id) === form.productId)?.name ?? form.productId}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Warehouse (immutable)</label>
                        <div className="w-full border rounded px-3 py-2 bg-gray-50 text-sm">{warehouses.find(w => String(w._id ?? w.id) === form.warehouseId)?.name ?? form.warehouseId}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">Product</label>
                        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="w-full border rounded px-3 py-2">
                          <option value="">Choose product</option>
                          {products.map((p) => <option key={p.stableKey} value={String(p._id ?? p.id)}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Warehouse</label>
                        <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="w-full border rounded px-3 py-2">
                          <option value="">Choose warehouse</option>
                          {warehouses.map((w) => <option key={w.stableKey} value={String(w._id ?? w.id)}>{w.name}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm text-gray-600">Boxes</label>
                    <input type="number" min={0} value={form.boxes} onChange={(e) => setForm({ ...form, boxes: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Items / Box</label>
                    <input type="number" min={1} value={form.itemsPerBox} onChange={(e) => setForm({ ...form, itemsPerBox: Math.max(1, Number(e.target.value)) })} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Loose Items</label>
                    <input type="number" min={0} value={form.looseItems} onChange={(e) => setForm({ ...form, looseItems: Math.max(0, Number(e.target.value)) })} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Low stock (boxes)</label>
                    <input type="number" min={0} value={form.lowStockBoxes} onChange={(e) => setForm({ ...form, lowStockBoxes: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Low stock (loose)</label>
                    <input type="number" min={0} value={form.lowStockItems} onChange={(e) => setForm({ ...form, lowStockItems: Number(e.target.value) })} className="w-full border rounded px-3 py-2" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[var(--color-primary)] text-white rounded">{form._id ? "Update Stock" : "Add Stock"}</button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
