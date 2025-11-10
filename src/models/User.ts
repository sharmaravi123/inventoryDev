// ./src/models/User.ts
import mongoose, { Document, Schema, Model } from "mongoose";

/**
 * IUser: Document interface including mongoose timestamps
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  warehouse?: mongoose.Types.ObjectId | null;
  access: {
    level: "all" | "limited";
    permissions: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    access: {
      level: { type: String, enum: ["all", "limited"], default: "limited" },
      permissions: { type: [String], default: [] },
    },
  },
  {
    timestamps: true, // <- this creates createdAt and updatedAt at runtime
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Use existing model if present (Next.js hot reload safe)
const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", userSchema);

export default User;
