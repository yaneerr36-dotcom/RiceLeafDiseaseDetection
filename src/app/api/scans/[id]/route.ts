import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(scans).where(eq(scans.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db.update(scans).set({ feedback: body.feedback }).where(eq(scans.id, parseInt(id))).returning();
  return NextResponse.json({ scan: row });
}
