import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { responseId } = await params;
  const body = await request.json();
  const { feedback } = body;

  // Mock feedback endpoint
  return NextResponse.json({
    success: true,
    responseId,
    feedback,
  });
}
