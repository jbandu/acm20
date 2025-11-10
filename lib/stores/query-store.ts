import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QueryOptions {
  searchDepth: "quick" | "standard" | "deep";
  maxResults: number;
  dateFrom?: string;
  dateTo?: string;
  openAccessOnly: boolean;
}

interface QueryStoreState {
  query: string;
  sources: string[];
  llms: string[];
  options: QueryOptions;
}

type QueryStoreActions = {
  setQuery: (query: string) => void;
  toggleSource: (source: string) => void;
  toggleLLM: (llm: string) => void;
  setSources: (sources: string[]) => void;
  setLLMs: (llms: string[]) => void;
  setOptions: (options: Partial<QueryOptions>) => void;
  reset: () => void;
};

export type QueryStore = QueryStoreState & QueryStoreActions;

const DEFAULT_STATE: QueryStoreState = {
  query: "",
  sources: ["openalex", "pubmed"],
  llms: ["claude"],
  options: {
    searchDepth: "standard",
    maxResults: 20,
    openAccessOnly: false,
  },
};

export const useQueryStore = create<QueryStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setQuery: (query) => set({ query }),

      toggleSource: (source) =>
        set((state) => ({
          sources: state.sources.includes(source)
            ? state.sources.filter((s) => s !== source)
            : [...state.sources, source],
        })),

      toggleLLM: (llm) =>
        set((state) => ({
          llms: state.llms.includes(llm)
            ? state.llms.filter((l) => l !== llm)
            : [...state.llms, llm],
        })),

      setSources: (sources) => set({ sources }),

      setLLMs: (llms) => set({ llms }),

      setOptions: (options) =>
        set((state) => ({
          options: { ...state.options, ...options },
        })),

      reset: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "query-storage",
      partialize: (state) => state,
    }
  )
);
