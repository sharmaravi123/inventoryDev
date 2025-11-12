// src/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  warehouses: mongoose.Types.ObjectId[];
  access: { level: "all" | "limited"; permissions: string[] };
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    warehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }],
    access: {
      level: { type: String, enum: ["all", "limited"], default: "limited" },
      permissions: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

// DEV: ensure model is re-registered (prevents stale models during hot reload)
if (process.env.NODE_ENV === "development") {
  // delete stale model if present
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete mongoose.models.User;
  } catch (e) {
    // ignore
  }
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
