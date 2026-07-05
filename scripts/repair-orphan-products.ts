/**
 * Restore deleted products that still have stock + bill references.
 * Run: npx tsx scripts/repair-orphan-products.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";

function loadEnvLocal(): void {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

type BillLine = {
  productName?: string;
  sellingPrice?: number;
  taxPercent?: number;
  itemsPerBox?: number;
  hsnCode?: number | string | null;
};

async function main() {
  if (!process.env.MONGODB_URI?.trim()) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db!;

  const stocks = db.collection("stocks");
  const products = db.collection("products");
  const bills = db.collection("bills");
  const purchases = db.collection("purchases");
  const categories = db.collection("categories");

  const defaultCategory = await categories.findOne({});
  if (!defaultCategory) {
    console.error("No category found — create a category first.");
    process.exit(1);
  }

  const sampleProduct = await products.findOne({});
  const defaultHsn =
    sampleProduct?.hsnCode != null
      ? String(sampleProduct.hsnCode)
      : "21069099";

  const allStocks = await stocks.find({}).toArray();
  const orphans: typeof allStocks = [];

  for (const s of allStocks) {
    const pid = String(s.productId ?? "").trim();
    if (!pid) continue;
    let exists = false;
    try {
      exists = !!(await products.findOne({
        _id: new mongoose.Types.ObjectId(pid),
      }));
    } catch {
      /* bad id */
    }
    if (!exists) orphans.push(s);
  }

  if (orphans.length === 0) {
    console.log("No orphan stocks — nothing to repair.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Repairing ${orphans.length} orphan product(s)…\n`);

  for (const stock of orphans) {
    const productId = String(stock.productId);
    const oid = new mongoose.Types.ObjectId(productId);

    const billLines = (await bills
      .aggregate([
        { $unwind: "$items" },
        { $match: { "items.product": oid } },
        { $sort: { billDate: -1, createdAt: -1 } },
        { $limit: 1 },
        { $replaceRoot: { newRoot: "$items" } },
      ])
      .toArray()) as BillLine[];

    const line = billLines[0];
    if (!line?.productName) {
      console.warn(`Skip ${productId}: no bill line found`);
      continue;
    }

    const purchaseLine = await purchases
      .aggregate([
        { $unwind: "$items" },
        { $match: { "items.productId": productId } },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        { $replaceRoot: { newRoot: "$items" } },
      ])
      .toArray();

    const purchasePrice =
      purchaseLine[0]?.purchasePrice != null
        ? Number(purchaseLine[0].purchasePrice)
        : Number(line.sellingPrice ?? 0) * 0.85;

    const sellingPrice = Number(line.sellingPrice ?? 0);
    const taxPercent = Number(line.taxPercent ?? 0);
    const perBoxItem = Math.max(1, Number(line.itemsPerBox ?? 1));
    const hsnCode =
      line.hsnCode != null && String(line.hsnCode).trim() !== ""
        ? String(line.hsnCode)
        : defaultHsn;

    const sku = `SKU-${randomBytes(4).toString("hex").toUpperCase()}`;

    const doc = {
      _id: oid,
      name: String(line.productName).trim(),
      sku,
      categoryId: defaultCategory._id,
      purchasePrice: Math.round(purchasePrice * 100) / 100,
      sellingPrice,
      taxPercent,
      perBoxItem,
      hsnCode,
      description: "Restored from bill history (product was deleted)",
      createdByAdminId: null,
      createdByWarehouseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await products.insertOne(doc);

    console.log(
      JSON.stringify(
        {
          restored: productId,
          name: doc.name,
          sellingPrice: doc.sellingPrice,
          perBoxItem: doc.perBoxItem,
          stockTotalItems: stock.totalItems,
        },
        null,
        2
      )
    );
  }

  console.log("\nDone.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
