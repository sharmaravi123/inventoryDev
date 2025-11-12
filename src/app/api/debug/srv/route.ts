// app/api/debug/srv/route.ts
import { NextResponse } from "next/server";
import dns from "dns/promises";

export async function GET() {
  try {
    const records = await dns.resolveSrv("_mongodb._tcp.cluster0.alsplpa.mongodb.net");
    return NextResponse.json({ ok: true, records });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
