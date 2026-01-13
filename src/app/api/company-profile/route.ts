import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyProfile from "@/models/CompanyProfile";

/* ================= GET ================= */
export async function GET() {
  try {
    await dbConnect();
    const profile = await CompanyProfile.findOne().lean();
    return NextResponse.json(profile ?? null, { status: 200 });
  } catch (error) {
    console.error("COMPANY PROFILE GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}

/* ================= PUT (CREATE / UPDATE) ================= */
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const updated = await CompanyProfile.findOneAndUpdate(
      {},
      {
        name: body.name,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2,
        phone: body.phone,
        gstin: body.gstin,
        bankName: body.bankName,
        accountHolder: body.accountHolder,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        branch: body.branch,
      },
      {
        new: true,
        upsert: true,
        runValidators: true, // 🔥 IMPORTANT
      }
    );

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("COMPANY PROFILE PUT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update company profile" },
      { status: 500 }
    );
  }
}
