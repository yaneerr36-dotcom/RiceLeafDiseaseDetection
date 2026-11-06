
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const disease = searchParams.get("disease");
    const requestedLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;

    const conditions = disease && disease !== "all"
      ? and(
          eq(scans.userId, session.user.id),
          eq(scans.diseaseId, disease),
        )
      : eq(scans.userId, session.user.id);

    const rows = await db
      .select()
      .from(scans)
      .where(conditions)
      .orderBy(desc(scans.createdAt))
      .limit(limit);

    return NextResponse.json({ scans: rows });
  } catch (error) {
    console.error("GET /api/scans error:", error);

    return NextResponse.json(
      { error: "Failed to load scans." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    const body = await req.json();

    if (
      !body.diseaseId ||
      !body.diseaseName ||
      typeof body.confidence !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid prediction data." },
        { status: 400 },
      );
    }

    const [row] = await db
      .insert(scans)
      .values({
        userId: session.user.id,
        imageName: body.imageName || "leaf.jpg",
        diseaseId: body.diseaseId,
        diseaseName: body.diseaseName,
        confidence: body.confidence,
        severity: body.severity || "Moderate",
        severityScore: body.severityScore ?? 50,
        leafHealthScore: body.leafHealthScore ?? 70,
        affectedArea: body.affectedArea ?? 12,
        location: body.location || "Dhaka, Bangladesh",
        farmerName: body.farmerName || "Guest Farmer",
        fieldId: body.fieldId || "Field A-12",
        notes: body.notes || "",
        isHealthy: !!body.isHealthy,
        topPredictions: body.topPredictions || [],
      })
      .returning();

    return NextResponse.json({ scan: row });
  } catch (error) {
    console.error("POST /api/scans error:", error);

    return NextResponse.json(
      { error: "Failed to save scan." },
      { status: 500 },
    );
  }
}
