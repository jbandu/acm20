"use client";

import { useState } from "react";
import { ResearcherDashboard } from "@/components/dashboard/ResearcherDashboard";
import { QueryBuilder } from "@/components/query/QueryBuilder";
import { ProgressTracker } from "@/components/query/ProgressTracker";
import { ResponseCard } from "@/components/results/ResponseCard";
import { GraphVisualization } from "@/components/knowledge-graph/GraphVisualization";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleQuerySubmit = (queryId: string) => {
    setActiveQueryId(queryId);
    setActiveTab("progress");
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">ACM20 Research Platform</h1>
          <p className="mt-2 text-muted-foreground">
            Search across global research knowledge and ACM private intelligence
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="query">New Query</TabsTrigger>
            {activeQueryId && <TabsTrigger value="progress">Progress</TabsTrigger>}
            {activeQueryId && <TabsTrigger value="results">Results</TabsTrigger>}
            {activeQueryId && <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ResearcherDashboard userId="user-1" />
          </TabsContent>

          <TabsContent value="query" className="space-y-6">
            <QueryBuilder onSubmitSuccess={handleQuerySubmit} />
          </TabsContent>

          {activeQueryId && (
            <>
              <TabsContent value="progress" className="space-y-6">
                <ProgressTracker queryId={activeQueryId} />
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Query Results</h2>
                  <MockResults queryId={activeQueryId} />
                </div>
              </TabsContent>

              <TabsContent value="graph" className="space-y-6">
                <GraphVisualization queryId={activeQueryId} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </main>
  );
}

function MockResults({ queryId }: { queryId: string }) {
  // Mock data for demonstration
  const mockResponses = [
    {
      id: "1",
      queryId,
      title: "CAR-T Cell Engineering for Solid Tumors",
      summary: "Recent advances in CAR-T cell engineering have shown promise for treating solid tumors through improved infiltration mechanisms.",
      content: "This paper discusses novel approaches to CAR-T cell engineering that enhance their ability to infiltrate hypoxic solid tumor microenvironments. Key strategies include metabolic reprogramming and hypoxia-responsive gene circuits.",
      source: "openalex",
      metadata: {
        date: "2024-01-15",
        citations: 42,
        relevanceScore: 0.95,
        openAccess: true,
        tags: ["CAR-T", "solid tumors", "hypoxia"],
      },
    },
    {
      id: "2",
      queryId,
      title: "Hypoxia-Responsive CAR-T Cells",
      summary: "A new generation of CAR-T cells engineered with hypoxia-responsive promoters shows enhanced activity in solid tumor models.",
      content: "The study demonstrates that CAR-T cells expressing hypoxia-inducible factors exhibit superior infiltration and persistence in hypoxic tumor regions compared to conventional CAR-T cells.",
      source: "pubmed",
      metadata: {
        date: "2024-02-01",
        citations: 28,
        relevanceScore: 0.88,
        openAccess: false,
        tags: ["hypoxia", "CAR-T", "gene therapy"],
      },
    },
  ];

  return (
    <div className="space-y-4">
      {mockResponses.map((response) => (
        <ResponseCard key={response.id} response={response} />
      ))}
    </div>
  );
}
