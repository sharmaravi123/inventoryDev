import mongoose, { Schema, Document } from "mongoose";

export interface IWarehouse extends Document {
  name: string;
  address?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>({
  name: { type: String, required: true, unique: true },
  address: { type: String },
  meta: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Warehouse ||
  mongoose.model<IWarehouse>("Warehouse", WarehouseSchema);
