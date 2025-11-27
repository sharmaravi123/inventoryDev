import mongoose, {
  Schema,
  InferSchemaType,
  Model,
  Types,
} from "mongoose";

const invoiceCounterSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export type InvoiceCounterDocument =
  InferSchemaType<typeof invoiceCounterSchema> & {
    _id: Types.ObjectId;
  };

const InvoiceCounterModel: Model<InvoiceCounterDocument> =
  (mongoose.models.InvoiceCounter as Model<InvoiceCounterDocument>) ||
  mongoose.model<InvoiceCounterDocument>(
    "InvoiceCounter",
    invoiceCounterSchema
  );

export default InvoiceCounterModel;

export async function getNextInvoiceNumber(): Promise<string> {
  const counter = await InvoiceCounterModel.findOneAndUpdate(
    { name: "default" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).exec();

  if (!counter) {
    throw new Error("Failed to generate invoice number");
  }

  const year = new Date().getFullYear();
  const padded = String(counter.seq).padStart(6, "0");

  return `INV-${year}-${padded}`;
}
