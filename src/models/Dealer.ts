import mongoose, { Schema, Document, Model, models, model } from "mongoose";

export interface IDealer extends Document {
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DealerSchema = new Schema<IDealer>(
  {
    name: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
  },
  { timestamps: true }
);

const Dealer: Model<IDealer> =
  mongoose.models.Dealer ||
  mongoose.model<IDealer>("Dealer", DealerSchema);

export default models.Dealer || model("Dealer", Schema);
