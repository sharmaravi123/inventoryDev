// src/models/Driver.ts
import {
  Schema,
  model,
  models,
  Document,
  Model,
  Types,
} from "mongoose";

export interface DriverDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<DriverDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const DriverModel: Model<DriverDocument> =
  (models.Driver as Model<DriverDocument>) ||
  model<DriverDocument>("Driver", driverSchema);

export default DriverModel;
