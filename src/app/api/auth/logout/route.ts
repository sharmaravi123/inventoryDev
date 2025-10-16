// Next.js App Router API Route
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Clear cookies or tokens here depending on how you store them
    const response = NextResponse.json({ message: "Logged out successfully" });

    // Example: clear token cookie
    response.cookies.set("token", "", { path: "/", maxAge: 0 });
    response.cookies.set("role", "", { path: "/", maxAge: 0 });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Logout failed", error }, { status: 500 });
  }
}
