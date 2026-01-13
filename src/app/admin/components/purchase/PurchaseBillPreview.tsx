"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

/* ================== CONSTANTS ================== */

const COMPANY_NAME = "JMK TRADERS";
const COMPANY_ADDRESS_LINE_1 = `
NO 240, SANUEEY NAGAR COLONY, SANJEEV NACAR, NEVARI BADVAI,
Acharpua Industrial Area.
`;
const COMPANY_ADDRESS_LINE_2 = "Bhopal, Madhya Pradesh, 462018";
const COMPANY_PHONE = "+91-9876543210";

const COMPANY_BANK_NAME = "HDFC Bank, HAMIDIA ROAD";
const COMPANY_ACCOUNT_NAME = "Aarif Singh";
const COMPANY_IFSC = "HDFC0000400";
const COMPANY_ACCOUNT_NO = "5020004980XXX";

/* ================== TYPES ================== */

type PurchaseItem = {
    productName: string;
    hsn?: string;
    boxes: number;
    looseItems: number;
    perBoxItem: number;
    purchasePrice: number;
    taxPercent: number;
};

type PurchaseBill = {
    invoiceNumber: string;
    purchaseDate: string;

    dealer: {
        name: string;
        phone?: string;
        address?: string;
        gstin?: string;
    };

    warehouse?: {
        name: string;
    };

    items: PurchaseItem[];

    totalBeforeTax: number;
    totalTax: number;
    grandTotal: number;
};

/* ================== UTILS ================== */

function numberToINRWords(amount: number): string {
    const rupees = Math.round(amount);
    if (!Number.isFinite(rupees) || rupees <= 0) return "Zero rupees only";

    const a = [
        "",
        "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
        "sixteen", "seventeen", "eighteen", "nineteen",
    ];
    const b = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

    const two = (n: number) =>
        n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");

    const three = (n: number) =>
        Math.floor(n / 100)
            ? a[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + two(n % 100) : "")
            : two(n);

    let num = rupees;
    let str = "";

    if (num >= 10000000) { str += three(Math.floor(num / 10000000)) + " crore "; num %= 10000000; }
    if (num >= 100000) { str += three(Math.floor(num / 100000)) + " lakh "; num %= 100000; }
    if (num >= 1000) { str += three(Math.floor(num / 1000)) + " thousand "; num %= 1000; }
    if (num > 0) str += three(num);

    return str.trim().replace(/^./, c => c.toUpperCase()) + " rupees only";
}

/* ================== COMPONENT ================== */

export default function PurchaseBillPreview({
    bill,
    onClose,
}: {
    bill?: PurchaseBill;
    onClose: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [onClose]);

    if (!bill) return null;

    const cgst = bill.totalTax / 2;
    const sgst = bill.totalTax / 2;

    const handlePrint = () => window.print();

    return (
        <>
            {/* PRINT STYLE */}
            <style jsx global>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          .print-hide { display: none !important; }
        }
      `}</style>

            <div className="mx-auto mt-6 max-w-5xl bg-white p-4 text-xs">
                {/* ACTION BAR */}
                <div className="mb-2 flex justify-between print-hide">
                    <b>Purchase Invoice Preview</b>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="bg-blue-600 px-4 py-1.5 text-white rounded">
                            🖨 Print
                        </button>
                        <button onClick={() => router.back()} className="bg-red-600 px-4 py-1.5 text-white rounded">
                            ✖ Close
                        </button>
                    </div>
                </div>

                {/* INVOICE */}
                <div className="border border-black p-3">
                    {/* HEADER */}
                    <div className="border-b border-black pb-2 flex justify-between">
                        <div>
                            <div className="flex gap-2 font-bold uppercase">
                                <span>Tax Invoice</span>
                                <span className="border px-1">ORIGINAL FOR RECIPIENT</span>
                            </div>
                            <div className="text-lg font-bold">{COMPANY_NAME}</div>
                            <div style={{ whiteSpace: "pre-line" }}>{COMPANY_ADDRESS_LINE_1}</div>
                            <div>{COMPANY_ADDRESS_LINE_2}</div>
                            <div>Mobile: {COMPANY_PHONE}</div>
                        </div>

                        <div className="text-right">
                            <div>Invoice No: {bill.invoiceNumber}</div>
                            <div>Date: {new Date(bill.purchaseDate).toLocaleDateString("en-IN")}</div>
                        </div>
                    </div>

                    {/* DEALER */}
                    <div className="mt-2 grid grid-cols-2 border border-black">
                        <div className="border-r border-black p-2">
                            <b>BILL FROM (DEALER)</b>
                            <div>{bill.dealer.name}</div>
                            <div>Address : {bill.dealer.address}</div>
                            <div>Mobile: {bill.dealer.phone}</div>
                            {bill.dealer.gstin && <div>GSTIN: {bill.dealer.gstin}</div>}
                        </div>
                        <div className="p-2">
                            <b>WAREHOUSE</b>
                            <div>{bill.warehouse?.name}</div>
                        </div>
                    </div>

                    {/* ITEMS */}
                    <table className="mt-2 w-full border border-black border-collapse">
                        <thead>
                            <tr>
                                {["S.N.", "ITEMS", "HSN", "QTY", "RATE", "TAX %", "AMOUNT"].map(h => (
                                    <th key={h} className="border border-black p-1 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bill.items.map((it, i) => {
                                const totalPieces = it.boxes * it.perBoxItem + it.looseItems;
                                const lineAmount = totalPieces * it.purchasePrice;

                                return (
                                    <tr key={i}>
                                        <td className="border p-1">{i + 1}</td>
                                        <td className="border p-1">{it.productName}</td>
                                        <td className="border p-1">{it.hsn || "-"}</td>
                                        <td className="border p-1">
                                            {it.boxes > 0 && `${it.boxes} box `}
                                            {it.looseItems > 0 && `${it.looseItems} loose`}
                                            <div className="text-[10px]">({totalPieces} pcs)</div>
                                        </td>
                                        <td className="border p-1">{it.purchasePrice.toFixed(2)}</td>
                                        <td className="border p-1">{it.taxPercent}%</td>
                                        <td className="border p-1">{lineAmount.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* TOTALS */}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="border p-2">
                            <b>Total Amount (in words)</b>
                            <div>{numberToINRWords(bill.grandTotal)}</div>
                        </div>
                        <div className="border p-2">
                            <div className="flex justify-between"><span>Sub Total</span><span>{bill.totalBeforeTax.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>CGST</span><span>{cgst.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>SGST</span><span>{sgst.toFixed(2)}</span></div>
                            <div className="flex justify-between border-t border-black font-bold pt-1">
                                <span>Grand Total</span>
                                <span>{bill.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* BANK */}
                    <div className="mt-2 grid grid-cols-2 border border-black">
                        <div className="border-r border-black p-2">
                            <b>Bank Details</b>
                            <div>Name: {COMPANY_ACCOUNT_NAME}</div>
                            <div>A/C No: {COMPANY_ACCOUNT_NO}</div>
                            <div>IFSC: {COMPANY_IFSC}</div>
                            <div>Bank: {COMPANY_BANK_NAME}</div>
                        </div>
                        <div className="p-2">
                            <b>Terms & Conditions</b>
                            <div>1. Goods once purchased will not be returned.</div>
                            <div>2. Subject to local jurisdiction.</div>
                        </div>
                    </div>

                    <div className="mt-2 text-center">
                        This is a computer generated purchase invoice.
                    </div>
                </div>
            </div>
        </>
    );
}
