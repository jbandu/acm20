import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Mock refined query - in production, call an LLM API
    const refinedQuery = `Refined: ${query}. This query has been enhanced with additional context and specificity to improve search results.`;

    return NextResponse.json({
      refinedQuery,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to refine query" },
      { status: 500 }
    );
  }
}
