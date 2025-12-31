"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  IndianRupee,
  Calendar,
  ChevronRight,
  CreditCard,
  Smartphone,
  Banknote,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Users,
  FileText,
} from "lucide-react";
import { useListBillsQuery, Bill } from "@/store/billingApi";

/* ================= TYPES ================= */

type PaymentSplit = {
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
};

type DateFilterType = "all" | "thisMonth" | "lastMonth" | "custom";

type CustomerAgg = {
  customerId: string;
  name: string;
  phone: string;
  bills: Bill[];
  totalOrders: number;
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  periodOrders: number;
  periodBilled: number;
};

/* ================= SAFE HELPERS ================= */

// bill amounts
const getBillDue = (bill: Bill): number =>
  Number(bill.balanceAmount || 0);

const getBillPaid = (bill: Bill): number =>
  Number(bill.amountCollected || 0);

const isBillPending = (bill: Bill): boolean =>
  getBillDue(bill) > 0;

// 🔒 SAFE DATE ACCESS (FIX FOR TS ERROR)
type BillWithDates = Bill & {
  invoiceDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

const getBillDate = (bill: Bill): string | undefined => {
  const b = bill as BillWithDates;
  return b.invoiceDate || b.updatedAt || b.createdAt;
};

/* ================= DATE UTILS ================= */

function startOfMonth(d: Date = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatCurrency(n: number) {
  return `₹${Math.round(Math.max(0, n)).toLocaleString("en-IN")}`;
}

function formatDateInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ================= COMPONENT ================= */

export default function PaymentsDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilterType, setDateFilterType] =
    useState<DateFilterType>("thisMonth");
  const [fromDate, setFromDate] =
    useState(formatDateInput(startOfMonth()));
  const [toDate, setToDate] =
    useState(formatDateInput(endOfMonth()));

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string | null>(null);

  const [paymentSplit, setPaymentSplit] =
    useState<PaymentSplit>({
      cashAmount: 0,
      upiAmount: 0,
      cardAmount: 0,
    });

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const { data, isLoading, refetch } =
    useListBillsQuery({ search: "" });

  const bills: Bill[] = data?.bills ?? [];

  const parsedFrom = useMemo(
    () => new Date(fromDate),
    [fromDate]
  );
  const parsedTo = useMemo(
    () => new Date(toDate),
    [toDate]
  );

  /* ================= DATE FILTER ================= */

  const isWithinRange = (
    billDate?: string
  ): boolean => {
    if (!billDate || dateFilterType === "all") return true;

    const d = new Date(billDate);
    if (Number.isNaN(d.getTime())) return true;

    if (dateFilterType === "thisMonth") {
      return d >= startOfMonth() && d <= endOfMonth();
    }

    if (dateFilterType === "lastMonth") {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return d >= s && d <= e;
    }

    return d >= parsedFrom && d <= parsedTo;
  };

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    let totalOrders = 0;
    let totalBilled = 0;
    let totalDue = 0;

    const map = new Map<string, CustomerAgg>();

    for (const bill of bills) {
      const info = bill.customerInfo || {};
      const cid =
        info.phone ||
        info.name ||
        `unknown-${bill._id}`;

      if (!map.has(cid)) {
        map.set(cid, {
          customerId: cid,
          name: info.name || "Unknown",
          phone: info.phone || "-",
          bills: [],
          totalOrders: 0,
          totalBilled: 0,
          totalPaid: 0,
          totalDue: 0,
          periodOrders: 0,
          periodBilled: 0,
        });
      }

      const entry = map.get(cid)!;
      entry.bills.push(bill);

      const due = getBillDue(bill);
      const paid = getBillPaid(bill);

      entry.totalOrders += 1;
      entry.totalBilled += due + paid;
      entry.totalPaid += paid;
      entry.totalDue += due;

      totalOrders += 1;
      totalBilled += due + paid;
      totalDue += due;

      const billDate = getBillDate(bill);
      if (isWithinRange(billDate)) {
        entry.periodOrders += 1;
        entry.periodBilled += due + paid;
      }
    }

    return {
      totalOrders,
      totalBilled,
      totalDue,
      totalCustomers: map.size,
    };
  }, [bills, dateFilterType, parsedFrom, parsedTo]);

  /* ================= CUSTOMERS ================= */

  const customersAggregated = useMemo(() => {
    const map = new Map<string, CustomerAgg>();

    for (const bill of bills) {
      const info = bill.customerInfo || {};
      const cid =
        info.phone ||
        info.name ||
        `unknown-${bill._id}`;

      if (!map.has(cid)) {
        map.set(cid, {
          customerId: cid,
          name: info.name || "Unknown",
          phone: info.phone || "-",
          bills: [],
          totalOrders: 0,
          totalBilled: 0,
          totalPaid: 0,
          totalDue: 0,
          periodOrders: 0,
          periodBilled: 0,
        });
      }

      const entry = map.get(cid)!;
      entry.bills.push(bill);

      const due = getBillDue(bill);
      const paid = getBillPaid(bill);

      entry.totalOrders += 1;
      entry.totalBilled += due + paid;
      entry.totalPaid += paid;
      entry.totalDue += due;

      const billDate = getBillDate(bill);
      if (isWithinRange(billDate)) {
        entry.periodOrders += 1;
        entry.periodBilled += due + paid;
      }
    }

    let arr = Array.from(map.values());

    if (searchTerm.trim()) {
      const st = searchTerm.toLowerCase();
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(st) ||
          c.phone.includes(st)
      );
    }

    arr.sort((a, b) =>
      b.periodOrders !== a.periodOrders
        ? b.periodOrders - a.periodOrders
        : b.totalDue - a.totalDue
    );

    return arr;
  }, [bills, searchTerm, dateFilterType, parsedFrom, parsedTo]);

  const selectedCustomer = useMemo(() => {
    return customersAggregated.find((c) => c.customerId === selectedCustomerId) || null;
  }, [customersAggregated, selectedCustomerId]);

  const selectedPendingBills = useMemo(() => {
    if (!selectedCustomer) return [];
    return selectedCustomer.bills
      .filter(isBillPending)
      .sort((a, b) => {
        const n1 = parseInt((a.invoiceNumber || "").match(/\d+$/)?.[0] || "999999");
        const n2 = parseInt((b.invoiceNumber || "").match(/\d+$/)?.[0] || "999999");
        return n1 - n2;
      });
  }, [selectedCustomer]);

  const totalDueSelected = useMemo(() => {
    return selectedPendingBills.reduce((sum, bill) => sum + getBillDue(bill), 0);
  }, [selectedPendingBills]);

  const totalPaymentAmount = paymentSplit.cashAmount + paymentSplit.upiAmount + paymentSplit.cardAmount;

  const paymentPreview = useMemo(() => {
    let remaining = totalPaymentAmount;
    return selectedPendingBills.map((bill) => {
      const due = getBillDue(bill);
      const allocated = Math.min(remaining, due);
      remaining -= allocated;
      return {
        billId: bill._id!,
        billNumber: bill.invoiceNumber || bill._id!.slice(-6),
        due,
        allocated,
        remainingDue: Math.max(0, due - allocated),
      };
    });
  }, [selectedPendingBills, totalPaymentAmount]);

  const handleOpenPayment = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setPaymentSplit({ cashAmount: 0, upiAmount: 0, cardAmount: 0 });
    setError("");
  };

  const handleClosePayment = () => {
    setSelectedCustomerId(null);
    setPaymentSplit({ cashAmount: 0, upiAmount: 0, cardAmount: 0 });
    setError("");
  };

  const handleMakePayment = async () => {
    if (!selectedCustomer || totalPaymentAmount <= 0 || totalPaymentAmount > totalDueSelected) {
      setError("Invalid payment amount");
      return;
    }

    setUpdating(true);
    setError("");

    try {
      let remaining = totalPaymentAmount;
      const totalInput = totalPaymentAmount || 1;
      const cashRatio = paymentSplit.cashAmount / totalInput;
      const upiRatio = paymentSplit.upiAmount / totalInput;
      const cardRatio = paymentSplit.cardAmount / totalInput;

      for (const bill of selectedPendingBills) {
        if (remaining <= 0) break;
        const due = getBillDue(bill);
        const payNow = Math.min(remaining, due);

        const basePayment = {
          cashAmount: Number(bill.payment?.cashAmount || 0),
          upiAmount: Number(bill.payment?.upiAmount || 0),
          cardAmount: Number(bill.payment?.cardAmount || 0),
        };

        const billCash = Math.round(payNow * cashRatio);
        const billUpi = Math.round(payNow * upiRatio);
        const billCard = payNow - billCash - billUpi;

        const paymentUpdate = {
          cashAmount: basePayment.cashAmount + billCash,
          upiAmount: basePayment.upiAmount + billUpi,
          cardAmount: basePayment.cardAmount + billCard,
        };

        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billId: bill._id,
            amountCollected: getBillPaid(bill) + payNow,
            balanceAmount: Math.max(0, due - payNow),
            payment: paymentUpdate,
          }),
        });

        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.error || "Payment failed");
        }

        remaining -= payNow;
      }

      setSuccessMsg(`${formatCurrency(totalPaymentAmount)} recorded for ${selectedCustomer.name}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await refetch();
      handleClosePayment();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-600 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Payment Collection
              </h1>
              <p className="text-gray-600 mt-1">All customers overview · Oldest invoices first</p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all border border-blue-700/50 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Billed</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBilled)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Due</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalDue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="w-full lg:w-64 relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customer by name or phone"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { type: "all" as DateFilterType, label: "All Time" },
                { type: "thisMonth" as DateFilterType, label: "This Month" },
                { type: "lastMonth" as DateFilterType, label: "Last Month" },
                { type: "custom" as DateFilterType, label: "Custom" },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setDateFilterType(type)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-2 shadow-sm ${
                    dateFilterType === type
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-blue-500/25"
                      : "bg-white/50 text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dateFilterType === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* CUSTOMERS TABLE */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Top Customers</h2>
                <p className="text-sm text-gray-600">Sorted by orders in selected period</p>
              </div>
              <div className="text-sm text-gray-500">
                {customersAggregated.length} customers
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-gray-700">Phone</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">Total Orders</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">Period Orders</th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-gray-700">Billed</th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-gray-700">Paid</th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-gray-700">Due</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {customersAggregated.map((c, index) => (
                  <tr key={c.customerId} className="border-t hover:bg-white/70 transition-all">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-sm">{c.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.periodOrders} orders this period</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-mono text-sm">{c.phone}</td>
                    <td className="py-4 px-6 text-center font-bold text-lg text-gray-900">{c.totalOrders}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 font-bold text-sm shadow-sm">
                        {c.periodOrders}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-gray-900 text-sm">{formatCurrency(c.totalBilled)}</td>
                    <td className="py-4 px-6 text-right font-bold text-emerald-700 text-sm">{formatCurrency(c.totalPaid)}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm ${
                        c.totalDue > 0
                          ? "bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-200"
                          : "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-200"
                      }`}>
                        {formatCurrency(c.totalDue)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleOpenPayment(c.customerId)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all border border-blue-700/50"
                      >
                        Collect
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENT PANEL */}
        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={handleClosePayment} />
            <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl shadow-2xl border border-white/50 flex flex-col max-h-screen">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
                    <p className="text-sm text-gray-600">Split across Cash + UPI + Card</p>
                  </div>
                  <button onClick={handleClosePayment} className="p-2 rounded-xl hover:bg-gray-200 transition-colors">
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <IndianRupee className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-gray-900">{selectedCustomer.name}</h4>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Total Due</div>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalDueSelected)}</div>
                  </div>
                </div>
              </div>

              {/* Payment Split Inputs */}
              <div className="p-6 border-b border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">Payment Split</span>
                  <span className="text-sm font-semibold text-gray-700">
                    Total: <span className="text-lg">{formatCurrency(totalPaymentAmount)}</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "cashAmount" as const, icon: Banknote, label: "Cash", color: "emerald" },
                    { key: "upiAmount" as const, icon: Smartphone, label: "UPI", color: "indigo" },
                    { key: "cardAmount" as const, icon: CreditCard, label: "Card", color: "purple" },
                  ].map(({ key, icon: Icon, label, color }) => (
                    <div key={key} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all bg-gradient-to-b from-white to-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4 w-4 text-${color}-600`} />
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-700">{label}</span>
                      </div>
                      <div className="relative">
                        <IndianRupee className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="number"
                          min={0}
                          value={paymentSplit[key] || ""}
                          onChange={(e) =>
                            setPaymentSplit(prev => ({
                              ...prev,
                              [key]: Number(e.target.value) || 0
                            }))
                          }
                          className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-wider"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices Preview */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b p-4">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Invoice Allocation (Oldest First)</h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="text-left py-2 px-3 font-bold text-gray-700">Invoice</th>
                        <th className="text-right py-2 px-3 font-bold text-gray-700">Due</th>
                        <th className="text-right py-2 px-3 font-bold text-gray-700">Paid Now</th>
                        <th className="text-right py-2 px-3 font-bold text-gray-700">Balance</th>
                        <th className="text-center py-2 px-3 font-bold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentPreview.map((p) => (
                        <tr key={p.billId} className="border-t hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-mono font-semibold">#{p.billNumber}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatCurrency(p.due)}</td>
                          <td className="py-2 px-3 text-right">
                            {p.allocated > 0 ? <span className="text-emerald-600 font-bold">-{formatCurrency(p.allocated)}</span> : "—"}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold">{formatCurrency(p.remainingDue)}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.remainingDue === 0 ? "bg-emerald-100 text-emerald-800" :
                              p.allocated > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                            }`}>
                              {p.remainingDue === 0 ? "Cleared" : p.allocated > 0 ? "Partial" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={handleMakePayment}
                  disabled={updating || totalPaymentAmount <= 0 || selectedPendingBills.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all border border-blue-700/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="h-4 w-4" />
                      Record {formatCurrency(totalPaymentAmount)} Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS TOAST */}
        {showSuccess && (
          <div className="fixed top-6 right-6 bg-gradient-to-r from-emerald-600 to-emerald-700 border border-emerald-700/50 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-sm">Payment Successful!</div>
                <div className="text-xs">{successMsg}</div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR TOAST */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-red-700 border border-red-700/50 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 max-w-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">{error}</div>
                <button onClick={() => setError("")} className="mt-1 text-xs underline hover:opacity-75">Dismiss</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
