"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/warehouseSlice";
import { createUser, updateUserAccess, fetchUsers } from "@/store/userSlice.ts ";

// =======================
// ✅ Type definitions
// =======================
type AccessLevel = "limited" | "all";

interface Access {
  level: AccessLevel;
  permissions: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  access: Access;
}

interface Warehouse {
  _id: string;
  name: string;
}

// =======================
// ✅ Component
// =======================
export default function CreateUserPage() {
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector((s) => s.warehouse.list);
  const users = useAppSelector((s: any) => s.user?.list || []); // fixed TS error

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    warehouseId: "",
    accessLevel: "limited" as AccessLevel, // fixed
    permissions: [] as string[],
  });

  useEffect(() => {
    dispatch(fetchWarehouses());
    dispatch(fetchUsers());
  }, [dispatch]);

  const togglePermission = (perm: string) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm],
      };
    });
  };

  const handleCreate = () => {
    dispatch(
      createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        warehouseId: form.warehouseId,
        access: { level: form.accessLevel, permissions: form.permissions },
      })
    );
  };

  const handleUpdateAccess = (userId: string, level: AccessLevel, perms: string[]) => {
    dispatch(updateUserAccess({ userId, access: { level, permissions: perms } }));
  };

  // =======================
  // ✅ JSX
  // =======================
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Create User</h2>

      <input
        className="border rounded px-3 py-2 mb-3 w-full"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        className="border rounded px-3 py-2 mb-3 w-full"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        className="border rounded px-3 py-2 mb-3 w-full"
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <select
        className="border rounded px-3 py-2 mb-3 w-full"
        value={form.warehouseId}
        onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
      >
        <option value="">Select Warehouse</option>
        {warehouses.map((w: Warehouse) => (
          <option key={w._id} value={w._id}>
            {w.name}
          </option>
        ))}
      </select>

      <select
        className="border rounded px-3 py-2 mb-3 w-full"
        value={form.accessLevel}
        onChange={(e) =>
          setForm({
            ...form,
            accessLevel: e.target.value as AccessLevel, // fixed
          })
        }
      >
        <option value="all">All Access</option>
        <option value="limited">Limited</option>
      </select>

      <div className="mb-3">
        <label className="font-semibold">Permissions:</label>
        <div className="flex gap-3 flex-wrap mt-2">
          {["inventory", "orders", "reports", "billing"].map((perm) => (
            <label key={perm} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.permissions.includes(perm)}
                onChange={() => togglePermission(perm)}
              />
              {perm}
            </label>
          ))}
        </div>
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleCreate}
      >
        Create User
      </button>

      <hr className="my-6" />

      <h3 className="text-lg font-semibold mb-3">Existing Users</h3>
      <ul>
        {users.map((u: User) => (
          <li key={u._id} className="border p-3 mb-2 rounded">
            <p>
              {u.name} ({u.email})
            </p>
            <p>Access: {u.access.level}</p>
            <p>Permissions: {u.access.permissions.join(", ") || "None"}</p>

            <button
              className="bg-green-600 text-white px-2 py-1 rounded mt-2"
              onClick={() =>
                handleUpdateAccess(u._id, "all", [
                  "inventory",
                  "orders",
                  "reports",
                  "billing",
                ])
              }
            >
              Grant Full Access
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
