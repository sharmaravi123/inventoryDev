// app/api/admin/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/jwt";

type Body = { email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // connect to DB (errors here will show the connection error code)
    await dbConnect();

    const admin = await User.findOne({ email, role: "admin" }).select("+password");
    if (!admin) {
      // do not leak which piece failed
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 'admin' is a Mongoose document — we type narrow safely:
    const adminDoc = admin as unknown as {
      _id: { toString(): string };
      name?: string;
      email?: string;
      password: string;
    };

    const valid = await bcrypt.compare(password, adminDoc.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // sign token with role
    const token = signToken({ id: adminDoc._id.toString(), role: "admin" });

    const res = NextResponse.json({
      success: true,
      admin: { id: adminDoc._id.toString(), name: adminDoc.name ?? null,token, email: adminDoc.email ?? null, role: "admin" },
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax", // 'lax' helps local/dev navigation; use 'strict' or adjust in prod if needed
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    // Surface DB errors and other failures for faster debugging
    const e = err as Error & { code?: string | number };
    // eslint-disable-next-line no-console
    console.error("Admin login error:", e.code ?? "NO_CODE", e.message);
    // If the error looks like DNS/SRV failure, include a helpful message for logs/client
   if (
  (typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string" &&
    ((e as { message: string }).message.includes("querySrv") ||
      (e as { message: string }).message.includes("ECONNREFUSED")))
) {
  return NextResponse.json(
    { error: "Database DNS/SRV lookup failed on server" },
    { status: 500 }
  );
}

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
