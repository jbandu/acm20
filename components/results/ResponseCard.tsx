"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ResponseMetadata {
  date?: string;
  citations?: number;
  relevanceScore?: number;
  openAccess?: boolean;
  tags?: string[];
}

export interface ResponseData {
  id: string;
  queryId: string;
  title: string;
  summary: string;
  content: string;
  source: "openalex" | "google-patents" | "pubmed" | "document-vault" | string;
  metadata?: ResponseMetadata;
}

export type FeedbackType = "like" | "dislike" | "wrong" | "important";

interface ResponseCardProps {
  response: ResponseData;
  defaultExpanded?: boolean;
}

export function ResponseCard({ response, defaultExpanded = false }: ResponseCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [optimisticFeedback, setOptimisticFeedback] = React.useState<FeedbackType | null>(null);
  const queryClient = useQueryClient();

  const feedbackMutation = useMutation({
    mutationKey: ["response-feedback", response.id],
    mutationFn: async (feedback: FeedbackType) => {
      const res = await fetch(`/api/responses/${response.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) {
        throw new Error("Failed to submit feedback");
      }
      return res.json();
    },
    onMutate: async (feedback) => {
      setOptimisticFeedback(feedback);
      await queryClient.cancelQueries({ queryKey: ["response", response.id] });
      return { previous: queryClient.getQueryData(["response", response.id]) };
    },
    onError: (_error, _variables, context) => {
      setOptimisticFeedback(null);
      if (context?.previous) {
        queryClient.setQueryData(["response", response.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["response", response.id] });
    },
  });

  const activeFeedback = optimisticFeedback ?? null;

  return (
    <Card className="overflow-hidden border border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="flex flex-col gap-2 border-b bg-muted/40 py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg font-semibold text-foreground">
            {response.title}
          </CardTitle>
          <SourceBadge source={response.source} />
        </div>
        <MetadataRow metadata={response.metadata} />
      </CardHeader>
      <CardContent className="space-y-4 py-6">
        <ReactMarkdown
          className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
          remarkPlugins={[remarkGfm]}
        >
          {response.summary}
        </ReactMarkdown>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden rounded-md border border-dashed border-muted bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none dark:prose-invert">
                {response.content}
              </ReactMarkdown>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Hide Details" : "Read More"}
          </Button>
          <FeedbackButtons
            active={activeFeedback}
            disabled={feedbackMutation.isPending}
            onFeedback={(type) => feedbackMutation.mutate(type)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface FeedbackButtonsProps {
  active: FeedbackType | null;
  disabled?: boolean;
  onFeedback: (type: FeedbackType) => void;
}

function FeedbackButtons({ active, disabled, onFeedback }: FeedbackButtonsProps) {
  const options: Array<{ type: FeedbackType; label: string; icon: React.ReactNode }> = [
    { type: "like", label: "Helpful", icon: "👍" },
    { type: "important", label: "Important", icon: "⭐" },
    { type: "dislike", label: "Not useful", icon: "👎" },
    { type: "wrong", label: "Incorrect", icon: "❌" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map(({ type, label, icon }) => {
        const isActive = active === type;
        return (
          <Button
            key={type}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            onClick={() => onFeedback(type)}
            className={cn("gap-2", isActive ? "bg-primary text-primary-foreground" : "")}
            aria-pressed={isActive}
          >
            <span>{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Button>
        );
      })}
    </div>
  );
}

interface MetadataRowProps {
  metadata?: ResponseMetadata;
}

function MetadataRow({ metadata }: MetadataRowProps) {
  if (!metadata) return null;

  const dataPoints: Array<{ label: string; value: React.ReactNode }> = [];

  if (metadata.date) {
    const formatted = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(metadata.date));
    dataPoints.push({ label: "Published", value: formatted });
  }

  if (typeof metadata.citations === "number") {
    dataPoints.push({ label: "Citations", value: metadata.citations });
  }

  if (typeof metadata.relevanceScore === "number") {
    dataPoints.push({ label: "Relevance", value: `${Math.round(metadata.relevanceScore * 100)}%` });
  }

  if (metadata.openAccess) {
    dataPoints.push({ label: "Access", value: <Badge variant="secondary">Open Access</Badge> });
  }

  if (metadata.tags?.length) {
    dataPoints.push({ label: "Tags", value: metadata.tags.map((tag) => <TagBadge key={tag} tag={tag} />) });
  }

  if (!dataPoints.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {dataPoints.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <span className="font-medium uppercase tracking-wide text-muted-foreground/70">
            {item.label}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="mr-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      {tag}
    </span>
  );
}

const SOURCE_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  openalex: { label: "OpenAlex", variant: "secondary" },
  "google-patents": { label: "Google Patents", variant: "outline" },
  pubmed: { label: "PubMed", variant: "secondary" },
  "document-vault": { label: "Internal", variant: "default" },
};

function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source] ?? { label: source, variant: "outline" as const };
  return (
    <Badge variant={meta.variant} className="uppercase tracking-tight">
      {meta.label}
    </Badge>
  );
}
