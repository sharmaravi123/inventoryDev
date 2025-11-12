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
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Small helper: format address snippet
const addrSnippet = (a?: string) => (a && a.length > 40 ? a.slice(0, 40) + "…" : a || "—");

// Safely read optional createdAt without using `any`
function getCreatedAt(w: Warehouse): string | undefined {
  // If your Warehouse type later includes createdAt, remove casts and return directly.
  return (w as unknown as { createdAt?: string }).createdAt;
}

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modal = { hidden: { scale: 0.95, opacity: 0 }, visible: { scale: 1, opacity: 1 } };
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
  const [sortKey, setSortKey] = useState<"name" | "createdAt">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  // Derived and memoized filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = warehouses.slice();
    if (q) {
      arr = arr.filter(
        (w) => w.name.toLowerCase().includes(q) || (w.address || "").toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => {
      const aKey = sortKey === "name" ? a.name.toLowerCase() : (getCreatedAt(a) || "");
      const bKey = sortKey === "name" ? b.name.toLowerCase() : (getCreatedAt(b) || "");
      if (aKey < bKey) return sortDir === "asc" ? -1 : 1;
      if (aKey > bKey) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [warehouses, query, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pages) setPage(1);
  }, [pages, page]);

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
        await dispatch(updateWarehouse({ id: editing._id, name: name.trim(), address: address.trim() }));
      } else {
        await dispatch(createWarehouse({ name: name.trim(), address: address.trim() }));
      }
      setShowModal(false);
      setEditing(null);
      setName("");
      setAddress("");
    } catch (err) {
      console.error(err);
      alert("Something went wrong — try again.");
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
    <div className="p-6 md:p-10 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">🏭 Warehouse Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Manage warehouses — create, edit, and organize with ease.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm w-full md:w-auto">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or address"
                className="outline-none w-48 md:w-72 text-sm"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="ml-2 p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
            >
              <Plus className="w-4 h-4" /> Add Warehouse
            </button>
          </div>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <h3 className="text-sm text-gray-500">Total Warehouses</h3>
            <div className="mt-2 text-2xl font-bold text-gray-900">{warehouses.length}</div>
            <p className="text-xs text-gray-400 mt-1">All active warehouses in the system</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <h3 className="text-sm text-gray-500">Showing</h3>
            <div className="mt-2 text-2xl font-bold text-gray-900">{filtered.length}</div>
            <p className="text-xs text-gray-400 mt-1">Filtered by search & sort</p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between">
            <div>
              <h3 className="text-sm text-gray-500">Sort</h3>
              <div className="mt-2 flex gap-2">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as "name" | "createdAt")}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="name">Name</option>
                  <option value="createdAt">Created</option>
                </select>
                <button
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  {sortDir === "asc" ? "Asc" : "Desc"}
                </button>
              </div>
            </div>

            <div className="text-right text-sm text-gray-400">Page {page} / {pages}</div>
          </div>
        </div>

        {/* Swiper summary for mobile */}
        <div className="md:hidden mb-4">
          <Swiper
            modules={[Pagination, Navigation, A11y]}
            slidesPerView={1.2}
            spaceBetween={12}
            pagination={{ clickable: true }}
            navigation
          >
            {pageItems.map((w) => (
              <SwiperSlide key={w._id}>
                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-base">{w.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{addrSnippet(w.address)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(w)} className="p-2 rounded hover:bg-gray-100">
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => handleDelete(w._id)} className="p-2 rounded hover:bg-gray-100">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Table - desktop */}
        <div className="hidden md:block bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Address</th>
                <th className="p-4 text-left">Created</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="visible">
              {loading ? (
                // Loading skeleton rows
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
              ) : pageItems.length === 0 ? (
                <tr className="border-t">
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No warehouses found.
                  </td>
                </tr>
              ) : (
                pageItems.map((w) => (
                  <motion.tr
                    key={w._id}
                    className="border-t hover:bg-gray-50"
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <td className="p-4">{w.name}</td>
                    <td className="p-4">{w.address || "—"}</td>
                    <td className="p-4 text-sm text-gray-500">
                      {getCreatedAt(w) ? new Date(getCreatedAt(w) as string).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(w)}
                          className="p-2 rounded hover:bg-gray-100 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(w._id)}
                          className="p-2 rounded hover:bg-gray-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">Showing {pageItems.length} of {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Prev
              </button>
              <div className="px-3 py-1 border rounded-md">{page}</div>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1 border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
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
                  <h3 className="text-lg font-semibold">{editing ? "Edit Warehouse" : "Create Warehouse"}</h3>
                  <button onClick={() => setShowModal(false)} className="p-2 rounded hover:bg-gray-100">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm text-gray-600">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Warehouse name"
                  />

                  <label className="block text-sm text-gray-600">Address (optional)</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 h-24 resize-none"
                    placeholder="Street, city, state, etc."
                  />
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
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
