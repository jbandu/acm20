export type SearchDepth = "quick" | "standard" | "deep";

export interface CostConfig {
  sources: string[];
  llms: string[];
  depth: SearchDepth;
  maxResults?: number;
}

const SOURCE_BASE_COST: Record<string, number> = {
  openalex: 0.15,
  "google-patents": 0.25,
  pubmed: 0.1,
  "document-vault": 0.05,
};

const LLM_BASE_COST: Record<string, number> = {
  claude: 1.8,
  gpt4: 3.2,
  gemini: 1.2,
  ollama: 0,
};

const DEPTH_MULTIPLIER: Record<SearchDepth, number> = {
  quick: 0.5,
  standard: 1,
  deep: 2.6,
};

const MINIMUM_COST = 0.5;

export function calculateQueryCost(config: CostConfig): number {
  const { sources, llms, depth, maxResults = 20 } = config;

  const sourceCost = sources.reduce((total, source) => {
    return total + (SOURCE_BASE_COST[source] ?? 0.1);
  }, 0);

  const llmCost = llms.reduce((total, llm) => {
    return total + (LLM_BASE_COST[llm] ?? 1);
  }, 0);

  const resultsMultiplier = Math.max(1, maxResults / 20);
  const depthMultiplier = DEPTH_MULTIPLIER[depth];

  const totalCost = (sourceCost + llmCost) * depthMultiplier * resultsMultiplier;

  return parseFloat(Math.max(MINIMUM_COST, totalCost).toFixed(2));
}

export function estimateQueryDuration(depth: SearchDepth, sourcesCount: number, llmCount: number): number {
  const base = depth === "quick" ? 8 : depth === "standard" ? 18 : 45;
  const sourceAdjustment = Math.min(12, sourcesCount * 2.5);
  const llmAdjustment = Math.min(10, llmCount * 3);

  return Math.round(base + sourceAdjustment + llmAdjustment);
}
