import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { consultations } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try { const rows = await db.select().from(consultations).orderBy(desc(consultations.createdAt)).limit(50); return NextResponse.json({ consultations: rows }); }
  catch (e: any) { return NextResponse.json({ consultations: [], error: e.message }); }
}
export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    const [row] = await db.insert(consultations).values({ scanId: b.scanId || null, farmerName: b.farmerName, phone: b.phone || "", location: b.location, diseaseName: b.diseaseName || "", question: b.question, urgency: b.urgency || "Medium" }).returning();
    return NextResponse.json({ consultation: row });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
