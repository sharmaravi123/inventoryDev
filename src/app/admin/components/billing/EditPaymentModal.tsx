// src/app/admin/components/billing/EditPaymentModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Bill,
  PaymentMode,
  CreateBillPaymentInput,
  useUpdateBillPaymentMutation,
} from "@/store/billingApi";

type EditPaymentModalProps = {
  bill?: Bill;
  onClose: () => void;
  onUpdated: () => void;
};

type LocalPaymentState = {
  mode: PaymentMode;
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
};

export default function EditPaymentModal({
  bill,
  onClose,
  onUpdated,
}: EditPaymentModalProps) {
  const [extraPayment, setExtraPayment] = useState<LocalPaymentState>({
    mode: "CASH",
    cashAmount: 0,
    upiAmount: 0,
    cardAmount: 0,
  });

  const [updatePayment, { isLoading }] = useUpdateBillPaymentMutation();

  useEffect(() => {
    if (!bill) return;
    setExtraPayment({
      mode: bill.payment.mode,
      cashAmount: 0,
      upiAmount: 0,
      cardAmount: 0,
    });
  }, [bill]);

  if (!bill) return null;

  const base = bill.payment;

  const totalNewPaid =
    base.cashAmount +
    base.upiAmount +
    base.cardAmount +
    extraPayment.cashAmount +
    extraPayment.upiAmount +
    extraPayment.cardAmount;

  const handleModeChange = (mode: PaymentMode): void => {
    setExtraPayment((prev) => ({
      ...prev,
      mode,
    }));
  };

  const handleSave = async (): Promise<void> => {
    if (totalNewPaid > bill.grandTotal + 0.001) {
      alert("Total collected amount cannot exceed grand total");
      return;
    }

    const payload: CreateBillPaymentInput = {
      mode: extraPayment.mode,
      cashAmount: base.cashAmount + extraPayment.cashAmount,
      upiAmount: base.upiAmount + extraPayment.upiAmount,
      cardAmount: base.cardAmount + extraPayment.cardAmount,
    };

    try {
      await updatePayment({ id: bill._id, payment: payload }).unwrap();
      onUpdated();
    } catch {
      alert("Failed to update payment");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-[color:var(--color-white)] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[color:var(--color-sidebar)]">
            Edit Payment – {bill.invoiceNumber}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-2 text-xs"
          >
            ✕
          </button>
        </div>

        <p className="mb-1 text-xs text-slate-600">
          Grand total: ₹{bill.grandTotal.toFixed(2)}
        </p>
        <p className="mb-2 text-xs text-slate-600">
          Current paid: ₹{bill.amountCollected.toFixed(2)} • Current balance: ₹
          {bill.balanceAmount.toFixed(2)}
        </p>

        <div className="mb-2 flex gap-2 text-xs">
          {(["CASH", "UPI", "CARD", "SPLIT"] as PaymentMode[]).map((modeVal) => (
            <button
              key={modeVal}
              type="button"
              onClick={() => handleModeChange(modeVal)}
              className={`rounded-full border px-3 py-1 ${
                extraPayment.mode === modeVal
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]"
                  : "border-slate-300 text-slate-700"
              }`}
            >
              {modeVal}
            </button>
          ))}
        </div>

        <p className="mb-1 text-[11px] text-slate-500">
          Yahan sirf <span className="font-semibold">additional</span> amount daalo jo ab collect kar rahe ho.
        </p>

        <div className="mb-2 rounded-lg bg-slate-50 p-2 text-[11px]">
          <p className="font-semibold text-slate-700">Existing payment</p>
          <p>Cash: ₹{base.cashAmount.toFixed(2)}</p>
          <p>UPI: ₹{base.upiAmount.toFixed(2)}</p>
          <p>Card: ₹{base.cardAmount.toFixed(2)}</p>
        </div>

        <div className="space-y-2 text-sm">
          {(extraPayment.mode === "CASH" || extraPayment.mode === "SPLIT") && (
            <div>
              <label className="block text-xs font-medium">
                Add Cash Amount
              </label>
              <input
                type="number"
                min={0}
                value={extraPayment.cashAmount}
                onChange={(e) =>
                  setExtraPayment((prev) => ({
                    ...prev,
                    cashAmount: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          )}

          {(extraPayment.mode === "UPI" || extraPayment.mode === "SPLIT") && (
            <div>
              <label className="block text-xs font-medium">
                Add UPI Amount
              </label>
              <input
                type="number"
                min={0}
                value={extraPayment.upiAmount}
                onChange={(e) =>
                  setExtraPayment((prev) => ({
                    ...prev,
                    upiAmount: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          )}

          {(extraPayment.mode === "CARD" || extraPayment.mode === "SPLIT") && (
            <div>
              <label className="block text-xs font-medium">
                Add Card Amount
              </label>
              <input
                type="number"
                min={0}
                value={extraPayment.cardAmount}
                onChange={(e) =>
                  setExtraPayment((prev) => ({
                    ...prev,
                    cardAmount: Number(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            New total paid: ₹{totalNewPaid.toFixed(2)} • New balance: ₹
            {(bill.grandTotal - totalNewPaid).toFixed(2)}
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="rounded-lg bg-[color:var(--color-primary)] px-4 py-1.5 font-semibold text-[color:var(--color-white)] disabled:opacity-60"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
