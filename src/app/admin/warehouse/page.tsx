"use client";

import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function WarehouseOverview() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: warehouses, loading } = useSelector(
    (state: RootState) => state.warehouse
  );

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  // 🟦 Save handler
  const handleSave = async () => {
    if (!name.trim()) return alert("Name is required");

    if (editing) {
      await dispatch(updateWarehouse({ id: editing._id, name, address }));
    } else {
      await dispatch(createWarehouse({ name, address }));
    }

    setShowModal(false);
    setEditing(null);
    setName("");
    setAddress("");
  };

  // 🟥 Delete handler (cleaned)
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      await dispatch(deleteWarehouse(id));
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            🏭 Warehouse Overview
          </h1>
          <button
            onClick={() => {
              setShowModal(true);
              setEditing(null);
              setName("");
              setAddress("");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Warehouse
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Total Warehouses:{" "}
            <span className="text-blue-600">{warehouses.length}</span>
          </h2>
        </div>

        {/* Warehouse List */}
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            All Warehouses
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : warehouses.length === 0 ? (
            <p className="text-gray-500">No warehouses found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Address</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w) => (
                    <tr
                      key={w._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-3">{w.name}</td>
                      <td className="p-3">{w.address || "—"}</td>
                      <td className="p-3 text-center flex justify-center gap-3">
                        <button
                          onClick={() => {
                            setEditing(w);
                            setName(w.name);
                            setAddress(w.address || "");
                            setShowModal(true);
                          }}
                        >
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </button>
                        <button onClick={() => handleDelete(w._id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg w-11/12 sm:w-96 space-y-4 shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2 className="text-xl font-semibold">
                {editing ? "Edit Warehouse" : "Create Warehouse"}
              </h2>

              <input
                type="text"
                placeholder="Warehouse Name"
                className="w-full border px-3 py-2 rounded-md"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Address (optional)"
                className="w-full border px-3 py-2 rounded-md"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 border rounded-md"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  onClick={handleSave}
                >
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
