"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  fetchWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  Warehouse,
} from "@/store/warehouseSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";

const addrSnippet = (a?: string) => (a && a.length > 60 ? a.slice(0, 60) + "…" : a || "—");

function getCreatedAt(w: Warehouse): string | undefined {
  return (w as unknown as { createdAt?: string }).createdAt;
}

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modal = { hidden: { scale: 0.98, opacity: 0 }, visible: { scale: 1, opacity: 1 } };
const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function WarehouseOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: warehouses, loading } = useSelector((s: RootState) => s.warehouse);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  // Filtered list (search only)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return warehouses.slice();
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.address || "").toLowerCase().includes(q)
    );
  }, [warehouses, query]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setAddress("");
    setShowModal(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setName(w.name);
    setAddress(w.address || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Please enter a warehouse name.");
    try {
      if (editing) {
        await dispatch(
          updateWarehouse({
            id: editing._id,
            name: name.trim(),
            address: address.trim(),
          })
        );
      } else {
        await dispatch(createWarehouse({ name: name.trim(), address: address.trim() }));
      }
      setShowModal(false);
      setEditing(null);
      setName("");
      setAddress("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this warehouse? This action cannot be undone.")) return;
    try {
      await dispatch(deleteWarehouse(id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: "var(--color-neutral)" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-2xl md:text-3xl font-extrabold flex items-center gap-3"
              style={{ color: "var(--color-sidebar)" }}
            >
              <span style={{ color: "var(--color-primary)" }}>🏭</span>
              Warehouse Overview
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-sidebar)", opacity: 0.75 }}>
              Manage warehouses — create, edit and remove with ease.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm flex-1 md:flex-none">
              <Search className="w-4 h-4 mr-2" style={{ color: "var(--color-secondary)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or address"
                className="outline-none w-full text-sm"
                aria-label="Search warehouses"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="ml-2 p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-4 h-4" style={{ color: "var(--color-secondary)" }} />
                </button>
              )}
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-white"
              style={{ background: "var(--color-primary)" }}
            >
              <Plus className="w-4 h-4" /> Add Warehouse
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="text-sm text-gray-500">Total Warehouses</h3>
            <div className="mt-2 text-2xl font-bold" style={{ color: "var(--color-sidebar)" }}>
              {warehouses.length}
            </div>
            <p className="text-xs text-gray-400 mt-1">All active warehouses</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="text-sm text-gray-500">Showing</h3>
            <div className="mt-2 text-2xl font-bold" style={{ color: "var(--color-sidebar)" }}>
              {filtered.length}
            </div>
            <p className="text-xs text-gray-400 mt-1">Filtered by search</p>
          </div>

         
        </div>

        {/* Table container - always present; horizontal scroll on small screens */}
        <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead style={{ background: "var(--color-neutral)" }} className="text-xs uppercase">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Address</th>
                <th className="p-4 text-left">Created</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <motion.tbody initial="hidden" animate="visible">
              {loading ? (
                // loading skeleton rows
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded w-40 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded w-56 animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex gap-2">
                        <div className="h-8 w-8 bg-gray-100 rounded-full inline-block animate-pulse" />
                        <div className="h-8 w-8 bg-gray-100 rounded-full inline-block animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr className="border-t">
                  <td colSpan={4} className="p-6 text-center" style={{ color: "var(--color-secondary)" }}>
                    No warehouses found.
                  </td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <motion.tr
                    key={w._id}
                    className="border-t hover:bg-gray-50"
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <td className="p-4">
                      <div className="font-medium" style={{ color: "var(--color-sidebar)" }}>{w.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{addrSnippet(w.address)}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-sm" style={{ color: "var(--color-sidebar)" }}>{w.address || "—"}</div>
                    </td>

                    <td className="p-4 text-sm" style={{ color: "var(--color-sidebar)" }}>
                      {getCreatedAt(w) ? new Date(getCreatedAt(w) as string).toLocaleDateString() : "—"}
                    </td>

                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2 justify-center">
                        <button
                          onClick={() => openEdit(w)}
                          className="px-3 py-1 hover:bg-[var(--color-primary)]/50 rounded-md flex items-center gap-2 hover:bg-[var(--color-neutral)] transition"
                          title="Edit"
                          aria-label={`Edit ${w.name}`}
                        >
                          <Pencil className="w-4 h-4" style={{ color: "var(--color-primary)" }} />{" "}
                          <span className="" style={{ color: "var(--color-sidebar)" }}>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDelete(w._id)}
                          className="px-3 py-1 hover:bg-red-100 rounded-md flex items-center gap-2 hover:bg-[var(--color-neutral)] transition"
                          title="Delete"
                          aria-label={`Delete ${w.name}`}
                        >
                          <Trash2 className="w-4 h-4" style={{ color: "var(--color-error)" }} />{" "}
                          <span className="" style={{ color: "var(--color-sidebar)" }}>Delete</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center"
              variants={backdrop}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
                aria-hidden
              />

              <motion.div
                variants={modal}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="relative bg-white rounded-2xl w-11/12 max-w-lg mx-4 p-6 shadow-2xl border"
                role="dialog"
                aria-modal="true"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: "var(--color-sidebar)" }}>
                    {editing ? "Edit Warehouse" : "Create Warehouse"}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded hover:bg-gray-100">
                    <X className="w-4 h-4" style={{ color: "var(--color-secondary)" }} />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm text-gray-600">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2"
                    placeholder="Warehouse name"
                    aria-label="Warehouse name"
                    style={{ borderColor: "rgba(0,0,0,0.06)" }}
                  />

                  <label className="block text-sm text-gray-600">Address (optional)</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 h-24 resize-none"
                    placeholder="Street, city, state, etc."
                    aria-label="Warehouse address"
                    style={{ borderColor: "rgba(0,0,0,0.06)" }}
                  />
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-white rounded-lg"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {editing ? "Update" : "Create"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
