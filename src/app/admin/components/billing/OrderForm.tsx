// src/app/admin/components/billing/OrderForm.tsx
"use client";

import React from "react";
import { Customer } from "@/store/billingApi";
import { Totals } from "./BillingAdminPage";
import { PaymentMode, CreateBillPaymentInput } from "@/store/billingApi";

type CustomerFormState = {
  name: string;
  shopName: string;
  phone: string;
  address: string;
  gstNumber: string;
};

type BillingProductOption = {
  id: string;
  productId: string;
  warehouseId: string;
  productName: string;
  warehouseName: string;
  sellingPrice: number;
  taxPercent: number;
  itemsPerBox: number;
  boxesAvailable: number;
  looseAvailable: number;
};

type BillFormItemState = {
  id: string;
  productSearch: string;
  selectedProduct?: BillingProductOption;
  quantityBoxes: number;
  quantityLoose: number;
};

type OrderFormMode = "create" | "edit";

type OrderFormProps = {
  mode: OrderFormMode;
  companyGstNumber: string;
  customer: CustomerFormState;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerFormState>>;
  items: BillFormItemState[];
  setItems: React.Dispatch<React.SetStateAction<BillFormItemState[]>>;
  payment: CreateBillPaymentInput;
  setPayment: React.Dispatch<React.SetStateAction<CreateBillPaymentInput>>;
  customerSearch: string;
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
  selectedCustomerId: string;
  setSelectedCustomerId: React.Dispatch<React.SetStateAction<string>>;
  customerSearchResult?: { customers: Customer[] };
  billingProducts: BillingProductOption[];
  inventoryLoading: boolean;
  totals: Totals;
  onCustomerSelect: (id: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  lastInvoiceNumber?: string;
  isSuccess: boolean;
};

export default function OrderForm({
  mode,
  companyGstNumber,
  customer,
  setCustomer,
  items,
  setItems,
  payment,
  setPayment,
  customerSearch,
  setCustomerSearch,
  selectedCustomerId,
  customerSearchResult,
  billingProducts,
  inventoryLoading,
  totals,
  onCustomerSelect,
  onSubmit,
  isSubmitting,
  lastInvoiceNumber,
  isSuccess,
}: OrderFormProps) {
  const handleItemProductSearch = (itemId: string, value: string): void => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, productSearch: value }
          : item
      )
    );
  };

  const handleItemSelectProduct = (
    itemId: string,
    optionId: string
  ): void => {
    const option = billingProducts.find((bp) => bp.id === optionId);
    if (!option) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              selectedProduct: option,
              productSearch: option.productName,
              quantityBoxes: 0,
              quantityLoose: 0,
            }
          : item
      )
    );
  };

  const handleItemQuantityChange = (
    itemId: string,
    field: "quantityBoxes" | "quantityLoose",
    value: number
  ): void => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const product = item.selectedProduct;
        if (!product) return item;

        const safeValue = Number.isNaN(value) ? 0 : value;

        const nextItem: BillFormItemState = {
          ...item,
          [field]: safeValue,
        };

        const requestedLoose =
          nextItem.quantityBoxes * product.itemsPerBox +
          nextItem.quantityLoose;

        const availableLoose =
          product.boxesAvailable * product.itemsPerBox +
          product.looseAvailable;

        if (requestedLoose > availableLoose) {
          return item;
        }

        return nextItem;
      })
    );
  };

  const handleAddItemRow = (): void => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 11),
        productSearch: "",
        selectedProduct: undefined,
        quantityBoxes: 0,
        quantityLoose: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (itemId: string): void => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== itemId)
    );
  };

  const handlePaymentModeChange = (modeVal: PaymentMode): void => {
    setPayment((prev) => ({
      ...prev,
      mode: modeVal,
    }));
  };

  const headingText =
    mode === "create" ? "Create New Order" : "Edit Order";

  return (
    <div className="space-y-6">
      <h2 className="mb-2 text-lg font-semibold text-[color:var(--color-sidebar)]">
        {headingText}
      </h2>

      {/* Customer + Bill info */}
      <section className="grid gap-4 rounded-xl bg-[color:var(--color-neutral)] p-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-base font-semibold text-[color:var(--color-sidebar)]">
            Customer Details
          </h3>

          <label className="mb-2 block text-sm font-medium">
            Search Existing Customer
          </label>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) =>
              setCustomerSearch(e.target.value)
            }
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Name / shop / phone"
          />
          {customerSearchResult &&
            customerSearchResult.customers.length > 0 && (
              <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-[color:var(--color-white)] text-sm">
                {customerSearchResult.customers.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-[color:var(--color-secondary)]/20 ${
                      selectedCustomerId === c._id
                        ? "bg-[color:var(--color-secondary)]/30"
                        : ""
                    }`}
                    onClick={() => onCustomerSelect(c._id)}
                  >
                    <span className="font-semibold">
                      {c.name}
                    </span>
                    {c.shopName && (
                      <span className="text-xs text-slate-600">
                        ({c.shopName})
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-600">
                      {c.phone}
                    </span>
                  </button>
                ))}
              </div>
            )}

          <div className="space-y-2 text-sm">
            <div>
              <label className="block font-medium">
                Customer Name
              </label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium">
                Shop / Business Name{" "}
                <span className="text-xs text-slate-500">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={customer.shopName}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    shopName: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium">
                Phone
              </label>
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium">
                Address
              </label>
              <textarea
                value={customer.address}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block font-medium">
                Customer GST Number
              </label>
              <input
                type="text"
                value={customer.gstNumber}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    gstNumber: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="mb-2 text-base font-semibold text-[color:var(--color-sidebar)]">
            Bill Information
          </h3>
          <div className="rounded-lg border border-slate-200 bg-[color:var(--color-white)] p-3">
            <p className="text-xs text-slate-600">
              Company GST Number
            </p>
            <p className="text-sm font-semibold">
              {companyGstNumber}
            </p>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-3">
            <p className="text-xs text-slate-600">
              Invoice number and bill date are generated on the server.
            </p>
            {mode === "edit" && (
              <p className="mt-1 text-[11px] text-slate-500">
                Editing this order will re-calculate totals and update stock.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="space-y-3 rounded-xl bg-[color:var(--color-white)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[color:var(--color-sidebar)]">
            Products (Admin – all warehouses)
          </h3>
          <button
            type="button"
            onClick={handleAddItemRow}
            className="rounded-lg bg-[color:var(--color-primary)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-white)]"
          >
            + Add Item
          </button>
        </div>

        {inventoryLoading && (
          <p className="text-sm text-slate-500">
            Loading inventory...
          </p>
        )}

        <div className="space-y-3">
          {items.map((item, index) => {
            const product = item.selectedProduct;

            const filteredProducts =
              item.productSearch.trim().length === 0
                ? billingProducts.slice(0, 25)
                : billingProducts.filter((bp) =>
                    bp.productName
                      .toLowerCase()
                      .includes(
                        item.productSearch.toLowerCase()
                      )
                  );

            const maxLoose =
              product
                ? product.boxesAvailable *
                    product.itemsPerBox +
                  product.looseAvailable
                : 0;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">
                    Item {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveItemRow(item.id)
                    }
                    disabled={items.length === 1}
                    className="text-xs font-semibold text-[color:var(--color-error)] disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <label className="block text-xs font-medium">
                        Product search
                      </label>
                      <input
                        type="text"
                        value={item.productSearch}
                        onChange={(e) =>
                          handleItemProductSearch(
                            item.id,
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Search product by name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium">
                        Select product
                      </label>
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        value={product?.id ?? ""}
                        onChange={(e) =>
                          handleItemSelectProduct(
                            item.id,
                            e.target.value
                          )
                        }
                      >
                        <option value="">
                          {filteredProducts.length === 0
                            ? "No products"
                            : "Select product"}
                        </option>
                        {filteredProducts.map((bp) => (
                          <option
                            key={bp.id}
                            value={bp.id}
                          >
                            {bp.productName} (WH:{" "}
                            {bp.warehouseName}) – ₹
                            {bp.sellingPrice.toFixed(2)} | Tax{" "}
                            {bp.taxPercent.toFixed(2)}%
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block font-medium">
                        Boxes
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={item.quantityBoxes}
                        onChange={(e) =>
                          handleItemQuantityChange(
                            item.id,
                            "quantityBoxes",
                            Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-medium">
                        Loose
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={item.quantityLoose}
                        onChange={(e) =>
                          handleItemQuantityChange(
                            item.id,
                            "quantityLoose",
                            Number(e.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    {product && (
                      <p className="text-[10px] text-slate-500">
                        Warehouse: {product.warehouseName} | Max items:{" "}
                        {maxLoose} ({product.boxesAvailable} box,{" "}
                        {product.looseAvailable} loose) |{" "}
                        {product.itemsPerBox} / box
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment + summary */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl bg-[color:var(--color-white)] p-4 shadow-sm">
          <h3 className="text-base font-semibold text-[color:var(--color-sidebar)]">
            Payment
          </h3>
          <div className="mb-2 flex gap-2 text-sm">
            {(["CASH", "UPI", "CARD", "SPLIT"] as PaymentMode[]).map(
              (modeVal) => (
                <button
                  key={modeVal}
                  type="button"
                  onClick={() =>
                    handlePaymentModeChange(modeVal)
                  }
                  className={`rounded-full border px-3 py-1 ${
                    payment.mode === modeVal
                      ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]"
                      : "border-slate-300 text-slate-700"
                  } text-xs font-medium`}
                >
                  {modeVal}
                </button>
              )
            )}
          </div>

          <p className="mb-2 text-xs text-slate-500">
            Grand total: ₹{totals.grandTotal.toFixed(2)} (GST included)
          </p>

          <div className="mt-1 space-y-2 text-sm">
            {(payment.mode === "CASH" || payment.mode === "SPLIT") && (
              <div>
                <label className="block text-xs font-medium">
                  Cash Amount
                </label>
                <input
                  type="number"
                  min={0}
                  value={payment.cashAmount}
                  onChange={(e) =>
                    setPayment((prev) => ({
                      ...prev,
                      cashAmount: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            )}

            {(payment.mode === "UPI" || payment.mode === "SPLIT") && (
              <div>
                <label className="block text-xs font-medium">
                  UPI Amount
                </label>
                <input
                  type="number"
                  min={0}
                  value={payment.upiAmount}
                  onChange={(e) =>
                    setPayment((prev) => ({
                      ...prev,
                      upiAmount: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            )}

            {(payment.mode === "CARD" || payment.mode === "SPLIT") && (
              <div>
                <label className="block text-xs font-medium">
                  Card Amount
                </label>
                <input
                  type="number"
                  min={0}
                  value={payment.cardAmount}
                  onChange={(e) =>
                    setPayment((prev) => ({
                      ...prev,
                      cardAmount: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            )}

            <p className="mt-1 text-[11px] text-slate-500">
              • Total collected amount grand total se zyada nahi hona chahiye.
              <br />
              • Sab zero rakho to bill pending rahega (delivery pe payment le sakte ho).
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-[color:var(--color-neutral)] p-4">
          <h3 className="text-base font-semibold text-[color:var(--color-sidebar)]">
            Summary
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total Items</span>
              <span className="font-medium">
                {totals.totalItemsCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sub Total</span>
              <span className="font-medium">
                ₹{totals.totalBeforeTax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax</span>
              <span className="font-medium">
                ₹{totals.totalTax.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-300 pt-2 text-base font-semibold text-[color:var(--color-primary)]">
              <span>Grand Total</span>
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="mt-4 w-full rounded-lg bg-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-[color:var(--color-white)] disabled:opacity-60"
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating Bill..."
                : "Updating Bill..."
              : mode === "create"
              ? "Create Bill"
              : "Update Bill"}
          </button>

          {isSuccess && lastInvoiceNumber && mode === "create" && (
            <p className="mt-2 text-xs text-[color:var(--color-success)]">
              Bill created:{" "}
              <span className="font-semibold">
                {lastInvoiceNumber}
              </span>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
