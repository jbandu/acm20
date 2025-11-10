import { create } from "zustand";

export type QueryStepStatus = "idle" | "active" | "completed" | "error";

export interface QueryProgressStep {
  id: string;
  label: string;
  detail?: string;
  status: QueryStepStatus;
  startedAt?: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

interface QueryProgressState {
  steps: QueryProgressStep[];
  estimatedSeconds?: number;
}

interface QueryProgressActions {
  initialize: (steps: Array<Pick<QueryProgressStep, "id" | "label">>) => void;
  startStep: (id: string, detail?: string) => void;
  completeStep: (id: string, metadata?: Record<string, unknown>) => void;
  failStep: (id: string, message?: string) => void;
  setEstimatedTime: (seconds: number) => void;
  reset: () => void;
}

export const useQueryProgressStore = create<QueryProgressState & QueryProgressActions>((set) => ({
  steps: [],
  estimatedSeconds: undefined,

  initialize: (steps) =>
    set({
      steps: steps.map((step) => ({
        ...step,
        status: "idle" as const,
      })),
      estimatedSeconds: undefined,
    }),

  startStep: (id, detail) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === id
          ? {
              ...step,
              detail,
              status: "active" as const,
              startedAt: Date.now(),
              completedAt: undefined,
            }
          : step
      ),
    })),

  completeStep: (id, metadata) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === id
          ? {
              ...step,
              status: "completed" as const,
              completedAt: Date.now(),
              metadata: { ...step.metadata, ...metadata },
            }
          : step
      ),
    })),

  failStep: (id, message) =>
    set((state) => ({
      steps: state.steps.map((step) =>
        step.id === id
          ? {
              ...step,
              status: "error" as const,
              detail: message ?? step.detail,
              completedAt: Date.now(),
            }
          : step
      ),
    })),

  setEstimatedTime: (seconds) => set({ estimatedSeconds: seconds }),

  reset: () => set({ steps: [], estimatedSeconds: undefined }),
}));
