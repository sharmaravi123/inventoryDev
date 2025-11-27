import mongoose, {
  Schema,
  InferSchemaType,
  Model,
  Types,
} from "mongoose";

const customerSchema = new Schema(
  {
    name: { type: String, required: true },
    shopName: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    gstNumber: { type: String },
  },
  { timestamps: true }
);

customerSchema.index({ phone: 1 }, { unique: true });
customerSchema.index({ name: 1 });
customerSchema.index({ shopName: 1 });

export type CustomerDocument = InferSchemaType<typeof customerSchema> & {
  _id: Types.ObjectId;
};

const CustomerModel: Model<CustomerDocument> =
  (mongoose.models.Customer as Model<CustomerDocument>) ||
  mongoose.model<CustomerDocument>("Customer", customerSchema);

export default CustomerModel;
