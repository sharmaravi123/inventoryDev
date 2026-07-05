/**
 * Investigate unnamed/orphan inventory rows (read-only).
 * Run: npx tsx scripts/diagnose-unnamed-products.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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

const TARGET_IDS = [
  "69cabe495003e5effdf2a76c",
  "69cabeb45003e5effdf2a770",
  "69cabf135003e5effdf2a774",
  "69cac0c45003e5effdf2a788",
  "6a1c614db5d28720d05a7c32",
];

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
  const warehouses = db.collection("warehouses");

  const whList = await warehouses.find({}).project({ name: 1 }).toArray();
  const whMap = Object.fromEntries(
    whList.map((w) => [String(w._id), w.name ?? "?"])
  );

  console.log("=== TARGET IDs (as stock._id OR productId) ===\n");

  for (const id of TARGET_IDS) {
    let stockById = null;
    try {
      stockById = await stocks.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
    } catch {
      /* invalid id */
    }

    const stockByProductId = await stocks.findOne({ productId: id });

    let product = null;
    try {
      product = await products.findOne({
        _id: new mongoose.Types.ObjectId(id),
      });
    } catch {
      /* invalid id */
    }

    const billLines = await bills
      .find({ "items.product": new mongoose.Types.ObjectId(id) })
      .project({ invoiceNumber: 1, billDate: 1, "items.$": 1, createdAt: 1 })
      .limit(5)
      .toArray();

    const purchaseLines = await purchases
      .find({ "items.productId": id })
      .project({ createdAt: 1, items: 1 })
      .limit(3)
      .toArray();

    console.log(`--- ${id} ---`);
    console.log(
      JSON.stringify(
        {
          asStockId: stockById
            ? {
                stockId: String(stockById._id),
                productId: stockById.productId,
                warehouse: whMap[String(stockById.warehouseId)] ?? stockById.warehouseId,
                boxes: stockById.boxes,
                looseItems: stockById.looseItems,
                totalItems: stockById.totalItems,
                createdAt: stockById.createdAt,
                updatedAt: stockById.updatedAt,
              }
            : null,
          asProductId_stock: stockByProductId
            ? {
                stockId: String(stockByProductId._id),
                productId: stockByProductId.productId,
                warehouse: whMap[String(stockByProductId.warehouseId)] ?? stockByProductId.warehouseId,
                totalItems: stockByProductId.totalItems,
                createdAt: stockByProductId.createdAt,
              }
            : null,
          productDocument: product
            ? {
                name: product.name,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
              }
            : null,
          billsUsingProduct: billLines.map((b) => ({
            invoice: b.invoiceNumber,
            billDate: b.billDate,
            item: (b.items as unknown[])?.[0],
          })),
          purchasesUsingProduct: purchaseLines.map((p) => ({
            createdAt: p.createdAt,
            items: (p.items as unknown[])?.filter(
              (it) =>
                String((it as { productId?: string }).productId) === id
            ),
          })),
        },
        null,
        2
      )
    );
    console.log("");
  }

  console.log("=== ALL ORPHAN STOCKS (productId has no Product doc) ===\n");

  const allStocks = await stocks.find({}).toArray();
  const orphans: Record<string, unknown>[] = [];

  for (const s of allStocks) {
    const pid = String(s.productId ?? "").trim();
    if (!pid) continue;

    let prod = null;
    try {
      prod = await products.findOne({ _id: new mongoose.Types.ObjectId(pid) });
    } catch {
      /* bad productId format */
    }

    if (!prod) {
      const billCount = await bills.countDocuments({
        "items.product": new mongoose.Types.ObjectId(pid),
      });
      orphans.push({
        stockId: String(s._id),
        productId: pid,
        warehouse: whMap[String(s.warehouseId)] ?? s.warehouseId,
        totalItems: s.totalItems,
        createdAt: s.createdAt,
        billsLinked: billCount,
      });
    }
  }

  console.log(`Total orphan stock rows: ${orphans.length}`);
  console.log(JSON.stringify(orphans, null, 2));

  console.log("\n=== SAME NAMES IN PRODUCTS COLLECTION NOW? ===\n");
  const billNames = [
    "School Masti MRP 5",
    "Fingar masala MRP 5",
    "Fingar Chilli Pasta MRP 5",
    "Noodals Chilli",
    "potato bite 210",
  ];
  for (const name of billNames) {
    const found = await products
      .find({ name })
      .project({ name: 1, createdAt: 1 })
      .toArray();
    console.log(
      `${name}:`,
      found.length
        ? found.map((x) => ({ id: String(x._id), createdAt: x.createdAt }))
        : "NOT in products collection"
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
