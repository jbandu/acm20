import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ queryId: string }> }
) {
  const { queryId } = await params;

  // Mock knowledge graph data
  const graphData = {
    nodes: [
      {
        id: "1",
        type: "concept",
        data: {
          title: "CAR-T Therapy",
          description: "Chimeric Antigen Receptor T-cell therapy",
          type: "concept",
          tags: ["immunotherapy", "cancer"],
        },
        position: { x: 100, y: 100 },
      },
      {
        id: "2",
        type: "paper",
        data: {
          title: "Hypoxia-Responsive CAR-T Cells",
          description: "Novel engineering approach",
          type: "paper",
          tags: ["CAR-T", "hypoxia"],
        },
        position: { x: 300, y: 100 },
      },
      {
        id: "3",
        type: "concept",
        data: {
          title: "Solid Tumors",
          description: "Tumor microenvironment",
          type: "concept",
          tags: ["oncology"],
        },
        position: { x: 200, y: 200 },
      },
    ],
    edges: [
      {
        id: "e1-2",
        source: "1",
        target: "2",
        data: { label: "related to" },
      },
      {
        id: "e2-3",
        source: "2",
        target: "3",
        data: { label: "targets" },
      },
    ],
  };

  return NextResponse.json(graphData);
}
