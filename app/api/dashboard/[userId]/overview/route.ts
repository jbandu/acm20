import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  // Mock data
  const overview = {
    user: {
      id: userId,
      name: "Dr. Sarah Chen",
      role: "Senior Researcher",
    },
    stats: {
      queriesThisWeek: 12,
      papersReviewed: 47,
      contributions: 8,
    },
    digest: {
      lastUpdated: new Date().toISOString(),
      totals: {
        articles: 124,
        patents: 23,
        clinicalTrials: 5,
        concepts: 18,
      },
      topics: [
        { name: "CAR-T Therapy", score: 0.95 },
        { name: "Solid Tumors", score: 0.87 },
        { name: "Hypoxia", score: 0.82 },
      ],
      breakthroughs: [
        {
          id: "1",
          title: "Novel CAR-T Engineering Approach",
          summary: "Breakthrough in CAR-T cell infiltration mechanisms for solid tumors",
        },
      ],
    },
    deadlines: [
      {
        id: "1",
        title: "Grant Proposal Submission",
        type: "Grant",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    trendingTopics: [
      {
        name: "Hypoxia-Responsive CAR-T",
        summary: "Emerging research on hypoxia-responsive CAR-T cells",
        momentum: 15,
      },
    ],
    suggestions: [
      {
        id: "1",
        question: "What are the latest CAR-T engineering approaches for solid tumors?",
        reason: "Based on your recent queries",
        source: "AI",
        topic: "Immunotherapy",
      },
    ],
    recentActivity: [
      {
        id: "1",
        title: "Query completed",
        description: "CAR-T engineering approaches",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
  };

  return NextResponse.json(overview);
}
