import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const { queryId } = await params;

  // Mock cancel endpoint
  return NextResponse.json({
    success: true,
    message: "Query cancelled",
  });
}
