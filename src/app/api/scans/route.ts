import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const disease = searchParams.get("disease");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    let rows;
    if (disease && disease !== "all") {
      rows = await db.select().from(scans).where(eq(scans.diseaseId, disease)).orderBy(desc(scans.createdAt)).limit(limit);
    } else {
      rows = await db.select().from(scans).orderBy(desc(scans.createdAt)).limit(limit);
    }
    return NextResponse.json({ scans: rows });
  } catch (e: any) {
    return NextResponse.json({ scans: [], error: e.message }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.insert(scans).values({
      imageName: body.imageName || "leaf.jpg",
      diseaseId: body.diseaseId,
      diseaseName: body.diseaseName,
      confidence: body.confidence,
      severity: body.severity,
      severityScore: body.severityScore,
      leafHealthScore: body.leafHealthScore,
      affectedArea: body.affectedArea,
      location: body.location || "Dhaka, Bangladesh",
      farmerName: body.farmerName || "Guest Farmer",
      fieldId: body.fieldId || "Field A-12",
      notes: body.notes || "",
      isHealthy: !!body.isHealthy,
      topPredictions: body.topPredictions || [],
    }).returning();
    return NextResponse.json({ scan: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
