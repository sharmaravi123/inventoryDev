"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  useListBillsQuery,
  useMarkBillDeliveredMutation,
  Bill,
} from "@/store/billingApi";
import BillList from "@/app/admin/components/billing/BillList";
import BillPreview from "@/app/admin/components/billing/BillPreview";
import EditPaymentModal from "@/app/admin/components/billing/EditPaymentModal";

type DriverMe = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
};

export default function DriverOrdersPage() {
  const { data, isLoading, refetch } = useListBillsQuery({ search: "" });
  const bills = data?.bills ?? [];

  const [driver, setDriver] = useState<DriverMe | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);

  const [markBillDelivered] = useMarkBillDeliveredMutation();

  const [selectedBill, setSelectedBill] = useState<Bill | undefined>();
  const [paymentBill, setPaymentBill] = useState<Bill | undefined>();

  useEffect(() => {
    const loadDriver = async (): Promise<void> => {
      try {
        setDriverLoading(true);
        setDriverError(null);

        const res = await fetch("/api/driver/me", { method: "GET" });
        if (!res.ok) {
          setDriverError("Failed to load driver info");
          return;
        }
        const json = (await res.json()) as { driver: DriverMe };
        setDriver(json.driver);
      } catch {
        setDriverError("Failed to load driver info");
      } finally {
        setDriverLoading(false);
      }
    };

    void loadDriver();
  }, []);

  const driverBills = useMemo(() => {
    if (!driver) return [];
    return bills.filter((b) => b.driver === driver._id);
  }, [bills, driver]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[color:var(--color-sidebar)]">
            My Orders
          </h1>
          {driver && (
            <p className="text-xs text-slate-500">
              {driver.name} • {driver.vehicleNumber}
            </p>
          )}
          {driverError && (
            <p className="text-xs text-red-500">{driverError}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
        >
          Refresh
        </button>
      </div>

      <BillList
        bills={driverBills}
        loading={isLoading || driverLoading}
        onSelectBill={(bill) => setSelectedBill(bill)}
        onEditPayment={(bill) => setPaymentBill(bill)}
        onEditOrder={() => {
          // driver order edit nahi karega
        }}
        hideEditOrderButton
        onMarkDelivered={async (bill) => {
          await markBillDelivered({ billId: bill._id }).unwrap();
          void refetch();
        }}
      />

      {selectedBill && (
        <BillPreview
          bill={selectedBill}
          onClose={() => setSelectedBill(undefined)}
        />
      )}

      {paymentBill && (
        <EditPaymentModal
          bill={paymentBill}
          onClose={() => setPaymentBill(undefined)}
          onUpdated={() => {
            setPaymentBill(undefined);
            void refetch();
          }}
        />
      )}
    </div>
  );
}
