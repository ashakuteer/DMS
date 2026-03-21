"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, CheckCircle2, Circle, Clock, AlertCircle,
  XCircle, Trophy, Flame, ChevronDown, ChevronRight, Square, SquareCheck,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: "Pending",     color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600 bg-blue-50 border-blue-200",       icon: Clock },
  COMPLETED:   { label: "Completed",   color: "text-green-600 bg-green-50 border-green-200",    icon: CheckCircle2 },
  OVERDUE:     { label: "Overdue",     color: "text-[#5FA8A8] bg-[#E6F4F1] border-[#5FA8A8]", icon: AlertCircle },
  MISSED:      { label: "Missed",      color: "text-red-600 bg-red-50 border-red-200",           icon: XCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-gray-500", MEDIUM: "text-blue-500", HIGH: "text-[#5FA8A8]", URGENT: "text-red-600",
};

const GRADE_CONFIG: Record<string, { color: string; label: string }> = {
  A: { color: "text-green-600", label: "Excellent" },
  B: { color: "text-blue-600", label: "Good" },
  C: { color: "text-yellow-600", label: "Average" },
  D: { color: "text-[#5FA8A8]", label: "Below Average" },
  F: { color: "text-red-600", label: "Poor" },
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  minutesTaken: number | null;
  notes: string | null;
}

interface AccountabilityScore {
  userId: string;
  days: number;
  assigned: number;
  completed: number;
  missed: number;
  onTime: number;
  score: number;
  grade: string;
  avgMinutesTaken: number | null;
}

interface Props { userId: string }

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyTasksView({ userId }: Props) {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [score, setScore] = useState<AccountabilityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Time tracking for completing a task
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [timeData, setTimeData] = useState({ startedAt: "", completedAt: "", minutesTaken: "" });

  // ─── Load ────────────────────────────────────────────────────────────────

  const loadTasks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ assignedToId: userId, limit: "100" });
    if (filterStatus === "ACTIVE") {
      params.set("status", "");
    } else if (filterStatus !== "ALL") {
      params.set("status", filterStatus);
    }

    fetchWithAuth(`/api/staff-tasks?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (d?.items) setTasks(d.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, filterStatus]);

  const loadScore = useCallback(() => {
    fetchWithAuth(`/api/task-templates/accountability/${userId}?days=30`)
      .then((r) => r.json())
      .then((d) => { if (d?.score !== undefined) setScore(d); })
      .catch(() => {});
  }, [userId]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { loadScore(); }, [loadScore]);

  // ─── Quick status update ──────────────────────────────────────────────────

  const quickUpdate = async (task: Task, newStatus: string) => {
    if (newStatus === "COMPLETED") {
      // Show time tracking form
      const now = new Date();
      const startStr = task.startedAt
        ? new Date(task.startedAt).toTimeString().slice(0, 5)
        : "";
      setTimeData({ startedAt: startStr, completedAt: now.toTimeString().slice(0, 5), minutesTaken: "" });
      setCompleteId(task.id);
      return;
    }
    await submitStatus(task.id, newStatus, {});
  };

  const submitStatus = async (id: string, status: string, extra: any) => {
    setActionId(id);
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) {
        toast({ title: status === "COMPLETED" ? "Task completed!" : "Status updated" });
        setCompleteId(null);
        loadTasks();
        loadScore();
      } else {
        toast({ title: "Update failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const toggleChecklistItem = async (task: Task, itemId: string) => {
    const checklist = ((task as any).checklist || []).map((item: any) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ checklist }),
      });
      if (res.ok) {
        loadTasks();
      }
    } catch { /* silent */ }
  };

  const handleCompleteSubmit = async (taskId: string) => {
    const extra: any = {};
    const today = new Date().toISOString().split("T")[0];
    if (timeData.startedAt) extra.startedAt = `${today}T${timeData.startedAt}:00`;
    if (timeData.completedAt) extra.completedAt = `${today}T${timeData.completedAt}:00`;
    if (timeData.minutesTaken) extra.minutesTaken = parseInt(timeData.minutesTaken);
    await submitStatus(taskId, "COMPLETED", extra);
  };

  // ─── Filter ───────────────────────────────────────────────────────────────

  const visibleTasks = filterStatus === "ACTIVE"
    ? tasks.filter((t) => ["PENDING", "IN_PROGRESS", "OVERDUE"].includes(t.status))
    : tasks;

  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const missed = tasks.filter((t) => t.status === "MISSED").length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Accountability Score */}
      {score && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Flame className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accountability Score (30 days)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold" data-testid="text-score">{score.score}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                    <span className={`text-xl font-bold ${GRADE_CONFIG[score.grade]?.color}`}>{score.grade}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{GRADE_CONFIG[score.grade]?.label}</p>
                </div>
              </div>
              <div className="flex gap-5 flex-wrap">
                {[
                  { label: "Assigned", val: score.assigned, color: "text-foreground" },
                  { label: "Completed", val: score.completed, color: "text-green-600" },
                  { label: "On Time", val: score.onTime, color: "text-blue-600" },
                  { label: "Missed", val: score.missed, color: "text-red-600" },
                  { label: "Avg Minutes", val: score.avgMinutesTaken !== null ? `${score.avgMinutesTaken}m` : "—", color: "text-muted-foreground" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-lg font-semibold ${color}`}>{val}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending",     count: pending,    color: "text-yellow-600" },
          { label: "In Progress", count: inProgress, color: "text-blue-600" },
          { label: "Completed",   count: completed,  color: "text-green-600" },
          { label: "Missed",      count: missed,     color: "text-red-600" },
        ].map(({ label, count, color }) => (
          <Card key={label}>
            <CardContent className="pt-3 pb-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { val: "ACTIVE", label: "Active" },
          { val: "ALL", label: "All" },
          { val: "COMPLETED", label: "Completed" },
          { val: "MISSED", label: "Missed" },
        ].map(({ val, label }) => (
          <Button key={val} variant={filterStatus === val ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(val)} data-testid={`filter-${val.toLowerCase()}`}>
            {label}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : visibleTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <Trophy className="h-10 w-10 opacity-30" />
          <p>{filterStatus === "ACTIVE" ? "All caught up! No active tasks." : "No tasks in this category."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTasks.map((task) => {
            const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusConf.icon;
            const isCompleting = completeId === task.id;
            const isActive = ["PENDING", "IN_PROGRESS", "OVERDUE"].includes(task.status);

            return (
              <Card key={task.id} className={task.status === "MISSED" ? "border-red-200 bg-red-50/30" : task.status === "COMPLETED" ? "opacity-75" : ""} data-testid={`my-task-${task.id}`}>
                <CardContent className="pt-3 pb-3">
                  {isCompleting ? (
                    // ─── Time tracking form ──────────────────────────────────
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <p className="font-medium">{task.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground ml-8">Log time taken (optional)</p>
                      <div className="ml-8 grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Start Time</Label>
                          <Input type="time" value={timeData.startedAt} onChange={(e) => setTimeData((p) => ({ ...p, startedAt: e.target.value }))} className="h-8 text-xs" data-testid="input-start-time" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">End Time</Label>
                          <Input type="time" value={timeData.completedAt} onChange={(e) => setTimeData((p) => ({ ...p, completedAt: e.target.value }))} className="h-8 text-xs" data-testid="input-end-time" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Minutes Taken</Label>
                          <Input type="number" value={timeData.minutesTaken} onChange={(e) => setTimeData((p) => ({ ...p, minutesTaken: e.target.value }))} placeholder="auto" className="h-8 text-xs" data-testid="input-minutes" />
                        </div>
                      </div>
                      <div className="ml-8 flex gap-2">
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleCompleteSubmit(task.id)} disabled={actionId === task.id} data-testid="button-confirm-complete">
                          {actionId === task.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                          Mark Complete
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCompleteId(null)} data-testid="button-cancel-complete">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Status toggle button */}
                        {isActive ? (
                          <button
                            onClick={() => quickUpdate(task, task.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED")}
                            disabled={actionId === task.id}
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-green-500 transition-colors"
                            data-testid={`checkbox-${task.id}`}
                          >
                            {actionId === task.id
                              ? <Loader2 className="h-5 w-5 animate-spin" />
                              : task.status === "IN_PROGRESS"
                                ? <Clock className="h-5 w-5 text-blue-500" />
                                : <Circle className="h-5 w-5" />
                            }
                          </button>
                        ) : (
                          <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${task.status === "COMPLETED" ? "text-green-500" : task.status === "MISSED" ? "text-red-500" : "text-[#5FA8A8]"}`} />
                        )}

                        <div className="min-w-0">
                          <p className={`font-medium text-sm ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`} data-testid={`text-task-title-${task.id}`}>
                            {task.title}
                          </p>
                          {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                            <span className="text-xs text-muted-foreground">{task.category.replace(/_/g, " ")}</span>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            )}
                            {task.minutesTaken && (
                              <span className="text-xs text-blue-600">⏱ {task.minutesTaken}m</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusConf.color}`} data-testid={`status-${task.id}`}>
                          {statusConf.label}
                        </span>
                        {isActive && (
                          <div className="flex gap-1">
                            {task.status === "PENDING" && (
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => quickUpdate(task, "IN_PROGRESS")} disabled={actionId === task.id} data-testid={`button-start-${task.id}`}>
                                Start
                              </Button>
                            )}
                            <Button size="sm" className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700" onClick={() => quickUpdate(task, "COMPLETED")} disabled={actionId === task.id} data-testid={`button-complete-${task.id}`}>
                              Complete
                            </Button>
                          </div>
                        )}
                        {/* Checklist expand toggle */}
                        {Array.isArray((task as any).checklist) && (task as any).checklist.length > 0 && (
                          <button
                            onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            data-testid={`button-expand-${task.id}`}
                          >
                            {expandedId === task.id
                              ? <ChevronDown className="h-4 w-4" />
                              : <ChevronRight className="h-4 w-4" />
                            }
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Checklist section (expanded) */}
                    {expandedId === task.id && Array.isArray((task as any).checklist) && (task as any).checklist.length > 0 && (
                      <div className="mt-3 pl-8 space-y-1.5 border-t pt-3">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Checklist</p>
                        {(task as any).checklist.map((item: any, idx: number) => (
                          <button
                            key={item.id || idx}
                            className="flex items-center gap-2.5 w-full text-left group"
                            onClick={() => toggleChecklistItem(task, item.id)}
                            data-testid={`checklist-toggle-${task.id}-${idx}`}
                          >
                            {item.done
                              ? <SquareCheck className="h-4 w-4 text-green-500 shrink-0" />
                              : <Square className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground" />
                            }
                            <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                          </button>
                        ))}
                        <p className="text-xs text-muted-foreground mt-1">
                          {(task as any).checklist.filter((i: any) => i.done).length}/{(task as any).checklist.length} done
                        </p>
                      </div>
                    )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
