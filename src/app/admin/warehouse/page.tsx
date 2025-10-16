'use client';
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Pencil, Trash2, Plus } from "lucide-react";
import WarehouseSelector from "../components/Warehouse/WarehouseSelector";
import DashboardStats from "../components/Warehouse/DashboardStats";
import InventoryTable, { InventoryRow } from "../components/Warehouse/InventoryTable";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/store/store";
import { createWarehouse, deleteWarehouse, fetchWarehouses, updateWarehouseName, Warehouse } from "@/store/warehouseSlice";

export default function WarehouseDashboard() {
  const dispatch = useDispatch();
  const { list: warehouses } = useSelector((state: RootState) => state.warehouse);

  const [activeWarehouse, setActiveWarehouse] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const SAMPLE_ROWS: InventoryRow[] = [
    { id: "p1", name: "Akash Aloo Bhujia", sku: "AK-AL-BH-001", category: "Snacks", stockByWarehouse: { "Warehouse 1": 50 }, location: "Shelf 1", lastUpdated: "2025-03-08" }
  ];

  useEffect(() => { dispatch(fetchWarehouses() as any); }, [dispatch]);
  useEffect(() => { if (warehouses.length) setActiveWarehouse(warehouses[0].name); }, [warehouses]);

  const openEditModal = (w: Warehouse) => {
    setEditingWarehouse(w);
    setName(w.name);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name) return alert("Name cannot be empty");
    if (editingWarehouse) {
      dispatch(updateWarehouseName({ id: editingWarehouse.id, name }) as any);
    } else {
      if (!email || !username || !password) return alert("All fields required");
      dispatch(createWarehouse({ name, email, username, password }) as any);
    }
    setShowModal(false);
    setEditingWarehouse(null);
    setName(""); setEmail(""); setUsername(""); setPassword("");
  };

  const handleDelete = (id: string) => { if (confirm("Delete this warehouse?")) dispatch(deleteWarehouse(id) as any); };

  return (
    <div className="p-8 bg-[var(--color-neutral)] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-[var(--color-sidebar)]">Warehouse Dashboard</h1>
        <DashboardStats />
        <div className="bg-[var(--color-white)] rounded-lg border p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <WarehouseSelector warehouses={warehouses.map((w) => w.name)} active={activeWarehouse} onChange={setActiveWarehouse} />
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-md" onClick={() => { setEditingWarehouse(null); setName(""); setEmail(""); setUsername(""); setPassword(""); setShowModal(true); }}>
              <Plus className="w-4 h-4" /> Add Warehouse
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[500px] w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-neutral)] text-left text-xs uppercase">
                  <th className="p-3 min-w-[150px]">Name</th>
                  <th className="p-3 min-w-[200px]">Email</th>
                  <th className="p-3 min-w-[150px]">Username</th>
                  <th className="p-3 min-w-[100px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.id} className="border-b hover:bg-[var(--color-neutral)] transition">
                    <td className="p-3 whitespace-nowrap">{w.name}</td>
                    <td className="p-3 whitespace-nowrap">{w.email}</td>
                    <td className="p-3 whitespace-nowrap">{w.username}</td>
                    <td className="p-3 flex justify-center gap-2">
                      <button onClick={() => openEditModal(w)}><Pencil className="w-4 h-4 text-blue-500" /></button>
                      <button onClick={() => handleDelete(w.id)}><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <InventoryTable rows={SAMPLE_ROWS} warehouse={activeWarehouse} />
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-6 rounded-lg w-11/12 sm:w-96 space-y-4 shadow-xl"
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <h2 className="text-xl font-bold">{editingWarehouse ? "Edit Warehouse" : "Create Warehouse"}</h2>
              
              <input type="text" placeholder="Name" className="w-full border px-3 py-2 rounded-md" value={name} onChange={(e) => setName(e.target.value)} />
              
              {!editingWarehouse && <>
                <input type="email" placeholder="Email" className="w-full border px-3 py-2 rounded-md" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="text" placeholder="Username" className="w-full border px-3 py-2 rounded-md" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full border px-3 py-2 rounded-md" value={password} onChange={(e) => setPassword(e.target.value)} />
              </>}

              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 border rounded-md" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md" onClick={handleSave}>
                  {editingWarehouse ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
