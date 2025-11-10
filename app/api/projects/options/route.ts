import { NextResponse } from "next/server";

export async function GET() {
  // Mock project options
  const projects = [
    { id: "proj-1", name: "CAR-T Research Project" },
    { id: "proj-2", name: "Solid Tumor Initiative" },
    { id: "proj-3", name: "Hypoxia Studies" },
  ];

  return NextResponse.json({ projects });
}
