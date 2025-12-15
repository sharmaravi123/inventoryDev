"use client";

import React, { useState, useMemo } from "react";
import { useListBillsQuery, Bill } from "@/store/billingApi";
import {
    Search,
    IndianRupee,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Smartphone,
    Banknote,
    RefreshCw,
} from "lucide-react";
type PaymentUpdate = {
    cashAmount: number;
    upiAmount: number;
    cardAmount: number;
};
export default function PaymentsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] =
        useState<"cash" | "upi" | "card">("cash");
    const [showSuccess, setShowSuccess] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");

    const { data, isLoading, refetch } = useListBillsQuery({ search: "" });
    const bills: Bill[] = data?.bills ?? [];

    const customerBills = useMemo(() => {
        if (!searchTerm.trim()) return [];

        return bills
            .filter((b) => {
                const name = b.customerInfo?.name?.toLowerCase() || "";
                const phone = b.customerInfo?.phone || "";
                return (
                    name.includes(searchTerm.toLowerCase()) ||
                    phone.includes(searchTerm)
                );
            })
            .filter((b) => (b.balanceAmount || 0) > 0)
            .sort((a, b) => {
                const n1 = parseInt(
                    (a.invoiceNumber || "").match(/\d+$/)?.[0] || "999999"
                );
                const n2 = parseInt(
                    (b.invoiceNumber || "").match(/\d+$/)?.[0] || "999999"
                );
                return n1 - n2;
            })
            .slice(0, 10);
    }, [bills, searchTerm]);

    const totalDue = useMemo(
        () =>
            customerBills.reduce(
                (sum, b) => sum + (b.balanceAmount || 0),
                0
            ),
        [customerBills]
    );

    const paymentPreview = useMemo(() => {
        let remaining = paymentAmount;
        return customerBills.map((bill) => {
            const due = bill.balanceAmount || 0;
            const allocated = Math.min(remaining, due);
            remaining -= allocated;
            return {
                billId: bill._id,
                billNumber: bill.invoiceNumber || bill._id?.slice(-6),
                due,
                allocated,
                remainingDue: due - allocated,
            };
        });
    }, [customerBills, paymentAmount]);

    const handleMakePayment = async () => {
        if (paymentAmount <= 0) {
            setError("Enter valid amount");
            return;
        }

        setUpdating(true);
        setError("");

        try {
            let remaining = paymentAmount;

            for (const bill of customerBills) {
                if (remaining <= 0) break;

                const due = bill.balanceAmount || 0;
                const payNow = Math.min(remaining, due);

                const paymentUpdate = {
                    cashAmount: Number(bill.payment?.cashAmount || 0),
                    upiAmount: Number(bill.payment?.upiAmount || 0),
                    cardAmount: Number(bill.payment?.cardAmount || 0),
                };

                if (paymentMethod === "cash") {
                    paymentUpdate.cashAmount += payNow;
                } else if (paymentMethod === "upi") {
                    paymentUpdate.upiAmount += payNow;
                } else if (paymentMethod === "card") {
                    paymentUpdate.cardAmount += payNow;
                }


                const res = await fetch("/api/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        billId: bill._id,
                        amountCollected: Number(bill.amountCollected || 0) + payNow,
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

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            await refetch();
            setPaymentAmount(0);
            setSearchTerm("");
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Payment failed");
            }
        }
        finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (n: number) =>
        `₹${Math.round(n).toLocaleString("en-IN")}`;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <div className="w-10 h-10 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-lg text-gray-600 font-medium">Loading bills...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* HEADER */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Payment Collection</h1>
                            <p className="text-sm text-gray-600">Oldest invoices first</p>
                        </div>
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* SEARCH */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                    <div className="relative">
                        <Search className="h-4 w-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search customer by name or phone"
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                        />
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-red-900 text-sm">{error}</p>
                            <button
                                onClick={() => setError("")}
                                className="mt-1 text-red-700 hover:text-red-900 text-xs font-medium underline"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}

                {/* NO SEARCH */}
                {customerBills.length === 0 && !searchTerm && (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                        <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Search Customer</h3>
                        <p className="text-sm text-gray-600">Enter name or phone to view pending invoices</p>
                    </div>
                )}

                {/* PAYMENT SECTION */}
                {customerBills.length > 0 && (
                    <div className="space-y-6">
                        {/* CUSTOMER INFO */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <IndianRupee className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-gray-900 text-lg">
                                            {customerBills[0].customerInfo.name}
                                        </h2>
                                        <p className="text-sm text-gray-600">{customerBills[0].customerInfo.phone}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(totalDue)}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                                        {customerBills.length} invoices
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                                    Amount
                                </label>
                                <div className="relative">
                                    <IndianRupee className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        value={paymentAmount || ""}
                                        onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                                        className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold transition-all"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                                    Method
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { t: "cash" as const, i: Banknote, label: "Cash" },
                                        { t: "upi" as const, i: Smartphone, label: "UPI" },
                                        { t: "card" as const, i: CreditCard, label: "Card" },
                                    ].map(({ t, i: Icon, label }) => (
                                        <button
                                            key={t}
                                            onClick={() => setPaymentMethod(t)}
                                            disabled={updating}
                                            className={`p-3 border-2 rounded-lg flex flex-col items-center gap-1 transition-all hover:shadow-sm h-full ${paymentMethod === t
                                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                } ${updating ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-gray-50 border-b px-5 py-3">
                                <h4 className="text-sm font-semibold text-gray-700">Invoice Allocation (Oldest First)</h4>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Invoice</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Due</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Paid</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Balance</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentPreview.map((p) => (
                                            <tr key={p.billId} className="border-t hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono font-semibold">
                                                    #{p.billNumber}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                                    {formatCurrency(p.due)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {p.allocated > 0 ? (
                                                        <span className="text-green-600 font-semibold text-sm">-{formatCurrency(p.allocated)}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                                    {formatCurrency(p.remainingDue)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {p.remainingDue === 0 ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Cleared</span>
                                                    ) : p.allocated > 0 ? (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Partial</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Pending</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* BUTTON */}
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                            <button
                                onClick={handleMakePayment}
                                disabled={updating || paymentAmount <= 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {updating ? (
                                    <>
                                        <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <IndianRupee className="h-4 w-4" />
                                        Record {formatCurrency(paymentAmount)} Payment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* SUCCESS */}
                {showSuccess && (
                    <div className="fixed top-4 right-4 bg-green-600 border border-green-700 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <div>
                                <div className="font-semibold text-sm">Payment Successful</div>
                                <div className="text-xs">{formatCurrency(paymentAmount)} recorded</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
