import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const { queryId } = await params;

  // Mock progress SSE endpoint
  // In production, implement proper Server-Sent Events
  return new NextResponse("Progress endpoint", {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
