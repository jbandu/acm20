"use client";

import * as React from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryStore } from "@/lib/stores/query-store";
import {
  calculateQueryCost,
  estimateQueryDuration,
} from "@/lib/utils/cost-calculator";
import { cn, formatCurrency } from "@/lib/utils";

const QUERY_LOCAL_STORAGE_KEY = "acm-research:query-builder";

const queryFormSchema = z
  .object({
    query: z
      .string()
      .min(10, "Query must be at least 10 characters long")
      .max(500, "Query must be fewer than 500 characters"),
    sources: z.array(z.string()).min(1, "Select at least one data source"),
    llms: z.array(z.string()).min(1, "Select at least one model"),
    searchDepth: z.enum(["quick", "standard", "deep"]),
    maxResults: z.number().min(10).max(100),
    openAccessOnly: z.boolean(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    projectId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.dateFrom || !data.dateTo) {
        return true;
      }
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    },
    {
      message: "Start date must be before end date",
      path: ["dateTo"],
    }
  );

export type QueryFormValues = z.infer<typeof queryFormSchema>;
interface DataSourceMeta {
  id: string;
  name: string;
  description: string;
  category: "public" | "private";
  badge?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  baseCount?: string;
}

interface LLMProviderMeta {
  id: string;
  name: string;
  description: string;
  cost: string;
  badge?: string | null;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const DATA_SOURCES: DataSourceMeta[] = [
  {
    id: "openalex",
    name: "OpenAlex",
    description: "2.5M cancer research papers",
    category: "public",
    icon: DatabaseIcon,
  },
  {
    id: "google-patents",
    name: "Google Patents",
    description: "15M patents worldwide",
    category: "public",
    icon: FileTextIcon,
  },
  {
    id: "pubmed",
    name: "PubMed",
    description: "35M biomedical articles",
    category: "public",
    icon: DatabaseIcon,
  },
  {
    id: "document-vault",
    name: "Document Vault",
    description: "",
    category: "private",
    badge: "Private",
    icon: FileTextIcon,
  },
];

const LLM_PROVIDERS: LLMProviderMeta[] = [
  {
    id: "claude",
    name: "Claude Sonnet 4",
    description: "Best reasoning & analysis",
    cost: "$3 / M tokens",
    badge: "Recommended",
    icon: BrainIcon,
  },
  {
    id: "gpt4",
    name: "GPT-4 Turbo",
    description: "Fast & versatile",
    cost: "$10 / M tokens",
    badge: null,
    icon: BrainIcon,
  },
  {
    id: "gemini",
    name: "Gemini 1.5 Pro",
    description: "Long context window",
    cost: "$1.25 / M tokens",
    badge: null,
    icon: BrainIcon,
  },
  {
    id: "ollama",
    name: "Local Ollama",
    description: "Self-hosted, private",
    cost: "Free",
    badge: "Free",
    icon: BrainIcon,
  },
];

const DEFAULT_FORM_VALUES: QueryFormValues = {
  query: "",
  sources: ["openalex", "pubmed"],
  llms: ["claude"],
  searchDepth: "standard",
  maxResults: 20,
  openAccessOnly: false,
  dateFrom: undefined,
  dateTo: undefined,
  projectId: undefined,
};

interface QueryBuilderProps {
  className?: string;
  onSubmitSuccess?: (queryId: string) => void;
}
export function QueryBuilder({ className, onSubmitSuccess }: QueryBuilderProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [isRefining, setIsRefining] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("compose");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const {
    query: persistedQuery,
    sources: persistedSources,
    llms: persistedLLMs,
    options: persistedOptions,
    setQuery,
    setSources,
    setLLMs,
    setOptions,
  } = useQueryStore();

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    mode: "onChange",
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      query: persistedQuery || DEFAULT_FORM_VALUES.query,
      sources: persistedSources?.length ? persistedSources : DEFAULT_FORM_VALUES.sources,
      llms: persistedLLMs?.length ? persistedLLMs : DEFAULT_FORM_VALUES.llms,
      searchDepth: persistedOptions?.searchDepth ?? DEFAULT_FORM_VALUES.searchDepth,
      maxResults: persistedOptions?.maxResults ?? DEFAULT_FORM_VALUES.maxResults,
      openAccessOnly: persistedOptions?.openAccessOnly ?? DEFAULT_FORM_VALUES.openAccessOnly,
      dateFrom: persistedOptions?.dateFrom,
      dateTo: persistedOptions?.dateTo,
      projectId: undefined,
    },
  });

  const watchedQuery = form.watch("query");
  const watchedSources = form.watch("sources");
  const watchedLLMs = form.watch("llms");
  const watchedDepth = form.watch("searchDepth");
  const watchedMaxResults = form.watch("maxResults");

  const estimatedCost = React.useMemo(
    () =>
      calculateQueryCost({
        sources: watchedSources,
        llms: watchedLLMs,
        depth: watchedDepth,
        maxResults: watchedMaxResults,
      }),
    [watchedSources, watchedLLMs, watchedDepth, watchedMaxResults]
  );

  const estimatedDuration = React.useMemo(
    () => estimateQueryDuration(watchedDepth, watchedSources.length, watchedLLMs.length),
    [watchedDepth, watchedSources.length, watchedLLMs.length]
  );

  const { data: projectOptions } = useProjectOptions();
  const { data: vaultStats } = useDocumentVaultStats();

  const sourcesWithStats = React.useMemo(() => {
    return DATA_SOURCES.map((source) =>
      source.id === "document-vault" && vaultStats?.documentCount
        ? {
            ...source,
            description: `${vaultStats.documentCount} internal documents`,
          }
        : source
    );
  }, [vaultStats?.documentCount]);

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(QUERY_LOCAL_STORAGE_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<QueryFormValues>;
        form.reset({
          ...DEFAULT_FORM_VALUES,
          ...parsed,
          query: parsed.query ?? DEFAULT_FORM_VALUES.query,
          sources: parsed.sources?.length ? parsed.sources : DEFAULT_FORM_VALUES.sources,
          llms: parsed.llms?.length ? parsed.llms : DEFAULT_FORM_VALUES.llms,
        });
      } catch (error) {
        console.warn("Failed to parse stored query state", error);
      }
    }
  }, [form]);

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      const payload: Partial<QueryFormValues> = {
        ...value,
      };
      localStorage.setItem(QUERY_LOCAL_STORAGE_KEY, JSON.stringify(payload));
      setQuery(value.query ?? "");
      setSources(value.sources ?? []);
      setLLMs(value.llms ?? []);
      setOptions({
        searchDepth: value.searchDepth ?? DEFAULT_FORM_VALUES.searchDepth,
        maxResults: value.maxResults ?? DEFAULT_FORM_VALUES.maxResults,
        openAccessOnly: value.openAccessOnly ?? DEFAULT_FORM_VALUES.openAccessOnly,
        dateFrom: value.dateFrom,
        dateTo: value.dateTo,
      });
    });

    return () => subscription.unsubscribe();
  }, [form, setQuery, setSources, setLLMs, setOptions]);
  const handleRefineQuery = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsRefining(true);
    try {
      const response = await fetch("/api/query/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: form.getValues("query") }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = await response.json();
      if (payload?.refinedQuery) {
        form.setValue("query", payload.refinedQuery, { shouldValidate: true });
        setSuccessMessage("Query refined successfully");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to refine query"
      );
    } finally {
      setIsRefining(false);
    }
  };

  const onSubmit = async (values: QueryFormValues) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/query/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, estimatedCost, estimatedDuration }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const payload = await response.json();
      setSuccessMessage("Query launched successfully");
      onSubmitSuccess?.(payload?.queryId ?? "");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to run query"
      );
    }
  };

  const costColor = React.useMemo(() => {
    if (estimatedCost < 2) return "text-green-600";
    if (estimatedCost < 5) return "text-yellow-600";
    return "text-red-600";
  }, [estimatedCost]);
  return (
    <Card className={cn("w-full max-w-5xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <SearchIcon className="h-6 w-6" aria-hidden="true" />
          New Research Query
        </CardTitle>
        <CardDescription>
          Search across global research knowledge and ACM private intelligence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {errorMessage ? <Alert status="error" message={errorMessage} /> : null}
        {successMessage ? <Alert status="success" message={successMessage} /> : null}

        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <section className="space-y-4">
            <Label htmlFor="query" className="text-base font-semibold">
              Your Research Question
            </Label>
            <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="compose">
              <TabsList>
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="compose" className="border-none p-0">
                <Textarea
                  id="query"
                  placeholder="e.g. What emerging CAR-T engineering approaches improve infiltration into hypoxic solid tumor microenvironments?"
                  maxLength={500}
                  className="min-h-[140px] text-base"
                  {...form.register("query")}
                  aria-describedby="query-hint"
                />
              </TabsContent>
              <TabsContent value="preview" className="min-h-[140px] bg-muted/50">
                <ReactMarkdown
                  className="prose prose-sm max-w-none dark:prose-invert"
                  remarkPlugins={[remarkGfm]}
                >
                  {watchedQuery?.length ? watchedQuery : "Nothing to preview yet."}
                </ReactMarkdown>
              </TabsContent>
            </Tabs>
            <div
              className="flex flex-wrap items-center justify-between text-sm text-muted-foreground"
              id="query-hint"
            >
              <span>{watchedQuery?.length ?? 0} / 500 characters</span>
              {form.formState.errors.query ? (
                <span className="text-destructive">
                  {form.formState.errors.query.message}
                </span>
              ) : null}
            </div>
          </section>
          <section className="space-y-6">
            <div>
              <p className="text-base font-semibold">Data Sources</p>
              <p className="text-sm text-muted-foreground">
                Combine public research repositories with private ACM intelligence.
              </p>
            </div>

            <SourceGrid
              sources={sourcesWithStats.filter((source) => source.category === "public")}
              selected={watchedSources}
              onToggle={(id) => toggleArrayValue(form, "sources", id)}
              title="Public Sources"
            />

            <SourceGrid
              sources={sourcesWithStats.filter((source) => source.category === "private")}
              selected={watchedSources}
              onToggle={(id) => toggleArrayValue(form, "sources", id)}
              title="Private Sources"
              projectOptions={projectOptions?.projects ?? []}
              selectedProject={form.watch("projectId")}
              onProjectChange={(id) => form.setValue("projectId", id)}
            />
            {form.formState.errors.sources ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.sources.message}
              </p>
            ) : null}
          </section>
          <section className="space-y-6">
            <div>
              <p className="text-base font-semibold">AI Models</p>
              <p className="text-sm text-muted-foreground">
                Select one or more models to synthesize findings and cross-validate results.
              </p>
            </div>
            <div className="grid gap-3">
              {LLM_PROVIDERS.map((provider) => (
                <motion.button
                  key={provider.id}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => toggleArrayValue(form, "llms", provider.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                    watchedLLMs.includes(provider.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={watchedLLMs.includes(provider.id)}
                    onChange={() => toggleArrayValue(form, "llms", provider.id)}
                    aria-label={`Select ${provider.name}`}
                  />
                  <provider.icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      {provider.badge ? (
                        <Badge
                          variant={provider.badge === "Recommended" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {provider.badge}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {provider.description} • {provider.cost}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
            {form.formState.errors.llms ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.llms.message}
              </p>
            ) : null}
          </section>
          <section className="space-y-4">
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center justify-between"
                >
                  <span>Advanced Options</span>
                  <ChevronDownIcon
                    className={cn("h-4 w-4 transition-transform", isAdvancedOpen ? "rotate-180" : "")}
                    aria-hidden="true"
                  />
                </Button>
              </CollapsibleTrigger>
              <AnimatePresence initial={false}>
                {isAdvancedOpen ? (
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="grid gap-6 md:grid-cols-2"
                    >
                      <fieldset className="space-y-3">
                        <legend className="text-sm font-medium text-muted-foreground">
                          Search Depth
                        </legend>
                        <RadioGroup
                          value={watchedDepth}
                          onValueChange={(value) =>
                            form.setValue("searchDepth", value as QueryFormValues["searchDepth"], {
                              shouldValidate: true,
                            })
                          }
                        >
                          <RadioCard
                            id="depth-quick"
                            value="quick"
                            title="Quick"
                            description="Best for exploratory scans (~10s)"
                            cost="≈ $0.80"
                            active={watchedDepth === "quick"}
                          />
                          <RadioCard
                            id="depth-standard"
                            value="standard"
                            title="Standard"
                            description="Balanced coverage (~20s)"
                            cost="≈ $2.00"
                            active={watchedDepth === "standard"}
                          />
                          <RadioCard
                            id="depth-deep"
                            value="deep"
                            title="Deep"
                            description="Exhaustive multi-pass (~45s)"
                            cost="≈ $5.50"
                            active={watchedDepth === "deep"}
                          />
                        </RadioGroup>
                      </fieldset>

                      <div className="space-y-6">
                        <div className="grid gap-3">
                          <Label htmlFor="maxResults" className="flex items-center justify-between text-sm">
                            Max Results
                            <span className="font-semibold">{watchedMaxResults}</span>
                          </Label>
                          <Slider
                            min={10}
                            max={100}
                            step={10}
                            value={[watchedMaxResults]}
                            onValueChange={(value) =>
                              form.setValue("maxResults", value[0], { shouldValidate: true })
                            }
                          />
                        </div>
                        <div className="grid gap-3">
                          <Label className="text-sm">Date Range</Label>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                                From
                              </Label>
                              <input
                                id="dateFrom"
                                type="date"
                                max={form.watch("dateTo") ?? undefined}
                                value={form.watch("dateFrom") ?? ""}
                                onChange={(event) =>
                                  form.setValue("dateFrom", event.target.value || undefined)
                                }
                                className="h-10 w-full rounded-md border border-input px-3 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                                To
                              </Label>
                              <input
                                id="dateTo"
                                type="date"
                                min={form.watch("dateFrom") ?? undefined}
                                value={form.watch("dateTo") ?? ""}
                                onChange={(event) =>
                                  form.setValue("dateTo", event.target.value || undefined, {
                                    shouldValidate: true,
                                  })
                                }
                                className="h-10 w-full rounded-md border border-input px-3 text-sm"
                              />
                            </div>
                          </div>
                          {form.formState.errors.dateTo ? (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.dateTo.message}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="openAccessOnly"
                            checked={form.watch("openAccessOnly")}
                            onChange={(event) =>
                              form.setValue("openAccessOnly", event.target.checked)
                            }
                          />
                          <Label htmlFor="openAccessOnly" className="text-sm font-normal">
                            Restrict to open access publications
                          </Label>
                        </div>
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                ) : null}
              </AnimatePresence>
            </Collapsible>
          </section>
          <section className="space-y-4">
            <Card className="border-dashed bg-muted/40">
              <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <DollarSignIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                    <p className={cn("text-xl font-semibold", costColor)}>
                      {formatCurrency(estimatedCost)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Estimated Duration
                    </p>
                    <p className="text-xl font-semibold">~{estimatedDuration} sec</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-3 md:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefineQuery}
              disabled={isRefining || !watchedQuery}
              className="flex-1"
            >
              {isRefining ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  Refining...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <SparklesIcon className="h-4 w-4" />
                  Refine Query
                </span>
              )}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                  Launching...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <SearchIcon className="h-4 w-4" />
                  Run Query
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleSaveTemplate(form.getValues())}
              aria-label="Save query as template"
            >
              <SaveIcon className="h-4 w-4" />
            </Button>
          </section>
        </form>
      </CardContent>
    </Card>
  );
}
interface SourceGridProps {
  sources: DataSourceMeta[];
  selected: string[];
  onToggle: (id: string) => void;
  title: string;
  projectOptions?: ProjectOption[];
  selectedProject?: string;
  onProjectChange?: (projectId?: string) => void;
}

function SourceGrid({
  sources,
  selected,
  onToggle,
  title,
  projectOptions,
  selectedProject,
  onProjectChange,
}: SourceGridProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="grid gap-3">
        {sources.map((source) => {
          const isActive = selected.includes(source.id);
          return (
            <motion.button
              key={source.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onToggle(source.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors",
                isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <Checkbox
                checked={isActive}
                onChange={() => onToggle(source.id)}
                aria-label={`Select ${source.name}`}
              />
              <source.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{source.name}</span>
                  {source.badge ? (
                    <Badge variant="secondary" className="text-xs">
                      {source.badge}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {source.description || "Latest sync available"}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
      {projectOptions?.length ? (
        <div className="grid gap-2 rounded-lg border border-dashed border-muted p-4">
          <Label htmlFor="project" className="text-sm font-medium">
            Filter Document Vault by project
          </Label>
          <select
            id="project"
            value={selectedProject ?? ""}
            onChange={(event) => onProjectChange?.(event.target.value || undefined)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All projects</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}
interface ProjectOption {
  id: string;
  name: string;
}

function useProjectOptions() {
  return useQuery<{ projects: ProjectOption[] }>({
    queryKey: ["project-options"],
    queryFn: async () => {
      const response = await fetch("/api/projects/options");
      if (!response.ok) {
        throw new Error("Failed to load project options");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

function useDocumentVaultStats() {
  return useQuery<{ documentCount: number }>({
    queryKey: ["document-vault-stats"],
    queryFn: async () => {
      const response = await fetch("/api/documents/stats");
      if (!response.ok) {
        throw new Error("Failed to load document stats");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
interface RadioCardProps {
  id: string;
  value: string;
  title: string;
  description: string;
  cost: string;
  active: boolean;
}

function RadioCard({ id, value, title, description, cost, active }: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      )}
    >
      <RadioGroupItem value={value} id={id} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline">{cost}</Badge>
    </label>
  );
}

function toggleArrayValue<TField extends keyof QueryFormValues>(
  form: UseFormReturn<QueryFormValues>,
  field: TField,
  value: string
) {
  const current = form.getValues(field) as unknown as string[];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  form.setValue(field, next as QueryFormValues[TField], { shouldValidate: true });
}

function handleSaveTemplate(values: QueryFormValues) {
  try {
    const templates = JSON.parse(
      localStorage.getItem("acm-research:query-templates") ?? "[]"
    ) as QueryFormValues[];
    templates.unshift(values);
    localStorage.setItem(
      "acm-research:query-templates",
      JSON.stringify(templates.slice(0, 10))
    );
  } catch (error) {
    console.error("Failed to save template", error);
  }
}

interface AlertProps {
  status: "error" | "success";
  message: string;
}

function Alert({ status, message }: AlertProps) {
  const isError = status === "error";
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-md border px-4 py-3 text-sm",
        isError
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
      )}
    >
      {isError ? (
        <AlertTriangleIcon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  );
}
function createIcon(path: string) {
  return function Icon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        <path d={path} />
      </svg>
    );
  };
}

const SearchIcon = createIcon("M21 21l-4.35-4.35M18 10.5A7.5 7.5 0 1 1 3 10.5 7.5 7.5 0 0 1 18 10.5z");
const SparklesIcon = createIcon(
  "M12 3l1.5 3 3 .5-2.25 2.25.5 3L12 10.5 9.25 12.5l.5-3L7.5 6.5l3-.5L12 3zm6 8l.75 1.5 1.5.25-1.1 1.1.25 1.5L18 14.25l-1.2.85.25-1.5-1.05-1.1 1.5-.25L18 11zm-9 7l.75 1.5 1.5.25-1.1 1.1.25 1.5L9 20.25l-1.2.85.25-1.5-1.05-1.1 1.5-.25L9 18z"
);
const SaveIcon = createIcon("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8h-6v8");
const DollarSignIcon = createIcon("M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6");
const ClockIcon = createIcon("M12 6v6l4 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z");
const ChevronDownIcon = createIcon("M6 9l6 6 6-6");
const SpinnerIcon = createIcon("M12 3a9 9 0 1 0 9 9");
const AlertTriangleIcon = createIcon(
  "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01"
);
const CheckCircleIcon = createIcon("M9 12l2 2 4-4 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z");
const DatabaseIcon = createIcon(
  "M4 6c0-1.1 3.13-2 7-2s7 .9 7 2v12c0 1.1-3.13 2-7 2s-7-.9-7-2z M4 12c0 1.1 3.13 2 7 2s7-.9 7-2 M4 6v6 M18 6v6"
);
const FileTextIcon = createIcon(
  "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8"
);
const BrainIcon = createIcon(
  "M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3 3 3 0 0 1-2 2.82V14a4 4 0 0 1-4 4M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3 3 3 0 0 0 2 2.82V14a4 4 0 0 0 4 4"
);
