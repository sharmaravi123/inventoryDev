// src/app/admin/products/page.tsx
import React from "react";
import { cookies } from "next/headers";
import { ensureHasAccess, getUserFromTokenOrDb } from "@/lib/access";
import ProductTable from "@/app/admin/components/product/ProductTable";

export default async function ProductsPage() {
  try {
    const token = (await cookies()).get("token")?.value ?? null;

    // server-side permission check (will throw/redirect based on your helper)
    await ensureHasAccess(token, { perm: "product" });

    const user = await getUserFromTokenOrDb(token ?? undefined);
    if (!user) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold">Not authenticated</h1>
        </div>
      );
    }

    // access ok -> render client UI (client will fetch data)
    return <ProductTable   />;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Products page server error:", err);
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Access denied / Error</h1>
        <p className="text-sm text-gray-600">You do not have permission or there was a server error.</p>
      </div>
    );
  }
}
