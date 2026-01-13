import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Dealer from "@/models/Dealer";

export async function GET() {
  try {
    await dbConnect();
    const dealers = await Dealer.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ dealers }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dealers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
    }

    const dealer = await Dealer.create({
      name: body.name,
      phone: body.phone,
      address: body.address,
      gstin: body.gstin,
    });

    return NextResponse.json(dealer, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Dealer already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create dealer" }, { status: 500 });
  }
}
