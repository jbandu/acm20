"use client";

import * as React from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResearcherDashboardProps {
  userId: string;
  className?: string;
}

export function ResearcherDashboard({ userId, className }: ResearcherDashboardProps) {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["dashboard", "overview", userId],
    queryFn: () => fetchJson<OverviewResponse>(`/api/dashboard/${userId}/overview`),
    staleTime: 1000 * 60,
  });

  const {
    data: activityPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["dashboard", "activity", userId],
    queryFn: ({ pageParam }) =>
      fetchJson<ActivityFeedResponse>(`/api/dashboard/${userId}/activity?cursor=${pageParam ?? ""}`),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: "",
    staleTime: 1000 * 30,
  });

  useRealtimeDigestRefresh(userId);

  const activity = React.useMemo(
    () => activityPages?.pages.flatMap((page) => page.items) ?? [],
    [activityPages]
  );

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1fr_1.5fr_1fr]", className)}>
      <LeftColumn overview={overview} loading={loadingOverview} />
      <CenterColumn overview={overview} digest={overview?.digest} />
      <RightColumn overview={overview} activity={activity} onLoadMore={() => fetchNextPage()} hasMore={Boolean(hasNextPage)} loadingMore={isFetchingNextPage} />
    </div>
  );
}

function LeftColumn({ overview, loading }: { overview?: OverviewResponse; loading: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Welcome back</CardTitle>
          {loading ? (
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-muted" />
          ) : overview ? (
            <p className="text-sm text-muted-foreground">{overview.user.name}</p>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4">
          <ProfileStat label="Queries this week" value={overview?.stats.queriesThisWeek ?? 0} />
          <ProfileStat label="Papers reviewed" value={overview?.stats.papersReviewed ?? 0} />
          <ProfileStat label="Knowledge contributed" value={overview?.stats.contributions ?? 0} />
          <div className="grid gap-2">
            <Button variant="outline" className="w-full">Start new query</Button>
            <Button variant="ghost" className="w-full">Invite collaborator</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <QuickLink label="Recent queries" href="/dashboard/history" />
          <QuickLink label="Knowledge graph" href="/dashboard/knowledge-graph" />
          <QuickLink label="Templates" href="/dashboard/templates" />
        </CardContent>
      </Card>
    </div>
  );
}

function CenterColumn({ overview, digest }: { overview?: OverviewResponse; digest?: DailyDigest }) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">New since last login</CardTitle>
          <p className="text-sm text-muted-foreground">
            Updated {overview?.digest.lastUpdated ? formatDistanceToNow(new Date(overview.digest.lastUpdated), { addSuffix: true }) : "recently"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {digest ? (
            <DigestSummary digest={digest} />
          ) : (
            <SkeletonBlock />
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Suggested questions</CardTitle>
          <Button variant="ghost" size="sm">Refresh</Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          {overview?.suggestions?.map((suggestion) => (
            <SuggestedQuestion key={suggestion.id} suggestion={suggestion} />
          )) ?? <SkeletonBlock />}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {overview?.recentActivity?.map((item) => (
            <ActivityItem key={item.id} item={item} />
          )) ?? <SkeletonBlock />}
        </CardContent>
      </Card>
    </div>
  );
}

function RightColumn({ overview, activity, onLoadMore, hasMore, loadingMore }: {
  overview?: OverviewResponse;
  activity: ActivityItemModel[];
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Upcoming deadlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {overview?.deadlines?.length ? (
            overview.deadlines.map((deadline) => (
              <DeadlineItem key={deadline.id} deadline={deadline} />
            ))
          ) : (
            <p className="rounded-md border border-dashed border-muted p-3 text-muted-foreground">
              No upcoming deadlines. Add one from the calendar.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Trending topics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {overview?.trendingTopics?.map((topic) => (
            <TrendingTopic key={topic.name} topic={topic} />
          )) ?? <SkeletonBlock />}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Team activity</CardTitle>
          <Badge variant="secondary">Live</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {activity.map((item) => (
            <ActivityItem key={`${item.id}-${item.timestamp}`} item={item} compact />
          ))}
          {hasMore ? (
            <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loadingMore} className="w-full">
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function DigestSummary({ digest }: { digest: DailyDigest }) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Articles" value={digest.totals.articles} />
        <StatCard label="Patents" value={digest.totals.patents} />
        <StatCard label="Clinical" value={digest.totals.clinicalTrials} />
        <StatCard label="New concepts" value={digest.totals.concepts} />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Top topics</p>
        <div className="flex flex-wrap gap-2">
          {digest.topics.map((topic) => (
            <Badge key={topic.name} variant="outline" className="text-xs">
              {topic.name}
            </Badge>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground">Breakthroughs</p>
        {digest.breakthroughs.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm"
          >
            <p className="font-medium text-primary">{item.title}</p>
            <p className="text-muted-foreground">{item.summary}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SuggestedQuestion({ suggestion }: { suggestion: SuggestedQuestionModel }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="flex w-full flex-col gap-2 rounded-lg border border-muted px-4 py-3 text-left transition-colors hover:border-primary/50"
    >
      <p className="text-sm font-medium text-foreground">{suggestion.question}</p>
      <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-[10px] uppercase">{suggestion.source}</Badge>
        <span className="text-[11px] text-muted-foreground">{suggestion.topic}</span>
      </div>
    </motion.button>
  );
}

function ActivityItem({ item, compact = false }: { item: ActivityItemModel; compact?: boolean }) {
  const timestamp = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
  return (
    <div className={cn("flex gap-3", compact ? "text-xs" : "text-sm")}
    >
      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
      <div className="flex-1">
        <p className="font-medium text-foreground">{item.title}</p>
        <p className="text-muted-foreground">{item.description}</p>
        <p className="text-[11px] text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  );
}

function DeadlineItem({ deadline }: { deadline: DeadlineModel }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-dashed border-muted px-3 py-2 text-sm">
      <div>
        <p className="font-medium text-foreground">{deadline.title}</p>
        <p className="text-xs text-muted-foreground">{deadline.type}</p>
      </div>
      <span className="text-xs font-semibold text-primary">
        {format(new Date(deadline.dueDate), "MMM d")}
      </span>
    </div>
  );
}

function TrendingTopic({ topic }: { topic: TrendingTopicModel }) {
  return (
    <div className="rounded-lg border border-muted px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-foreground">{topic.name}</p>
        <Badge variant="secondary" className="text-[10px] uppercase">{topic.momentum}%</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{topic.summary}</p>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-muted/60 bg-muted/30 p-3 text-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function QuickLink({ label, href }: { label: string; href: string }) {
  return (
    <Button variant="ghost" className="justify-start px-0 text-sm" asChild>
      <a href={href}>{label}</a>
    </Button>
  );
}

function SkeletonBlock() {
  return <div className="h-24 rounded-md border border-dashed border-muted bg-muted/20" />;
}

function useRealtimeDigestRefresh(userId: string) {
  const queryClient = useQueryClient();
  React.useEffect(() => {
    const source = new EventSource(`/api/dashboard/${userId}/events`);
    source.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview", userId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "activity", userId] });
    };
    source.onerror = () => {
      source.close();
    };
    return () => source.close();
  }, [queryClient, userId]);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}

interface OverviewResponse {
  user: {
    id: string;
    name: string;
    role: string;
  };
  stats: {
    queriesThisWeek: number;
    papersReviewed: number;
    contributions: number;
  };
  digest: DailyDigest;
  deadlines: DeadlineModel[];
  trendingTopics: TrendingTopicModel[];
  suggestions: SuggestedQuestionModel[];
  recentActivity: ActivityItemModel[];
}

interface DailyDigest {
  lastUpdated: string;
  totals: {
    articles: number;
    patents: number;
    clinicalTrials: number;
    concepts: number;
  };
  topics: Array<{ name: string; score: number }>;
  breakthroughs: Array<{ id: string; title: string; summary: string }>;
}

interface SuggestedQuestionModel {
  id: string;
  question: string;
  reason: string;
  source: string;
  topic: string;
}

interface ActivityFeedResponse {
  items: ActivityItemModel[];
  nextCursor?: string;
}

interface ActivityItemModel {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}

interface DeadlineModel {
  id: string;
  title: string;
  type: string;
  dueDate: string;
}

interface TrendingTopicModel {
  name: string;
  summary: string;
  momentum: number;
}
