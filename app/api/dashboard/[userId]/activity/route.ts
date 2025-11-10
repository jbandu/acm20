import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || "";

  // Mock data with pagination
  const allItems = Array.from({ length: 50 }, (_, i) => ({
    id: `activity-${i}`,
    title: `Activity ${i + 1}`,
    description: `Description for activity ${i + 1}`,
    timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
  }));

  const cursorIndex = cursor ? parseInt(cursor, 10) : 0;
  const pageSize = 10;
  const items = allItems.slice(cursorIndex, cursorIndex + pageSize);
  const nextCursor = cursorIndex + pageSize < allItems.length 
    ? String(cursorIndex + pageSize) 
    : undefined;

  return NextResponse.json({
    items,
    nextCursor,
  });
}
