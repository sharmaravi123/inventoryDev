"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from "recharts";
import { useListBillsQuery, type Bill } from "@/store/billingApi";

type ProductBarData = {
  name: string;
  sales: number;
};

type TopProductsBySalesProps = {
  warehouseId?: string;
};

interface BillWithWarehouse extends Bill {
  warehouseId?: string;
  warehouse?: {
    _id?: string;
    name?: string;
  };
}

export default function TopProductsVertical({ warehouseId }: TopProductsBySalesProps) {
  const { data, isLoading } = useListBillsQuery({ search: "" });
  const bills = (data?.bills ?? []) as BillWithWarehouse[];

  const filteredBills = useMemo(() => {
    if (!warehouseId) return bills;

    const hasWarehouseInfo = bills.some(
      b => b.warehouseId || b.warehouse?._id
    );

    if (!hasWarehouseInfo) return bills;

    const filtered = bills.filter(b => {
      const objectId = b.warehouse?._id;
      const directId = b.warehouseId;
      return objectId === warehouseId || directId === warehouseId;
    });

    return filtered.length > 0 ? filtered : bills;
  }, [bills, warehouseId]);

  const chartData: ProductBarData[] = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const salesMap = new Map<string, number>();

    filteredBills.forEach(bill => {
      const d = new Date(bill.billDate);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;

      bill.items.forEach(item => {
        const name = item.productName || "Unknown";
        const baseAmount =
          typeof item.lineTotal === "number"
            ? item.lineTotal
            : typeof item.sellingPrice === "number" &&
              typeof item.totalItems === "number"
              ? item.sellingPrice * item.totalItems
              : 0;

        const prev = salesMap.get(name) ?? 0;
        salesMap.set(name, prev + baseAmount);
      });
    });

    const arr = Array.from(salesMap.entries()).map(([name, sales]) => ({
      name,
      sales
    }));

    arr.sort((a, b) => b.sales - a.sales);

    return arr.slice(0, 5);
  }, [filteredBills]);

  return (
    <div className="rounded-2xl bg-white shadow p-6 w-full max-w-xl">
      <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
      <p className="text-xs text-gray-500 mb-4">Sales performance this month</p>

      <div className="w-full h-80">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No sales data found
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid stroke="#E5E7EB" vertical={false} />

              <XAxis
                dataKey="name"
                tick={{ fill: "#374151", fontSize: 11 }}
                interval={0}
              />

              <YAxis
                tick={{ fill: "#374151", fontSize: 11 }}
              />

              <Tooltip
                formatter={v => `₹${(v as number).toFixed(2)}`}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                }}
              />

              <Bar
                dataKey="sales"
                fill="var(--color-primary)"
                radius={[8, 8, 0, 0]}
                barSize={40}
              >
                <LabelList
                  dataKey="sales"
                  position="top"
                  content={(props) => {
                    const { value, x, y } = props;

                    const safeX = typeof x === "number" ? x : 0;
                    const safeY = typeof y === "number" ? y - 6 : 0;

                    return (
                      <text
                        x={safeX}
                        y={safeY}
                        fill="var(--color-sidebar)"
                        fontSize={12}
                        textAnchor="middle"
                      >
                        ₹{Number(value || 0).toFixed(0)}
                      </text>
                    );
                  }}
                />
              </Bar>


            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
