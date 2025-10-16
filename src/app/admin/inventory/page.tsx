import React from "react";
import InventoryOverview from "../components/Inventory/InventoryOverview";
import ProductTable from "../components/Inventory/ProductTable";

export const metadata = {
  title: "Inventory Dashboard",
};

export default function Page() {
  return (
    <main className="min-h-screen p-8 bg-neutral">
      <div className="max-w-6xl mx-auto">
        <InventoryOverview />
        <div className="mt-8">
          <ProductTable />
        </div>
      </div>
    </main>
  );
}
