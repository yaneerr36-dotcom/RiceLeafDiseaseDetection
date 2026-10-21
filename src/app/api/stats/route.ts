import { NextResponse } from "next/server";
import { db } from "@/db";
import { scans, consultations } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db.select().from(scans).orderBy(desc(scans.createdAt)).limit(500);
    const total = all.length;
    const healthy = all.filter(s => s.isHealthy).length;
    const diseased = total - healthy;
    const avgConf = total ? all.reduce((a, s) => a + s.confidence, 0) / total : 0;
    const avgHealth = total ? all.reduce((a, s) => a + s.leafHealthScore, 0) / total : 0;
    const critical = all.filter(s => s.severity === "Critical" || s.severity === "High").length;
    const byDisease: Record<string, number> = {};
    all.forEach(s => { byDisease[s.diseaseName] = (byDisease[s.diseaseName] || 0) + 1; });
    const byDay: Record<string, number> = {};
    all.forEach(s => { const d = new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }); byDay[d] = (byDay[d] || 0) + 1; });
    const cons = await db.select().from(consultations).orderBy(desc(consultations.createdAt)).limit(20).catch(() => []);
    return NextResponse.json({ total, healthy, diseased, avgConf, avgHealth, critical, byDisease, byDay, consultations: cons, recent: all.slice(0, 8) });
  } catch (e: any) {
    return NextResponse.json({ total: 0, healthy: 0, diseased: 0, avgConf: 0, avgHealth: 0, critical: 0, byDisease: {}, byDay: {}, consultations: [], recent: [], error: e.message });
  }
}
