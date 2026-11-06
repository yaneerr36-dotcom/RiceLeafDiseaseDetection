
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _: NextRequest,
  { params }: RouteContext,
) {
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

    const { id } = await params;
    const scanId = Number(id);

    if (!Number.isInteger(scanId) || scanId <= 0) {
      return NextResponse.json(
        { error: "Invalid scan ID." },
        { status: 400 },
      );
    }

    const [deleted] = await db
      .delete(scans)
      .where(
        and(
          eq(scans.id, scanId),
          eq(scans.userId, session.user.id),
        ),
      )
      .returning({ id: scans.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Scan not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/scans/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete scan." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext,
) {
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

    const { id } = await params;
    const scanId = Number(id);

    if (!Number.isInteger(scanId) || scanId <= 0) {
      return NextResponse.json(
        { error: "Invalid scan ID." },
        { status: 400 },
      );
    }

    const body = await req.json();

    if (
      body.feedback !== null &&
      body.feedback !== "correct" &&
      body.feedback !== "incorrect"
    ) {
      return NextResponse.json(
        { error: "Invalid feedback value." },
        { status: 400 },
      );
    }

    const [row] = await db
      .update(scans)
      .set({ feedback: body.feedback })
      .where(
        and(
          eq(scans.id, scanId),
          eq(scans.userId, session.user.id),
        ),
      )
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "Scan not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ scan: row });
  } catch (error) {
    console.error("PATCH /api/scans/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update scan." },
      { status: 500 },
    );
  }
}
