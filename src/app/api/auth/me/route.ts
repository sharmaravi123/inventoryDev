// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "") as any;
    return NextResponse.json({ user: { id: payload.id, role: payload.role } }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
