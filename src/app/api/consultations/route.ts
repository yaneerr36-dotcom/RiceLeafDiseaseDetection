
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Require login before prediction
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const apiUrl = process.env.RF_INFERENCE_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "RF_INFERENCE_URL is not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    const forwardData = new FormData();
    forwardData.append("file", file, file.name);

    const response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/predict`,
      {
        method: "POST",
        body: forwardData,
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.detail || "Prediction service failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Prediction API error:", error);

    return NextResponse.json(
      { error: "Unable to connect to the prediction service" },
      { status: 500 }
    );
  }
}
