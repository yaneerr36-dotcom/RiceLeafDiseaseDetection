
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
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

    const all = await db
      .select()
      .from(scans)
      .where(eq(scans.userId, session.user.id))
      .orderBy(desc(scans.createdAt))
      .limit(500);

    const total = all.length;
    const healthy = all.filter((s) => s.isHealthy).length;
    const diseased = total - healthy;

    const avgConf = total
      ? all.reduce((a, s) => a + s.confidence, 0) / total
      : 0;

    const avgHealth = total
      ? all.reduce((a, s) => a + s.leafHealthScore, 0) / total
      : 0;

    const critical = all.filter(
      (s) => s.severity === "Critical" || s.severity === "High",
    ).length;

    const byDisease: Record<string, number> = {};

    all.forEach((s) => {
      byDisease[s.diseaseName] =
        (byDisease[s.diseaseName] || 0) + 1;
    });

    const byDay: Record<string, number> = {};

    all.forEach((s) => {
      const day = new Date(s.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      byDay[day] = (byDay[day] || 0) + 1;
    });

    return NextResponse.json({
      total,
      healthy,
      diseased,
      avgConf,
      avgHealth,
      critical,
      byDisease,
      byDay,
      consultations: [],
      recent: all.slice(0, 8),
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);

    return NextResponse.json(
      {
        total: 0,
        healthy: 0,
        diseased: 0,
        avgConf: 0,
        avgHealth: 0,
        critical: 0,
        byDisease: {},
        byDay: {},
        consultations: [],
        recent: [],
        error: "Failed to load dashboard statistics.",
      },
      { status: 500 },
    );
  }
}
