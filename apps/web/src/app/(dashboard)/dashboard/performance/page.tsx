"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, RefreshCw, Star, Trophy, TrendingUp, TrendingDown,
  CheckCircle2, Target, Users,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Roles that are excluded from performance scoring (management-only roles)
const EXCLUDED_ROLES = new Set(["FOUNDER"]);

// Active working roles shown on the performance board
const ACTIVE_ROLES = new Set(["ADMIN", "STAFF", "TELECALLER", "ACCOUNTANT", "OFFICE_ASSISTANT", "MANAGER", "CARETAKER"]);

type RawStaffPerf = {
  userId: string;
  name: string;
  email: string;
  role: string;
  total: number;
  completed: number;
  onTime: number;
  completionRate: number;
  timelinessScore: number;
  efficiencyScore: number;
  avgMinutesTaken: number | null;
  score: number;
  grade: string;
  rank: number;
  isTopPerformer: boolean;
};

type StaffPerf = RawStaffPerf & {
  weightedScore: number;
  weightedGrade: string;
};

const PERIODS = [
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
];

// Score weights (out of 100 total)
const WEIGHT_RECURRING = 50;   // recurring discipline
const WEIGHT_ONETIME   = 30;   // one-time task execution
const WEIGHT_MGMT      = 20;   // management review (neutral default = 70%)

const MGMT_DEFAULT_PCT = 70;   // default management review score when no data available

/**
 * Compute the weighted score using the three components.
 * We use completionRate as a proxy for both recurring and one-time discipline
 * (the API doesn't currently separate them). Management review defaults to 70%.
 */
function computeWeightedScore(r: RawStaffPerf): number {
  const recurringPct = r.completionRate;     // 0–100
  const onetimePct   = r.completionRate;     // 0–100 (same proxy)
  const mgmtPct      = MGMT_DEFAULT_PCT;     // 0–100

  const weighted =
    (recurringPct * WEIGHT_RECURRING +
     onetimePct   * WEIGHT_ONETIME   +
     mgmtPct      * WEIGHT_MGMT) / 100;

  return Math.round(weighted);
}

function computeGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "Needs Improvement";
}

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
  if (score >= 60) return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
  return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
}

function gradeBadge(grade: string) {
  const colors: Record<string, string> = {
    "A+": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
    "A":  "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300",
    "B":  "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
    "C":  "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300",
    "Needs Improvement": "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300",
  };
  return colors[grade] || "bg-muted text-muted-foreground";
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs w-8 text-right font-medium">{value}%</span>
    </div>
  );
}

export default function PerformancePage() {
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [data, setData] = useState<StaffPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  const isAdminOrFounder = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/task-templates/performance-all?days=${days}`);
      const raw: RawStaffPerf[] = await res.json();
      if (!Array.isArray(raw)) { setData([]); return; }

      // Exclude FOUNDER and non-active roles; enrich with weighted scores
      const filtered = raw
        .filter((r) => !EXCLUDED_ROLES.has(r.role) && ACTIVE_ROLES.has(r.role))
        .map((r) => {
          const weightedScore = computeWeightedScore(r);
          return {
            ...r,
            weightedScore,
            weightedGrade: computeGrade(weightedScore),
          } as StaffPerf;
        })
        .sort((a, b) => b.weightedScore - a.weightedScore)
        .map((r, i) => ({ ...r, rank: i + 1, isTopPerformer: i === 0 && r.total > 0 }));

      if (isAdminOrFounder) {
        setData(filtered);
      } else {
        // Regular staff sees only their own card
        const own = filtered.filter((r) => r.userId === user?.id);
        setData(own);
      }
    } catch {
      toast({ title: "Failed to load performance data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [days, user?.id, isAdminOrFounder]);

  useEffect(() => { loadData(); }, [loadData]);

  const topPerformer = data.find((r) => r.isTopPerformer);
  const avgScore = data.length > 0
    ? Math.round(data.reduce((s, r) => s + r.weightedScore, 0) / data.length)
    : 0;
  const performingWell = data.filter((r) => r.weightedScore >= 70).length;
  const atRisk = data.filter((r) => r.weightedScore < 60).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-2xl font-bold">Staff Performance</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Weighted accountability scores — active working staff only
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[160px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Score formula */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium text-foreground mb-2">How the score is calculated</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="shrink-0 font-bold text-primary">{WEIGHT_RECURRING}%</span>
            <span>Recurring discipline — consistency with recurring task completion</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 font-bold text-primary">{WEIGHT_ONETIME}%</span>
            <span>One-time task execution — quality of assigned task completion</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="shrink-0 font-bold text-primary">{WEIGHT_MGMT}%</span>
            <span>Management review — quality score from admin review</span>
          </div>
        </div>
      </div>

      {/* Summary cards (admin/founder only) */}
      {isAdminOrFounder && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Active Staff</p>
              </div>
              <p className="text-2xl font-bold mt-1" data-testid="text-total-staff">{data.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
              <p className={`text-2xl font-bold mt-1 ${scoreColor(avgScore)}`} data-testid="text-avg-score">
                {avgScore}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-xs text-muted-foreground">Performing Well</p>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600" data-testid="text-above-avg">
                {performingWell}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <p className="text-xs text-muted-foreground">Needs Attention</p>
              </div>
              <p className="text-2xl font-bold mt-1 text-red-600" data-testid="text-at-risk">
                {atRisk}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top performer spotlight (admin/founder only) */}
      {isAdminOrFounder && topPerformer && topPerformer.total > 0 && (
        <Card className={`border-2 ${scoreBg(topPerformer.weightedScore)}`}>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xl font-bold" data-testid="text-top-performer-name">
                  {topPerformer.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {topPerformer.role.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className={`text-3xl font-bold ${scoreColor(topPerformer.weightedScore)}`}>
                    {topPerformer.weightedScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {topPerformer.completed}/{topPerformer.total}
                  </p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={`text-base px-3 py-1 ${gradeBadge(topPerformer.weightedGrade)}`}
                  >
                    {topPerformer.weightedGrade}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Grade</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground border rounded-lg">
          <Target className="h-10 w-10 opacity-25" />
          <p className="text-sm">No performance data for this period.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {isAdminOrFounder && <TableHead className="w-10 text-center">#</TableHead>}
                <TableHead>Staff Name</TableHead>
                {isAdminOrFounder && <TableHead>Role</TableHead>}
                <TableHead>Tasks Done</TableHead>
                <TableHead className="min-w-[130px]">Recurring (50%)</TableHead>
                <TableHead className="min-w-[130px]">One-time (30%)</TableHead>
                <TableHead className="min-w-[100px]">Review (20%)</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow
                  key={r.userId}
                  className={r.isTopPerformer && isAdminOrFounder ? "bg-yellow-50/30 dark:bg-yellow-950/10" : ""}
                  data-testid={`perf-row-${r.userId}`}
                >
                  {isAdminOrFounder && (
                    <TableCell className="text-center font-semibold text-muted-foreground">
                      {r.rank === 1 && r.total > 0
                        ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mx-auto" />
                        : r.rank}
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm" data-testid={`text-name-${r.userId}`}>
                        {r.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </TableCell>
                  {isAdminOrFounder && (
                    <TableCell>
                      <span className="text-xs text-muted-foreground capitalize">
                        {r.role.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{r.completed}</span>
                      <span className="text-muted-foreground">/{r.total}</span>
                    </div>
                  </TableCell>
                  {/* Recurring discipline bar */}
                  <TableCell>
                    <ScoreBar
                      value={r.completionRate}
                      color={r.completionRate >= 80 ? "bg-green-500" : r.completionRate >= 60 ? "bg-yellow-500" : "bg-red-500"}
                    />
                  </TableCell>
                  {/* One-time execution bar */}
                  <TableCell>
                    <ScoreBar
                      value={r.completionRate}
                      color={r.completionRate >= 80 ? "bg-green-500" : r.completionRate >= 60 ? "bg-yellow-500" : "bg-red-500"}
                    />
                  </TableCell>
                  {/* Management review */}
                  <TableCell>
                    <ScoreBar
                      value={MGMT_DEFAULT_PCT}
                      color="bg-[#5FA8A8]"
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-lg font-bold ${scoreColor(r.weightedScore)}`}
                      data-testid={`text-score-${r.userId}`}
                    >
                      {r.weightedScore}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={gradeBadge(r.weightedGrade)}
                      data-testid={`badge-grade-${r.userId}`}
                    >
                      {r.weightedGrade}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grade legend */}
      <div className="flex gap-5 text-xs text-muted-foreground pt-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span><span className="font-medium text-emerald-600">A+</span> = 90–100</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span><span className="font-medium text-green-600">A</span> = 80–89</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
          <span><span className="font-medium text-blue-600">B</span> = 70–79</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />
          <span><span className="font-medium text-yellow-600">C</span> = 60–69</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
          <span><span className="font-medium text-red-600">Needs Improvement</span> = below 60</span>
        </div>
      </div>
    </div>
  );
}
