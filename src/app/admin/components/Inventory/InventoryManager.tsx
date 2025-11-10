"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

import { RootState, AppDispatch } from "@/store/store";
import { fetchInventory, addInventory, updateInventory, deleteInventory, InventoryItem } from "@/store/inventorySlice";
import { fetchProducts } from "@/store/productSlice";
import { fetchWarehouses } from "@/store/warehouseSlice";

interface Product { id: string | number; name: string; purchasePrice: number; }
interface Warehouse { id: number; name: string; }
interface InventoryForm {
    id?: number;
    productId: string | number;
    warehouseId: string | number;
    boxes: number;
    itemsPerBox: number;
    looseItems: number;
    lowStockBoxes: number;
    lowStockItems: number;
}

export default function InventoryManager() {
    const dispatch = useDispatch<AppDispatch>();
    const { items, loading } = useSelector((state: RootState) => state.inventory);
    const products: Product[] = useSelector((state: RootState) => state.product.products ?? []);
    const warehouses = (useSelector((state: RootState) => (state as any).warehouse?.warehouses ?? (state as any).warehouse?.list ?? []) ?? []) as any[];
    const [search, setSearch] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [selectedProduct, setSelectedProduct] = useState("");
    const [lowStockFilter, setLowStockFilter] = useState<"all" | "boxes" | "loose">("all");
    const [stockFilter, setStockFilter] = useState<"all" | "stock" | "out of stock" | "low stock">("all");

    const [form, setForm] = useState<InventoryForm>({
        id: undefined, productId: "", warehouseId: "", boxes: 0, itemsPerBox: 1, looseItems: 0, lowStockBoxes: 0, lowStockItems: 0
    });

    useEffect(() => {
        dispatch(fetchInventory());
        dispatch(fetchProducts());
        dispatch(fetchWarehouses());
    }, [dispatch]);

    const filteredItems = items.filter((inv: InventoryItem) => {
        const matchesProduct = selectedProduct ? inv.product?.id === Number(selectedProduct) : true;
        const matchesWarehouse = selectedWarehouse ? inv.warehouse?.id === Number(selectedWarehouse) : true;
        const matchesSearch = search
            ? inv.product?.name.toLowerCase().includes(search.toLowerCase()) ||
            inv.warehouse?.name.toLowerCase().includes(search.toLowerCase())
            : true;

        // Calculate totals
        const totalItems = inv.boxes * inv.itemsPerBox + inv.looseItems;
        const lowStockTotal = lowStockFilter === "boxes"
            ? inv.lowStockBoxes * inv.itemsPerBox
            : lowStockFilter === "loose"
                ? inv.lowStockItems
                : (inv.lowStockBoxes * inv.itemsPerBox + inv.lowStockItems);

        // Stock filter
        let matchesStock = true;
        if (stockFilter === "out of stock") matchesStock = totalItems === 0;
        else if (stockFilter === "low stock") matchesStock = totalItems > 0 && totalItems <= lowStockTotal;
        else if (stockFilter === "stock") matchesStock = totalItems > lowStockTotal;


        return matchesProduct && matchesWarehouse && matchesSearch && matchesStock;
    });


    const overview = warehouses.map((w) => {
        const warehouseItems = items.filter(i => i.warehouse?.id === w.id);
        const totalProducts = warehouseItems.length;
        const totalAmount = warehouseItems.reduce(
            (acc, i) => acc + ((i.boxes * i.itemsPerBox + i.looseItems) * i.product.purchasePrice),
            0
        );
        return { warehouse: w.name, totalProducts, totalAmount };
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.productId || !form.warehouseId) return Swal.fire("Error", "Select product & warehouse", "error");
        try {
            if (form.id) await dispatch(updateInventory({ ...form })).unwrap();
            else await dispatch(addInventory({ ...form })).unwrap();
            Swal.fire("Success", form.id ? "Stock updated" : "Stock added", "success");
            setForm({ id: undefined, productId: "", warehouseId: "", boxes: 0, itemsPerBox: 1, looseItems: 0, lowStockBoxes: 0, lowStockItems: 0 });
            dispatch(fetchInventory());
        } catch (err: any) { Swal.fire("Error", err?.message || "Operation failed", "error"); }
    };

    const handleEdit = (item: InventoryItem) => {
        setForm({
            id: item.id,
            productId: item.product?.id || "",
            warehouseId: item.warehouse?.id || "",
            boxes: item.boxes,
            itemsPerBox: item.itemsPerBox,
            looseItems: item.looseItems,
            lowStockBoxes: item.lowStockBoxes || 0,
            lowStockItems: item.lowStockItems || 0,
        });
    };

    const handleDelete = (id: number) => {
        Swal.fire({
            title: "Are you sure?", text: "This will delete the stock item!", icon: "warning",
            showCancelButton: true, confirmButtonColor: "#F05454", cancelButtonColor: "#A7C7E7",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => { if (result.isConfirmed) dispatch(deleteInventory(id)); });
    };

    const getStatusColor = (item: InventoryItem) => {
        const totalItems = item.boxes * item.itemsPerBox + item.looseItems;
        const lowTotal = lowStockFilter === "boxes"
            ? item.lowStockBoxes * item.itemsPerBox
            : lowStockFilter === "loose"
                ? item.lowStockItems
                : (item.lowStockBoxes * item.itemsPerBox + item.lowStockItems);

        if (totalItems === 0) return "var(--color-error)";
        if (totalItems <= lowTotal) return "var(--color-warning)";
        return "var(--color-success)";
    };

    return (
        <div className="p-6 bg-[var(--color-bg-light)] min-h-screen">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="bg-white p-6 rounded-2xl shadow-md">

                <h2 className="text-2xl font-semibold mb-6 text-center text-[var(--color-primary)]">Inventory Manager</h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
                    <input type="text" placeholder="Search by product or warehouse" value={search} onChange={e => setSearch(e.target.value)}
                        className="border p-2 rounded-lg w-full sm:w-1/3 focus:outline-none focus:border-[var(--color-primary)] transition-all" />
                    <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}
                        className="border p-2 rounded-lg w-full sm:w-1/4 transition-all">
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                        className="border p-2 rounded-lg w-full sm:w-1/4 transition-all">
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select value={stockFilter} onChange={e => setStockFilter(e.target.value as any)}
                        className="border p-2 rounded-lg w-full sm:w-1/4 transition-all">
                        <option value="all">All</option>
                        <option value="stock">Stock</option>
                        <option value="low stock">Low Stock</option>
                        <option value="out of stock">Out of Stock</option> {/* remove trailing space */}
                    </select>


                    <button onClick={() => { setSearch(""); setSelectedWarehouse(""); setSelectedProduct(""); setStockFilter("all"); }}
                        className="px-4 py-2 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-all">Clear</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {overview.map((o, idx) => (
                        <motion.div key={idx} whileHover={{ scale: 1.03 }}
                            className="p-4 rounded-lg shadow text-center bg-[var(--color-secondary)] text-[var(--color-sidebar)] transition-all">
                            <div className="font-semibold text-lg capitalize">{o.warehouse}</div>
                            <div className="mt-2">Total Products: <span className="font-medium">{o.totalProducts}</span></div>
                            <div>Total Amount: <span className="font-medium">₹{o.totalAmount.toFixed(2)}</span></div>
                        </motion.div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <label className="flex flex-col">Product
                        <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                            className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]">
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col">Warehouse
                        <select value={form.warehouseId} onChange={e => setForm({ ...form, warehouseId: e.target.value })}
                            className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]">
                            <option value="">Select Warehouse</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col">Boxes
                        <input type="number" min={0} value={form.boxes} onChange={e => setForm({ ...form, boxes: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
                    </label>
                    <label className="flex flex-col">Items per Box
                        <input type="number" min={1} value={form.itemsPerBox} onChange={e => setForm({ ...form, itemsPerBox: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
                    </label>
                    <label className="flex flex-col">Loose Items
                        <input type="number" min={0} value={form.looseItems} onChange={e => setForm({ ...form, looseItems: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
                    </label>
                    <label className="flex flex-col">Low Stock Boxes
                        <input type="number" min={0} value={form.lowStockBoxes} onChange={e => setForm({ ...form, lowStockBoxes: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
                    </label>
                    <label className="flex flex-col">Low Stock Loose
                        <input type="number" min={0} value={form.lowStockItems} onChange={e => setForm({ ...form, lowStockItems: Number(e.target.value) })}
                            className="w-full border rounded-lg p-2 focus:outline-none focus:border-[var(--color-primary)]" />
                    </label>
                    <div className="col-span-full flex justify-center mt-2">
                        <button type="submit" className="px-8 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-all">
                            {form.id ? "Update Stock" : "Add Stock"}
                        </button>
                    </div>
                </form>

                {loading ? <div className="text-center text-gray-500">Loading...</div> :
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
                                {filteredItems.map(inv => {
                                    const totalItems = inv.boxes * inv.itemsPerBox + inv.looseItems;
                                    const lowStockTotal = lowStockFilter === "boxes" ? inv.lowStockBoxes * inv.itemsPerBox :
                                        lowStockFilter === "loose" ? inv.lowStockItems : (inv.lowStockBoxes * inv.itemsPerBox + inv.lowStockItems);
                                    return (
                                        <tr key={inv.id} className="text-center capitalize hover:bg-[var(--color-neutral)] transition-all">
                                            <td className="border px-4 py-2">{inv.product?.name}</td>
                                            <td className="border px-4 py-2">{inv.warehouse?.name}</td>
                                            <td className="border px-4 py-2">{inv.boxes}</td>
                                            <td className="border px-4 py-2">{inv.itemsPerBox}</td>
                                            <td className="border px-4 py-2">{inv.looseItems}</td>
                                            <td className="border px-4 py-2">{totalItems}</td>
                                            <td className="border px-4 py-2">
                                                <span className="px-2 py-1 rounded-lg text-white text-sm font-medium"
                                                    style={{ backgroundColor: getStatusColor(inv) }}>
                                                    {totalItems === 0 ? "Out of Stock" : totalItems <= lowStockTotal ? "Low Stock" : "In Stock"}
                                                </span>
                                            </td>
                                            <td className="border px-4 py-2 flex justify-center gap-2">
                                                <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:opacity-90 transition-all"
                                                    onClick={() => handleEdit(inv)}>Edit</button>
                                                <button className="px-3 py-1 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-all"
                                                    onClick={() => handleDelete(inv.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>}
            </motion.div>
        </div>
    );
}
