"use client";

import * as React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import "reactflow/dist/style.css";

export interface GraphVisualizationProps {
  queryId?: string;
  autoLoad?: boolean;
  className?: string;
}

export interface KnowledgeNode extends Node {
  data: Node["data"] & {
    title: string;
    description?: string;
    type: string;
    value?: number;
    tags?: string[];
  };
}

export type KnowledgeEdge = Edge & {
  data?: {
    label?: string;
    weight?: number;
  };
};

const NODE_CLASS_MAP: Record<string, string> = {
  concept: "border-sky-500 bg-sky-500/10",
  paper: "border-emerald-500 bg-emerald-500/10",
  patent: "border-amber-500 bg-amber-500/10",
  person: "border-indigo-500 bg-indigo-500/10",
  institution: "border-fuchsia-500 bg-fuchsia-500/10",
};

const NODE_COLOR_MAP: Record<string, string> = {
  concept: "#0ea5e9",
  paper: "#10b981",
  patent: "#f59e0b",
  person: "#6366f1",
  institution: "#d946ef",
};

const DEFAULT_TYPES = new Set(["concept", "paper", "patent", "person", "institution"]);

export function GraphVisualization({ queryId, autoLoad = true, className }: GraphVisualizationProps) {
  const [activeTypes, setActiveTypes] = React.useState<Set<string>>(new Set(DEFAULT_TYPES));
  const [searchTerm, setSearchTerm] = React.useState("");
  const [layout, setLayout] = React.useState<LayoutVariant>("force");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["knowledge-graph", queryId],
    queryFn: async () => {
      const response = await fetch(`/api/query/${queryId}/graph`);
      if (!response.ok) {
        throw new Error("Failed to load knowledge graph");
      }
      return (await response.json()) as KnowledgeGraphPayload;
    },
    enabled: autoLoad && Boolean(queryId),
    staleTime: 1000 * 30,
  });

  const initialNodes = React.useMemo<KnowledgeNode[]>(() => data?.nodes ?? [], [data?.nodes]);
  const initialEdges = React.useMemo<KnowledgeEdge[]>(() => data?.edges ?? [], [data?.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<KnowledgeNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<KnowledgeEdge>(initialEdges);

  React.useEffect(() => {
    if (!data) return;
    const laidOut = applyLayout(initialNodes, initialEdges, layout);
    setNodes(laidOut.nodes);
    setEdges(laidOut.edges);
  }, [data, layout, initialNodes, initialEdges, setNodes, setEdges]);

  const filteredNodes = React.useMemo(() => {
    if (!searchTerm && activeTypes.size === DEFAULT_TYPES.size) {
      return nodes;
    }

    const lower = searchTerm.toLowerCase();
    return nodes.filter((node) => {
      const isTypeActive = activeTypes.has(node.data?.type ?? "concept");
      const matchesSearch = !lower
        || node.data?.title?.toLowerCase().includes(lower)
        || node.data?.tags?.some((tag) => tag.toLowerCase().includes(lower));
      return isTypeActive && matchesSearch;
    });
  }, [nodes, activeTypes, searchTerm]);

  const filteredNodeIds = React.useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes]);

  const filteredEdges = React.useMemo(() => {
    return edges.filter((edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target));
  }, [edges, filteredNodeIds]);

  React.useEffect(() => {
    setNodes((nodes) => nodes.map((node) => ({
      ...node,
      hidden: !filteredNodeIds.has(node.id),
    })));
    setEdges((edges) => edges.map((edge) => ({
      ...edge,
      hidden: !filteredNodeIds.has(edge.source) || !filteredNodeIds.has(edge.target),
    })));
  }, [filteredNodeIds, setEdges, setNodes]);

  const handleToggleType = (type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next.size ? next : new Set([type]);
    });
  };

  return (
    <Card className={cn("h-full w-full", className)}>
      <CardHeader className="flex flex-col gap-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold">Knowledge Graph</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {filteredNodes.length} nodes • {filteredEdges.length} edges
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search nodes..."
            className="h-10 flex-1 rounded-md border border-input px-3 text-sm"
          />
          <select
            value={layout}
            onChange={(event) => setLayout(event.target.value as LayoutVariant)}
            className="h-10 rounded-md border border-input px-3 text-sm"
          >
            <option value="force">Force-directed</option>
            <option value="grid">Grid</option>
            <option value="radial">Radial</option>
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from(DEFAULT_TYPES).map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={activeTypes.has(type)}
                onChange={() => handleToggleType(type)}
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </CardHeader>
      <CardContent className="relative h-[600px] overflow-hidden rounded-b-xl">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Loading graph...
          </div>
        ) : null}
        <motion.div className="h-full w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            nodeTypes={customNodeTypes}
            nodesDraggable
            className="bg-muted/10"
          >
            <Background gap={24} />
            <MiniMap
              nodeColor={(node) => mapNodeColor(node.data?.type)}
              pannable
              zoomable
            />
            <Controls position="bottom-right" showInteractive={false} />
          </ReactFlow>
        </motion.div>
      </CardContent>
    </Card>
  );
}

type LayoutVariant = "force" | "grid" | "radial";

type KnowledgeGraphPayload = {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
};

const customNodeTypes: NodeTypes = {
  concept: ConceptNode,
  paper: PaperNode,
  patent: PatentNode,
  person: PersonNode,
  institution: InstitutionNode,
};

function ConceptNode({ data }: { data: KnowledgeNode["data"] }) {
  return <NodeCard data={data} className={NODE_CLASS_MAP.concept} />;
}

function PaperNode({ data }: { data: KnowledgeNode["data"] }) {
  return <NodeCard data={data} className={NODE_CLASS_MAP.paper} />;
}

function PatentNode({ data }: { data: KnowledgeNode["data"] }) {
  return <NodeCard data={data} className={NODE_CLASS_MAP.patent} />;
}

function PersonNode({ data }: { data: KnowledgeNode["data"] }) {
  return <NodeCard data={data} className={NODE_CLASS_MAP.person} />;
}

function InstitutionNode({ data }: { data: KnowledgeNode["data"] }) {
  return <NodeCard data={data} className={NODE_CLASS_MAP.institution} />;
}

function NodeCard({ data, className }: { data: KnowledgeNode["data"]; className?: string }) {
  return (
    <div
      className={cn(
        "min-w-[160px] max-w-[220px] rounded-lg border px-3 py-2 shadow-sm backdrop-blur",
        className
      )}
    >
      <p className="truncate text-sm font-semibold text-foreground">{data.title}</p>
      {data.description ? (
        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{data.description}</p>
      ) : null}
      {data.tags?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function mapNodeColor(type?: string) {
  return NODE_COLOR_MAP[type ?? "concept"] ?? "#64748b";
}

function applyLayout(nodes: KnowledgeNode[], edges: KnowledgeEdge[], variant: LayoutVariant) {
  const cloneNodes = nodes.map((node) => ({ ...node }));
  switch (variant) {
    case "grid":
      return layoutGrid(cloneNodes, edges);
    case "radial":
      return layoutRadial(cloneNodes, edges);
    default:
      return layoutForce(cloneNodes, edges);
  }
}

function layoutGrid(nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  const columns = Math.ceil(Math.sqrt(nodes.length));
  const spacing = 200;
  const laidOut = nodes.map((node, index) => ({
    ...node,
    position: {
      x: (index % columns) * spacing,
      y: Math.floor(index / columns) * spacing,
    },
  }));
  return { nodes: laidOut, edges };
}

function layoutRadial(nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  const radius = 200;
  const centerX = 300;
  const centerY = 300;
  const laidOut = nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2;
    return {
      ...node,
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      },
    };
  });
  return { nodes: laidOut, edges };
}

function layoutForce(nodes: KnowledgeNode[], edges: KnowledgeEdge[]) {
  const width = 600;
  const height = 500;
  const spacing = 170;
  const placed: Record<string, { x: number; y: number }> = {};
  let index = 0;

  for (const node of nodes) {
    placed[node.id] = {
      x: (index % 5) * spacing,
      y: Math.floor(index / 5) * spacing,
    };
    index += 1;
  }

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: placed[node.id] ?? { x: Math.random() * width, y: Math.random() * height },
    })),
    edges,
  };
}
