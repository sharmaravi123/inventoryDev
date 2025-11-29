// lib/authorize.ts
import { NextRequest } from "next/server";
import { verifyToken, AuthTokenPayload } from "@/lib/jwt";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

export async function verifyAndGetUser(req: NextRequest): Promise<IUser> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }

  const token = authHeader.split(" ")[1];

  let decoded: AuthTokenPayload;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new Error("Token verification failed");
  }

  if (
    !decoded.id ||
    typeof decoded.id !== "string" ||
    !mongoose.Types.ObjectId.isValid(decoded.id)
  ) {
    throw new Error("Invalid user ID in token");
  }

  await dbConnect();

  const user = await User.findById(decoded.id);
  if (!user) throw new Error("User not found");

  return user;
}

export function ensureAdmin(user: IUser): void {
  if (user.role !== "admin") {
    throw new Error("Access denied — admin only");
  }
}
