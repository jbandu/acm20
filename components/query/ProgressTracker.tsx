"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryProgressStore, type QueryProgressStep } from "@/lib/stores/query-progress-store";
import { cn } from "@/lib/utils";

export interface ProgressTrackerProps {
  queryId: string;
  className?: string;
  autoConnect?: boolean;
}

const DEFAULT_STEPS = [
  { id: "intent", label: "Refining query intent" },
  { id: "openalex", label: "Searching OpenAlex" },
  { id: "patents", label: "Searching Google Patents" },
  { id: "pubmed", label: "Searching PubMed" },
  { id: "llm", label: "Analyzing with LLMs" },
];

type EstimateEvent = {
  type: "estimate";
  seconds: number;
};

type StepEvent = {
  stepId: string;
  status: "active" | "completed" | "error";
  detail?: string;
  metadata?: Record<string, unknown>;
};

type ProgressEventPayload = EstimateEvent | StepEvent;

export function ProgressTracker({ queryId, className, autoConnect = true }: ProgressTrackerProps) {
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [startedAt] = React.useState(() => Date.now());
  const steps = useQueryProgressStore((state) => state.steps);
  const estimated = useQueryProgressStore((state) => state.estimatedSeconds);
  const initialize = useQueryProgressStore((state) => state.initialize);
  const startStep = useQueryProgressStore((state) => state.startStep);
  const completeStep = useQueryProgressStore((state) => state.completeStep);
  const failStep = useQueryProgressStore((state) => state.failStep);
  const setEstimatedTime = useQueryProgressStore((state) => state.setEstimatedTime);
  const reset = useQueryProgressStore((state) => state.reset);

  const handleProgressEvent = React.useCallback(
    (payload: ProgressEventPayload) => {
      if ("type" in payload && payload.type === "estimate") {
        setEstimatedTime(payload.seconds);
        return;
      }

      const stepPayload = payload as StepEvent;

      switch (stepPayload.status) {
        case "active":
          startStep(stepPayload.stepId, stepPayload.detail);
          break;
        case "completed":
          completeStep(stepPayload.stepId, stepPayload.metadata);
          break;
        case "error":
          failStep(stepPayload.stepId, stepPayload.detail ?? "Step failed");
          break;
        default:
          break;
      }
    },
    [completeStep, failStep, setEstimatedTime, startStep]
  );

  React.useEffect(() => {
    initialize(DEFAULT_STEPS);

    if (!autoConnect) {
      return;
    }

    const source = new EventSource(`/api/query/${queryId}/progress`);

    source.onmessage = (event) => {
      setConnectionError(null);
      try {
        const payload = JSON.parse(event.data) as ProgressEventPayload;
        handleProgressEvent(payload);
      } catch (error) {
        console.error("Failed to parse progress event", error);
      }
    };

    source.onerror = () => {
      setConnectionError("Connection interrupted. Attempting to reconnect...");
    };

    return () => {
      source.close();
      reset();
    };
  }, [autoConnect, initialize, queryId, reset, handleProgressEvent]);

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/query/${queryId}/cancel`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : "Unable to cancel query"
      );
    }
  };

  const completedSteps = steps.filter((step) => step.status === "completed").length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
  const remainingSeconds = estimated ? Math.max(0, estimated - elapsedSeconds) : null;

  return (
    <Card className={cn("bg-card/95 shadow-sm", className)}>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle className="text-base font-semibold">Processing query</CardTitle>
        <div className="text-xs text-muted-foreground">
          {progressPercent}% complete
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionError ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {connectionError}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Elapsed: {elapsedSeconds}s</span>
          {remainingSeconds !== null ? <span>ETA: ~{remainingSeconds}s</span> : null}
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <TimelineRow key={step.id} step={step} isLast={index === steps.length - 1} />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            You can continue working while this query completes.
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
            Cancel Query
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineRowProps {
  step: QueryProgressStep;
  isLast: boolean;
}

function TimelineRow({ step, isLast }: TimelineRowProps) {
  const status = step.status ?? "idle";
  const Icon = getStatusIcon(status);
  const borderClass = status === "completed"
    ? "border-emerald-500"
    : status === "error"
    ? "border-destructive"
    : "border-muted";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border-2",
            status === "completed" ? "border-emerald-500 bg-emerald-500/10" :
            status === "error" ? "border-destructive bg-destructive/10" :
            status === "active" ? "border-primary bg-primary/10" :
            "border-muted-foreground/30"
          )}
        >
          <Icon className="h-3 w-3" />
        </span>
        {!isLast ? (
          <span className={cn("h-full w-px flex-1 border-l", borderClass)} aria-hidden="true" />
        ) : null}
      </div>
      <div className="flex-1 overflow-hidden rounded-lg border border-border/60 bg-background/60 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{step.label}</p>
          <StatusPill status={status} />
        </div>
        <AnimatePresence initial={false}>
          {step.detail ? (
            <motion.p
              key={step.detail}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 text-xs text-muted-foreground"
            >
              {step.detail}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface StatusIconProps {
  className?: string;
}

function getStatusIcon(status: "idle" | "active" | "completed" | "error") {
  switch (status) {
    case "completed":
      return (props: StatusIconProps) => <CheckIcon {...props} />;
    case "error":
      return (props: StatusIconProps) => <AlertIcon {...props} />;
    case "active":
      return (props: StatusIconProps) => <SpinnerIcon {...props} />;
    default:
      return (props: StatusIconProps) => <CircleIcon {...props} />;
  }
}

function StatusPill({ status }: { status: "idle" | "active" | "completed" | "error" }) {
  const map: Record<typeof status, { label: string; className: string }> = {
    idle: { label: "Pending", className: "bg-muted text-muted-foreground" },
    active: { label: "Running", className: "bg-primary/10 text-primary" },
    completed: { label: "Done", className: "bg-emerald-500/10 text-emerald-600" },
    error: { label: "Failed", className: "bg-destructive/10 text-destructive" },
  };
  const meta = map[status];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>
      {meta.label}
    </span>
  );
}

function SpinnerIcon(props: StatusIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={cn("animate-spin", props.className)}
    >
      <circle cx="12" cy="12" r="9" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}
SpinnerIcon.displayName = "SpinnerIcon";

function CheckIcon(props: StatusIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
CheckIcon.displayName = "CheckIcon";

function AlertIcon(props: StatusIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}
AlertIcon.displayName = "AlertIcon";

function CircleIcon(props: StatusIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx="12" cy="12" r="9" opacity={0.3} />
    </svg>
  );
}
CircleIcon.displayName = "CircleIcon";
