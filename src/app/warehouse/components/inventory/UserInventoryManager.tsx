// src/app/warehouse/components/inventory/UserInventoryManager.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
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

type Product = { _id?: string | number; id?: string | number; name?: string; stableKey?: string; purchasePrice?: number; purchase_price?: number; sellingPrice?: number; sellPrice?: number; price?: number; };
type Warehouse = { _id?: string | number; id?: string | number; name?: string; stableKey?: string; };

type FormState = {
  _id?: string;
  productId: string;
  warehouseId: string;
  boxes: number;
  itemsPerBox: number;
  looseItems: number;
  lowStockBoxes: number;
  lowStockItems: number;
  tax: number;
};

type Props = {
  initialItems?: InventoryItem[];
  allowedWarehouseIdsProp?: string[] | undefined; // server-provided allowed ids (undefined => admin)
  assignedWarehouseForUser?: string[] | undefined; // convenience from server
};

const UserInventoryManager: React.FC<Props> = ({ initialItems, allowedWarehouseIdsProp, assignedWarehouseForUser }) => {
  const dispatch = useDispatch<AppDispatch>();
  const reduxItems = useSelector((s: RootState) => s.inventory.items) as InventoryItem[] | undefined;
  const loading = useSelector((s: RootState) => s.inventory.loading) as boolean;
  const rawProducts = useSelector((s: RootState) => s.product.products ?? []) as Product[];
  const rawWarehouses = useSelector((s: RootState) => s.warehouse.list ?? []) as Warehouse[];

  const products = useMemo(() => rawProducts.map((p, i) => ({ ...p, stableKey: String(p._id ?? p.id ?? `p-${i}`) })), [rawProducts]);
  const warehouses = useMemo(() => rawWarehouses.map((w, i) => ({ ...w, stableKey: String(w._id ?? w.id ?? `w-${i}`) })), [rawWarehouses]);

  const items = useMemo(() => (Array.isArray(initialItems) && initialItems.length > 0 ? initialItems : reduxItems ?? []), [initialItems, reduxItems]);

  // Use assignedWarehouseForUser if provided; fallback to allowedWarehouseIdsProp
  const allowedWarehouseIds = useMemo(() => {
    if (Array.isArray(assignedWarehouseForUser)) return assignedWarehouseForUser;
    if (Array.isArray(allowedWarehouseIdsProp)) return allowedWarehouseIdsProp;
    return undefined; // admin/all
  }, [assignedWarehouseForUser, allowedWarehouseIdsProp]);

  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "stock" | "low stock" | "out of stock">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    productId: "",
    warehouseId: Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length === 1 ? String(allowedWarehouseIds[0]) : "",
    boxes: 0,
    itemsPerBox: 1,
    looseItems: 0,
    lowStockBoxes: 0,
    lowStockItems: 0,
    tax: 0,
  });

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchWarehouses());
    if (!initialItems || initialItems.length === 0) dispatch(fetchInventory());
  }, [dispatch, initialItems]);

  useEffect(() => {
    if (Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length === 1) {
      setForm((s) => ({ ...s, warehouseId: String(allowedWarehouseIds[0]) }));
    }
  }, [allowedWarehouseIds]);

  const extractId = useCallback((ref: unknown): string | undefined => {
    if (ref == null) return undefined;
    if (typeof ref === "string" || typeof ref === "number") return String(ref);
    if (typeof ref === "object") {
      const obj = ref as Record<string, unknown>;
      const candidate = obj._id ?? obj.id;
      if (candidate == null || candidate === "") return undefined;
      return String(candidate);
    }
    return undefined;
  }, []);

  const getProductName = useCallback((inv: InventoryItem): string => {
    const prod = (inv as unknown as Record<string, unknown>).product;
    if (prod && typeof prod === "object" && "name" in prod && (prod as Record<string, unknown>).name) return String((prod as Product).name);
    const pid = extractId(inv.productId ?? prod) ?? "";
    const p = products.find((x) => String(x._id ?? x.id) === pid);
    return p?.name ?? pid ?? "—";
  }, [products, extractId]);

  const getWarehouseName = useCallback((inv: InventoryItem): string => {
    const wh = (inv as unknown as Record<string, unknown>).warehouse;
    if (wh && typeof wh === "object" && "name" in wh && (wh as Record<string, unknown>).name) return String((wh as Warehouse).name);
    const wid = extractId(inv.warehouseId ?? wh) ?? "";
    const w = warehouses.find((x) => String(x._id ?? x.id) === wid);
    return w?.name ?? wid ?? "—";
  }, [warehouses, extractId]);

  const getProductPrices = useCallback((productId?: string): { purchase?: number; selling?: number } => {
    if (!productId) return {};
    const p = products.find((x) => String(x._id ?? x.id) === String(productId));
    if (!p) return {};
    const purchase = [p.purchasePrice, p.purchase_price, p.price].find((v) => typeof v === "number") as number | undefined;
    const selling = [p.sellingPrice, p.sellPrice, p.price].find((v) => typeof v === "number") as number | undefined;
    return { purchase, selling };
  }, [products]);

  const currency = useMemo(() => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }), []);

  const filteredItems = useMemo(() => {
    const list = items;
    return list.filter((inv) => {
      const total = inv.boxes * inv.itemsPerBox + inv.looseItems;
      const pname = getProductName(inv).toLowerCase();
      const wname = getWarehouseName(inv).toLowerCase();
      const pid = extractId(inv.productId ?? inv.product) ?? "";
      const wid = extractId(inv.warehouseId ?? inv.warehouse) ?? "";

      // enforce allowed warehouses (if provided)
      if (Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length > 0 && !allowedWarehouseIds.includes(wid)) return false;

      if (filterProduct && pid !== String(filterProduct)) return false;
      if (search && !(`${pname} ${wname}`).includes(search.toLowerCase())) return false;

      if (stockFilter === "out of stock") return total === 0;
      const lowTotal = (inv.lowStockBoxes ?? 0) * inv.itemsPerBox + (inv.lowStockItems ?? 0);
      if (stockFilter === "low stock") return total > 0 && total <= lowTotal;
      if (stockFilter === "stock") return total > lowTotal;
      return true;
    });
  }, [items, search, filterProduct, stockFilter, getProductName, getWarehouseName, extractId, allowedWarehouseIds]);

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
    if (!form._id && (!form.productId || !form.warehouseId)) {
      Swal.fire("Error", "Please select product and warehouse", "error");
      return;
    }

    const formWid = String(form.warehouseId || "");
    if (Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length > 0) {
      if (!allowedWarehouseIds.includes(formWid)) {
        Swal.fire("Forbidden", "You are not allowed to add stock for this warehouse.", "error");
        return;
      }
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
      tax: form.tax,
    } as const;

    const updatePayload = {
      boxes: normalized.boxes,
      itemsPerBox: form.itemsPerBox,
      looseItems: normalized.looseItems,
      lowStockBoxes: form.lowStockBoxes ?? 0,
      lowStockItems: form.lowStockItems ?? 0,
      tax: form.tax,
    } as const;

    try {
      if (form._id) {
        const inv = (items ?? []).find((x) => x._id === form._id);
        const invWid = extractId(inv?.warehouseId ?? inv?.warehouse) ?? "";
        if (Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length > 0 && !allowedWarehouseIds.includes(invWid)) {
          Swal.fire("Forbidden", "You are not allowed to edit this inventory item.", "error");
          return;
        }
        await dispatch(updateInventory({ id: form._id, data: updatePayload })).unwrap();
        Swal.fire("Updated", "Stock updated successfully", "success");
      } else {
        // if user assigned (array) and multiple assigned warehouses, backend should decide; we pass selected warehouseId
        await dispatch(addInventory(createPayload)).unwrap();
        Swal.fire("Added", "Stock created successfully", "success");
      }
      setModalOpen(false);
      dispatch(fetchInventory());
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      Swal.fire("Error", e.message || "Operation failed", "error");
    }
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    const inv = (items ?? []).find((x) => x._id === id);
    const invWid = extractId(inv?.warehouseId ?? inv?.warehouse) ?? "";
    if (Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length > 0 && !allowedWarehouseIds.includes(invWid)) {
      Swal.fire("Forbidden", "You are not allowed to delete this item.", "error");
      return;
    }

    Swal.fire({
      title: "Delete stock?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    }).then((res) => {
      if (res.isConfirmed) dispatch(deleteInventory(id));
    });
  };

  const openAdd = () => {
    setForm({
      productId: "",
      warehouseId: Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length === 1 ? String(allowedWarehouseIds[0]) : "",
      boxes: 0,
      itemsPerBox: 1,
      looseItems: 0,
      lowStockBoxes: 0,
      lowStockItems: 0,
      tax: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (inv: InventoryItem) => {
    const invWid = extractId(inv.warehouseId ?? inv.warehouse) ?? "";
    if (Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length > 0 && !allowedWarehouseIds.includes(invWid)) {
      Swal.fire("Forbidden", "You are not allowed to edit this inventory item.", "error");
      return;
    }

    setForm({
      _id: inv._id,
      productId: extractId(inv.product ?? inv.productId) ?? "",
      warehouseId: invWid,
      boxes: inv.boxes,
      itemsPerBox: inv.itemsPerBox,
      looseItems: inv.looseItems,
      lowStockBoxes: inv.lowStockBoxes ?? 0,
      lowStockItems: inv.lowStockItems ?? 0,
      tax: inv.tax ?? 0,
    });
    setModalOpen(true);
  };

  const statusColor = (inv: InventoryItem) => {
    const total = inv.boxes * inv.itemsPerBox + inv.looseItems;
    const lowTotal = (inv.lowStockBoxes ?? 0) * inv.itemsPerBox + (inv.lowStockItems ?? 0);
    if (total === 0) return "var(--color-error)";
    if (total <= lowTotal) return "var(--color-warning)";
    return "var(--color-success)";
  };

  const warehousesForSelect = useMemo(() => {
    if (!Array.isArray(allowedWarehouseIds) || allowedWarehouseIds.length === 0) return warehouses;
    return warehouses.filter((w) => allowedWarehouseIds.includes(String(w._id ?? w.id)));
  }, [warehouses, allowedWarehouseIds]);

  const showWarehouseSelect = useMemo(() => {
    // per request: do not show warehouse select for user flow (unless admin)
    return !Array.isArray(allowedWarehouseIds);
  }, [allowedWarehouseIds]);

  const userCanAdd = useMemo(() => {
    if (Array.isArray(allowedWarehouseIds)) return allowedWarehouseIds.length > 0;
    return true; // admin
  }, [allowedWarehouseIds]);

  return (
    <div className="min-h-screen p-6 bg-[var(--color-neutral)]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-sidebar)]">Inventory</h1>
            <p className="text-sm text-gray-600">Manage stock for your assigned warehouse(s).</p>
          </div>
          <div className="flex gap-3 items-center">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search product / warehouse" className="px-3 py-2 rounded border w-56" />
            <button
              onClick={openAdd}
              className={`px-4 py-2 rounded ${userCanAdd ? "bg-[var(--color-primary)] text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`}
              disabled={!userCanAdd}
              title={!userCanAdd ? "No assigned warehouses" : "Add stock"}
            >
              Add Stock
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* If admin (allowedWarehouseIds undefined) show product selector and let them filter by product; for user show hint */}
              {!Array.isArray(allowedWarehouseIds) ? (
                <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="p-2 border rounded">
                  <option value="">All Products</option>
                  {products.map((p) => (<option key={p.stableKey} value={String(p._id ?? p.id)}>{p.name}</option>))}
                </select>
              ) : (
                <>
                  <div className="p-2 text-sm text-gray-700">Showing inventory for your assigned warehouse(s).</div>
                  <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} className="p-2 border rounded">
                    <option value="">All Products</option>
                    {products.map((p) => (<option key={p.stableKey} value={String(p._id ?? p.id)}>{p.name}</option>))}
                  </select>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : (
                <table className="min-w-[900px] w-full table-auto text-sm md:text-base">
                  <thead className="bg-[var(--color-neutral)] text-[var(--color-sidebar)]">
                    <tr>
                      <th className="py-3 px-3 text-left">Product</th>
                      <th className="py-3 px-3 text-left">Warehouse</th>
                      <th className="py-3 px-3 text-center">Boxes</th>
                      <th className="py-3 px-3 text-center">Items/Box</th>
                      <th className="py-3 px-3 text-center">Loose</th>
                      <th className="py-3 px-3 text-center">Tax</th>
                      <th className="py-3 px-3 text-center">Total</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((inv) => {
                      const total = inv.boxes * inv.itemsPerBox + inv.looseItems;
                      const lowTotal = (inv.lowStockBoxes ?? 0) * inv.itemsPerBox + (inv.lowStockItems ?? 0);
                      const prodName = getProductName(inv);
                      const whName = getWarehouseName(inv);
                      const keyId = inv._id ?? String(Math.random());
                      const pid = extractId(inv.productId ?? inv.product) ?? undefined;
                      const prices = getProductPrices(pid);

                      const invWid = extractId(inv.warehouseId ?? inv.warehouse) ?? "";
                      const allowedForThisItem = !Array.isArray(allowedWarehouseIds) || allowedWarehouseIds.length === 0 || allowedWarehouseIds.includes(invWid);

                      return (
                        <tr key={keyId} className="border-t hover:bg-[var(--color-neutral)] transition capitalize">
                          <td className="py-3 px-3 font-medium">
                            <div>{prodName ?? "—"}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {prices.selling !== undefined ? <span className="mr-3">Sell: {currency.format(prices.selling)}</span> : null}
                              {prices.purchase !== undefined ? <span>Buy: {currency.format(prices.purchase)}</span> : null}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium">{whName ?? "—"}</td>
                          <td className="py-3 px-3 text-center">{inv.boxes}</td>
                          <td className="py-3 px-3 text-center">{inv.itemsPerBox}</td>
                          <td className="py-3 px-3 text-center">{inv.looseItems}</td>
                          <td className="py-3 px-3 text-center">{inv.tax}%</td>
                          <td className="py-3 px-3 text-center">{total}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-1 rounded text-white text-xs md:text-sm" style={{ backgroundColor: statusColor(inv) }}>
                              {total === 0 ? "Out of Stock" : total <= lowTotal ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex flex-wrap justify-center gap-2">
                              <button onClick={() => openEdit(inv)} className={`px-3 py-1 rounded ${allowedForThisItem ? "bg-[var(--color-primary)] text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`} disabled={!allowedForThisItem}>Edit</button>
                              <button onClick={() => handleDelete(inv._id)} className={`px-3 py-1 rounded ${allowedForThisItem ? "bg-[var(--color-error)] text-white" : "bg-gray-300 text-gray-600 cursor-not-allowed"}`} disabled={!allowedForThisItem}>Delete</button>
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
                <div>
                  Total items:{" "}
                  <strong>
                    {items.reduce((acc: number, i: InventoryItem) => acc + (i.boxes * i.itemsPerBox + i.looseItems), 0)}
                  </strong>
                </div>
                <div className="text-sm text-gray-500 mt-1">Warehouses: {warehouses.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold">Filters</h3>
              <div className="mt-3 flex flex-col gap-2">
                <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as "all" | "stock" | "low stock" | "out of stock")} className="p-2 border rounded">
                  <option value="all">All</option>
                  <option value="stock">Stock</option>
                  <option value="low stock">Low stock</option>
                  <option value="out of stock">Out of stock</option>
                </select>
                <button onClick={() => { setSearch(""); setFilterProduct(""); setStockFilter("all"); }} className="px-3 py-2 rounded bg-[var(--color-secondary)] text-[var(--color-sidebar)]">Reset</button>
              </div>
            </div>
          </aside>
        </section>

        <AnimatePresence>
          {modalOpen && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
              <motion.form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-xl p-6 shadow-2xl z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{form._id ? "Edit Stock" : "Add Stock"}</h3>
                  <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-slate-100"><X /></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form._id ? (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">Product (immutable)</label>
                        <div className="w-full border rounded px-3 py-2 bg-gray-50 text-sm">{products.find((p) => String(p._id ?? p.id) === form.productId)?.name ?? form.productId}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Warehouse (immutable)</label>
                        <div className="w-full border rounded px-3 py-2 bg-gray-50 text-sm">{warehouses.find((w) => String(w._id ?? w.id) === form.warehouseId)?.name ?? form.warehouseId}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">Product</label>
                        <select value={form.productId} onChange={(e) => setForm((s) => ({ ...s, productId: e.target.value }))} className="w-full border rounded px-3 py-2">
                          <option value="">Choose product</option>
                          {products.map((p) => <option key={p.stableKey} value={String(p._id ?? p.id)}>{p.name}</option>)}
                        </select>
                      </div>

                      {/* only show select to admin */}
                      {showWarehouseSelect ? (
                        <div>
                          <label className="text-sm text-gray-600">Warehouse</label>
                          <select value={form.warehouseId} onChange={(e) => setForm((s) => ({ ...s, warehouseId: e.target.value }))} className="w-full border rounded px-3 py-2">
                            <option value="">Choose warehouse</option>
                            {warehouses.map((w) => <option key={w.stableKey} value={String(w._id ?? w.id)}>{w.name}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="text-sm text-gray-600">Warehouse</label>
                          <div className="w-full border rounded px-3 py-2 bg-gray-50 text-sm">
                            {Array.isArray(allowedWarehouseIds) && allowedWarehouseIds.length === 1
                              ? warehouses.find((w) => String(w._id ?? w.id) === String(allowedWarehouseIds[0]))?.name ?? String(allowedWarehouseIds[0])
                              : "Your assigned warehouse(s) will be used."}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <label className="text-sm text-gray-600">Boxes</label>
                    <input type="number" min={0} value={form.boxes} onChange={(e) => setForm((s) => ({ ...s, boxes: Number(e.target.value) }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Items / Box</label>
                    <input type="number" min={1} value={form.itemsPerBox} onChange={(e) => setForm((s) => ({ ...s, itemsPerBox: Math.max(1, Number(e.target.value)) }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Loose Items</label>
                    <input type="number" min={0} value={form.looseItems} onChange={(e) => setForm((s) => ({ ...s, looseItems: Math.max(0, Number(e.target.value)) }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Tax</label>
                    <input type="number" min={0} value={form.tax} onChange={(e) => setForm((s) => ({ ...s, tax: Math.max(0, Number(e.target.value)) }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Low stock (boxes)</label>
                    <input type="number" min={0} value={form.lowStockBoxes} onChange={(e) => setForm((s) => ({ ...s, lowStockBoxes: Number(e.target.value) }))} className="w-full border rounded px-3 py-2" />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Low stock (loose)</label>
                    <input type="number" min={0} value={form.lowStockItems} onChange={(e) => setForm((s) => ({ ...s, lowStockItems: Number(e.target.value) }))} className="w-full border rounded px-3 py-2" />
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
};

export default UserInventoryManager;
