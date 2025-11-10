import { NextResponse } from "next/server";

export async function GET() {
  // Mock document vault stats
  return NextResponse.json({
    documentCount: 1247,
  });
}
