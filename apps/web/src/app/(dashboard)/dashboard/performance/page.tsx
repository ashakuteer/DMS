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
  CheckCircle2, Clock, Target, Users,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type StaffPerf = {
  userId: string;
  name: string;
  email: string;
  role: string;
  rank: number;
  isTopPerformer: boolean;
  total: number;
  completed: number;
  onTime: number;
  completionRate: number;
  timelinessScore: number;
  efficiencyScore: number;
  avgMinutesTaken: number | null;
  score: number;
  grade: string;
};

const PERIODS = [
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
];

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function scoreBg(score: number) {
  if (score >= 90) return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
  if (score >= 70) return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900";
  return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
}

function gradeBadge(grade: string) {
  const colors: Record<string, string> = {
    A: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300",
    B: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
    C: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300",
    D: "bg-[#E6F4F1] text-[#5FA8A8] border-[#5FA8A8] dark:bg-[#5FA8A8]/20 dark:text-[#A8D5D1]",
    F: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300",
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
      const raw: StaffPerf[] = await res.json();
      if (!Array.isArray(raw)) { setData([]); return; }

      if (isAdminOrFounder) {
        setData(raw);
      } else {
        const own = raw.filter((r) => r.userId === user?.id);
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
    ? Math.round(data.reduce((s, r) => s + r.score, 0) / data.length)
    : 0;
  const aboveAvg = data.filter((r) => r.score >= 70).length;
  const atRisk = data.filter((r) => r.score < 70).length;

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
            Accountability scores based on task completion, timeliness and efficiency
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

      {/* Score formula info */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">How the score is calculated</p>
        <p>
          <span className="font-medium text-foreground">Score</span> = (Completion Rate + Timeliness Score + Efficiency Score) / 3
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span className="text-green-600">90%+ = Green</span>
          &nbsp;&nbsp;
          <span className="text-yellow-600">70–89% = Yellow</span>
          &nbsp;&nbsp;
          <span className="text-red-600">&lt;70% = Red</span>
        </p>
      </div>

      {/* Summary cards (admin/founder only) */}
      {isAdminOrFounder && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Staff</p>
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
              <p className={`text-2xl font-bold mt-1 ${scoreColor(avgScore)}`} data-testid="text-avg-score">{avgScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-xs text-muted-foreground">Performing Well</p>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600" data-testid="text-above-avg">{aboveAvg}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
              <p className="text-2xl font-bold mt-1 text-red-600" data-testid="text-at-risk">{atRisk}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top performer spotlight (admin/founder only) */}
      {isAdminOrFounder && topPerformer && topPerformer.total > 0 && (
        <Card className={`border-2 ${scoreBg(topPerformer.score)}`}>
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xl font-bold" data-testid="text-top-performer-name">{topPerformer.name}</p>
                <p className="text-xs text-muted-foreground">{topPerformer.role}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className={`text-3xl font-bold ${scoreColor(topPerformer.score)}`}>{topPerformer.score}%</p>
                  <p className="text-xs text-muted-foreground">Final Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{topPerformer.completed}/{topPerformer.total}</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{topPerformer.onTime}</p>
                  <p className="text-xs text-muted-foreground">On Time</p>
                </div>
                {topPerformer.avgMinutesTaken !== null && (
                  <div>
                    <p className="text-2xl font-bold">{topPerformer.avgMinutesTaken}m</p>
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                  </div>
                )}
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
                <TableHead>Tasks</TableHead>
                <TableHead className="min-w-[120px]">Completion</TableHead>
                <TableHead className="min-w-[120px]">Timeliness</TableHead>
                <TableHead className="min-w-[120px]">Efficiency</TableHead>
                <TableHead>Avg Time</TableHead>
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
                      <p className="font-medium text-sm" data-testid={`text-name-${r.userId}`}>{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </TableCell>
                  {isAdminOrFounder && (
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{r.role}</span>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{r.completed}</span>
                      <span className="text-muted-foreground">/{r.total}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ScoreBar
                      value={r.completionRate}
                      color={r.completionRate >= 90 ? "bg-green-500" : r.completionRate >= 70 ? "bg-yellow-500" : "bg-red-500"}
                    />
                  </TableCell>
                  <TableCell>
                    <ScoreBar
                      value={r.timelinessScore}
                      color={r.timelinessScore >= 90 ? "bg-green-500" : r.timelinessScore >= 70 ? "bg-yellow-500" : "bg-red-500"}
                    />
                  </TableCell>
                  <TableCell>
                    <ScoreBar
                      value={r.efficiencyScore}
                      color={r.efficiencyScore === 100 ? "bg-green-500" : r.efficiencyScore === 80 ? "bg-yellow-500" : "bg-red-500"}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {r.avgMinutesTaken !== null ? `${r.avgMinutesTaken}m` : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-lg font-bold ${scoreColor(r.score)}`} data-testid={`text-score-${r.userId}`}>
                      {r.score}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={gradeBadge(r.grade)} data-testid={`badge-grade-${r.userId}`}>
                      {r.grade}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 text-xs text-muted-foreground pt-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          <span><span className="font-medium text-green-600">Grade A</span> = 90%+ score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-yellow-500" />
          <span><span className="font-medium text-yellow-600">Grade B/C</span> = 50–89% score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
          <span><span className="font-medium text-red-600">Grade D/F</span> = below 50% score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Efficiency: &lt;30m = 100%, 30–60m = 80%, &gt;60m = 60%</span>
        </div>
      </div>
    </div>
  );
}
