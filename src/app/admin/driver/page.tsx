// src/app/admin/driver-manager/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  Driver,
  fetchDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  clearDriverError,
} from "@/store/driverSlice";

export default function DriverManagerPage() {
  const dispatch = useAppDispatch();
  const { items, loading, saving, deletingId, error } = useAppSelector(
    (state) => state.driver
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // initial load
  useEffect(() => {
    void dispatch(fetchDrivers());
  }, [dispatch]);

  const resetForm = (): void => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setVehicleNumber("");
    setVehicleType("");
    setIsActive(true);
    setEditingId(null);
  };

  const startEdit = (driver: Driver): void => {
    setEditingId(driver._id);
    setName(driver.name);
    setEmail(driver.email);
    setPassword("");
    setPhone(driver.phone);
    setVehicleNumber(driver.vehicleNumber);
    setVehicleType(driver.vehicleType ?? "");
    setIsActive(driver.isActive);
    setSuccess(null);
    setLocalError(null);
    dispatch(clearDriverError());
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setLocalError(null);
    setSuccess(null);
    dispatch(clearDriverError());

    if (!name.trim() || !email.trim()) {
      setLocalError("Name and email are required");
      return;
    }

    if (!editingId && password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    try {
      if (editingId) {
        // UPDATE
        const updates = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          vehicleNumber: vehicleNumber.trim(),
          vehicleType: vehicleType.trim() || undefined,
          isActive,
          // password optional; only send if filled
          ...(password.trim().length >= 6
            ? { password: password.trim() }
            : {}),
        };

        await dispatch(
          updateDriver({ id: editingId, updates })
        ).unwrap();

        setSuccess("Driver updated successfully");
      } else {
        // CREATE
        await dispatch(
          createDriver({
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            phone: phone.trim(),
            vehicleNumber: vehicleNumber.trim(),
            vehicleType: vehicleType.trim() || undefined,
          })
        ).unwrap();

        setSuccess("Driver created successfully");
      }

      resetForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Operation failed";
      setLocalError(message);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    setLocalError(null);
    setSuccess(null);
    dispatch(clearDriverError());

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this driver?"
    );
    if (!confirmDelete) return;

    try {
      await dispatch(deleteDriver(id)).unwrap();
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Driver deleted successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete driver";
      setLocalError(message);
    }
  };

  const isEditing = editingId !== null;
  const globalError = error ?? localError;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-[color:var(--color-primary)]">
            Driver Manager
          </h1>
          <p className="text-sm text-slate-600">
            Create driver accounts with email/password and assign their vehicle details.
          </p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {/* Create / Edit form */}
        <div className="rounded-xl bg-[color:var(--color-white)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--color-sidebar)]">
              {isEditing ? "Edit Driver" : "Create Driver"}
            </h2>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[color:var(--color-primary)] underline"
              >
                Cancel edit
              </button>
            )}
          </div>

          {globalError && (
            <div className="mb-2 rounded-lg bg-[color:var(--color-error)]/10 p-2 text-xs text-[color:var(--color-error)]">
              {globalError}
            </div>
          )}
          {success && (
            <div className="mb-2 rounded-lg bg-[color:var(--color-success)]/10 p-2 text-xs text-[color:var(--color-success)]">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-3 text-sm"
          >
            <div>
              <label className="mb-1 block font-medium">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                {isEditing ? "New Password (optional)" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Minimum 6 characters.{" "}
                {isEditing &&
                  "Leave blank if you do not want to change password."}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) =>
                    setVehicleNumber(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Vehicle Type{" "}
                <span className="text-xs text-slate-500">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) =>
                  setVehicleType(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Tempo, Truck, Bike..."
              />
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <input
                  id="driver-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label
                  htmlFor="driver-active"
                  className="text-xs text-slate-700"
                >
                  Active driver
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-2 w-full rounded-lg bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-white)] disabled:opacity-60"
            >
              {saving
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Create Driver"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="rounded-xl bg-[color:var(--color-white)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[color:var(--color-sidebar)]">
              Drivers
            </h2>
            <span className="text-xs text-slate-500">
              {loading ? "Loading..." : `${items.length} record(s)`}
            </span>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto text-sm">
            {items.length === 0 && !loading ? (
              <p className="text-slate-500">
                No drivers yet.
              </p>
            ) : (
              items.map((driver) => (
                <div
                  key={driver._id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {driver.name}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {driver.email}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {driver.phone}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Vehicle:{" "}
                        <span className="font-mono">
                          {driver.vehicleNumber}
                        </span>{" "}
                        {driver.vehicleType
                          ? `(${driver.vehicleType})`
                          : ""}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Status:{" "}
                        {driver.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => startEdit(driver)}
                        className="rounded-full border border-slate-300 px-3 py-0.5 hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(driver._id)}
                        disabled={deletingId === driver._id}
                        className="rounded-full border border-red-200 px-3 py-0.5 text-red-600 hover:border-red-400 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === driver._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
