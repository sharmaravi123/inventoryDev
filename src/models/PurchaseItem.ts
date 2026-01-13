// src/models/PurchaseItem.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IPurchaseItem extends Document {
  purchaseOrderId: string;
  productId: string;
  warehouseId: string;

  boxes: number;
  looseItems: number;

  purchasePrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  purchaseOrderId: { type: String, index: true },
  productId: String,
  warehouseId: String,

  boxes: Number,
  looseItems: Number,

  purchasePrice: Number,
  taxPercent: Number,
  taxAmount: Number,
  totalAmount: Number,
});

export default mongoose.models.PurchaseItem ||
  mongoose.model("PurchaseItem", PurchaseItemSchema);
