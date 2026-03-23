"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, CheckSquare, Square, Clock, CheckCircle2, ListChecks, Calendar } from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type ChecklistItem = { id: string; text: string; done: boolean };

type Task = {
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
  checklist: ChecklistItem[] | null;
  assignedTo: { id: string; name: string } | null;
};

type TimeDialogState = {
  task: Task;
  pendingChecklist?: ChecklistItem[];
};

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All" },
];

function getDateRange(period: string): { from: Date; to: Date } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  if (period === "today") return { from: startOfDay(now), to: endOfDay(now) };
  if (period === "week") {
    const day = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: startOfDay(mon), to: endOfDay(sun) };
  }
  if (period === "month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  return { from: new Date(0), to: new Date(2099, 0, 1) };
}

function taskInPeriod(task: Task, period: string): boolean {
  if (period === "all") return true;
  const { from, to } = getDateRange(period);
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    return d >= from && d <= to;
  }
  return true;
}

function statusBadge(status: string) {
  if (status === "COMPLETED") return <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 text-xs">Completed</Badge>;
  if (status === "IN_PROGRESS") return <Badge className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 text-xs">In Progress</Badge>;
  if (status === "MISSED") return <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">Missed</Badge>;
  return <Badge variant="outline" className="text-xs">Pending</Badge>;
}

function fmtDueDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fmtTime(mins: number | null) {
  if (mins === null || mins === undefined) return null;
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DailyChecklistPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const isAdmin = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [togglingItem, setTogglingItem] = useState<string | null>(null);

  // Time-entry dialog state
  const [timeDialog, setTimeDialog] = useState<TimeDialogState | null>(null);
  const [timeInput, setTimeInput] = useState("");
  const [submittingTime, setSubmittingTime] = useState(false);

  const generateToday = useCallback(async () => {
    try {
      await fetchWithAuth("/api/task-templates/generate-today", { method: "POST" });
    } catch {
      // Silent
    }
  }, []);

  const autoMarkMissed = useCallback(async () => {
    try {
      await fetchWithAuth("/api/task-templates/mark-missed", { method: "POST" });
    } catch {
      // Silent
    }
  }, []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "300", isRecurring: "true" });
      if (!isAdmin) params.set("assignedToId", user?.id || "");
      const res = await fetchWithAuth(`/api/staff-tasks?${params}`);
      const data = await res.json();
      if (data?.items) setTasks(data.items);
    } catch {
      toast({ title: "Failed to load tasks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user?.id]);

  useEffect(() => {
    generateToday()
      .then(() => autoMarkMissed())
      .then(() => loadTasks());
  }, [generateToday, autoMarkMissed, loadTasks]);

  // ─── Open time dialog ────────────────────────────────────────────────────

  const openTimeDialog = (task: Task, pendingChecklist?: ChecklistItem[]) => {
    setTimeInput("");
    setTimeDialog({ task, pendingChecklist });
  };

  // ─── Submit time and mark complete ───────────────────────────────────────

  const submitTimeDialog = async () => {
    if (!timeDialog) return;
    const { task, pendingChecklist } = timeDialog;
    const mins = parseInt(timeInput, 10);
    if (!timeInput || isNaN(mins) || mins < 0) {
      toast({ title: "Please enter a valid number of minutes", variant: "destructive" });
      return;
    }
    setSubmittingTime(true);
    const now = new Date().toISOString();
    const body: any = {
      status: "COMPLETED",
      completedAt: now,
      minutesTaken: mins,
      startedAt: task.startedAt || now,
    };
    if (pendingChecklist) {
      body.checklist = pendingChecklist;
    }
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, ...body, checklist: pendingChecklist ?? t.checklist }
              : t
          )
        );
        toast({ title: `Task completed in ${fmtTime(mins)}!` });
        setTimeDialog(null);
      } else {
        toast({ title: "Failed to mark complete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSubmittingTime(false);
    }
  };

  // ─── Un-complete (no time dialog needed) ────────────────────────────────

  const unComplete = async (task: Task) => {
    const body: any = { status: "PENDING", completedAt: null, minutesTaken: null, startedAt: null };
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(body) });
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, ...body } : t));
        toast({ title: "Task marked as not complete" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  // ─── Toggle checklist item ───────────────────────────────────────────────

  const toggleItem = async (task: Task, itemId: string) => {
    if (task.status === "MISSED") return;
    const key = `${task.id}-${itemId}`;
    setTogglingItem(key);

    const checklist = (task.checklist || []).map((ci) =>
      ci.id === itemId ? { ...ci, done: !ci.done } : ci
    );
    const doneCount = checklist.filter((c) => c.done).length;
    const allDone = doneCount === checklist.length && checklist.length > 0;
    const hadAnyDone = (task.checklist || []).some((c) => c.done);
    const now = new Date().toISOString();

    if (allDone) {
      // All items done → prompt for time
      setTogglingItem(null);
      // Optimistically update checklist items display first
      setTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, checklist } : t)
      );
      openTimeDialog(task, checklist);
      return;
    }

    const body: any = { checklist };
    if (!hadAnyDone && doneCount === 1) {
      body.startedAt = now;
      body.status = "IN_PROGRESS";
    } else if (doneCount > 0) {
      body.status = "IN_PROGRESS";
      if (task.status === "COMPLETED") {
        body.completedAt = null;
        body.minutesTaken = null;
      }
    } else {
      body.status = "PENDING";
      body.completedAt = null;
      body.minutesTaken = null;
    }

    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, checklist, status: body.status || t.status, startedAt: body.startedAt || t.startedAt, completedAt: body.completedAt ?? t.completedAt, minutesTaken: body.minutesTaken ?? t.minutesTaken }
              : t
          )
        );
      } else {
        toast({ title: "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setTogglingItem(null);
    }
  };

  const visibleTasks = tasks.filter((t) => taskInPeriod(t, period));

  const grouped = isAdmin
    ? visibleTasks.reduce<Record<string, { name: string; tasks: Task[] }>>((acc, t) => {
        const id = t.assignedTo?.id || "unassigned";
        if (!acc[id]) acc[id] = { name: t.assignedTo?.name || "Unassigned", tasks: [] };
        acc[id].tasks.push(t);
        return acc;
      }, {})
    : { [user?.id || "me"]: { name: user?.name || "My Tasks", tasks: visibleTasks } };

  const totalTasks = visibleTasks.length;
  const completedTasks = visibleTasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = visibleTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const overallPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* Time-entry dialog */}
      <Dialog open={!!timeDialog} onOpenChange={(open) => { if (!open) setTimeDialog(null); }}>
        <DialogContent className="sm:max-w-sm" data-testid="dialog-time-entry">
          <DialogHeader>
            <DialogTitle>Mark Task Complete</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{timeDialog?.task.title}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Time taken (minutes)</label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 30"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitTimeDialog(); }}
                autoFocus
                data-testid="input-time-taken"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeDialog(null)} disabled={submittingTime}>
              Cancel
            </Button>
            <Button onClick={submitTimeDialog} disabled={submittingTime} data-testid="button-confirm-complete">
              {submittingTime ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Daily Checklist</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin ? "Track all staff task completion" : "Your tasks — tick off as you complete them"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]" data-testid="select-period">
              <Calendar className="h-4 w-4 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { autoMarkMissed().then(() => loadTasks()); }} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      {!loading && totalTasks > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex gap-4 text-sm">
                <span><span className="font-semibold">{completedTasks}</span> <span className="text-muted-foreground">completed</span></span>
                {inProgressTasks > 0 && <span><span className="font-semibold">{inProgressTasks}</span> <span className="text-muted-foreground">in progress</span></span>}
                <span><span className="font-semibold">{totalTasks - completedTasks}</span> <span className="text-muted-foreground">remaining</span></span>
              </div>
              <span className={`text-sm font-semibold ${overallPct === 100 ? "text-green-600" : overallPct >= 50 ? "text-blue-600" : "text-muted-foreground"}`}>
                {overallPct}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${overallPct === 100 ? "bg-green-500" : "bg-primary"}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : totalTasks === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground border rounded-lg">
          <CheckCircle2 className="h-10 w-10 opacity-25" />
          <p className="text-sm">No tasks for this period.</p>
          <p className="text-xs">Recurring tasks from templates will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([staffId, { name, tasks: staffTasks }]) => {
            const done = staffTasks.filter((t) => t.status === "COMPLETED").length;
            const pct = staffTasks.length > 0 ? Math.round((done / staffTasks.length) * 100) : 0;
            return (
              <div key={staffId} className="space-y-3">
                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-base">{name}</h2>
                    <span className="text-sm text-muted-foreground">{done}/{staffTasks.length} done ({pct}%)</span>
                  </div>
                )}
                <div className="space-y-3">
                  {staffTasks.map((task) => {
                    const checklist = task.checklist || [];
                    const hasChecklist = checklist.length > 0;
                    const doneCnt = checklist.filter((c) => c.done).length;
                    const taskPct = hasChecklist ? Math.round((doneCnt / checklist.length) * 100) : (task.status === "COMPLETED" ? 100 : 0);
                    const isCompleted = task.status === "COMPLETED";
                    const isMissed = task.status === "MISSED";

                    return (
                      <Card
                        key={task.id}
                        className={`transition-all ${isCompleted ? "opacity-75 border-green-200 dark:border-green-900 bg-green-50/20 dark:bg-green-950/10" : isMissed ? "border-red-200 bg-red-50/20" : ""}`}
                        data-testid={`checklist-task-${task.id}`}
                      >
                        <CardHeader className="pb-0 pt-4 px-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">

                              {/* Checkbox for tasks without checklist */}
                              {!hasChecklist && (
                                <button
                                  onClick={() => isCompleted ? unComplete(task) : openTimeDialog(task)}
                                  disabled={isMissed}
                                  title={isCompleted ? "Click to mark as not complete" : "Click to mark as complete"}
                                  className={`mt-0.5 shrink-0 disabled:opacity-50 transition-colors ${isCompleted ? "text-green-600 hover:text-muted-foreground" : "text-muted-foreground hover:text-green-600"}`}
                                  data-testid={`checkbox-task-${task.id}`}
                                >
                                  {isCompleted
                                    ? <CheckSquare className="h-5 w-5" />
                                    : <Square className="h-5 w-5" />}
                                </button>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                                )}
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {statusBadge(task.status)}
                                  {isAdmin && task.assignedTo && (
                                    <span className="text-xs text-muted-foreground">{task.assignedTo.name}</span>
                                  )}
                                  {task.dueDate && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {fmtDueDate(task.dueDate)}
                                    </span>
                                  )}
                                  {isCompleted && task.minutesTaken !== null && (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                      <Clock className="h-3 w-3" />
                                      {fmtTime(task.minutesTaken)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Un-complete button for checklist tasks */}
                            {hasChecklist && isCompleted && (
                              <button
                                onClick={() => unComplete(task)}
                                title="Click to mark as not complete"
                                className="mt-0.5 shrink-0 text-green-600 hover:text-muted-foreground transition-colors"
                                data-testid={`uncomplete-task-${task.id}`}
                              >
                                <CheckSquare className="h-5 w-5" />
                              </button>
                            )}

                            {hasChecklist && !isCompleted && (
                              <span className={`text-sm font-semibold shrink-0 ${taskPct === 100 ? "text-green-600" : "text-muted-foreground"}`}>
                                {doneCnt}/{checklist.length}
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          {hasChecklist && (
                            <div className="mt-3">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${taskPct === 100 ? "bg-green-500" : "bg-primary"}`}
                                  style={{ width: `${taskPct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </CardHeader>

                        {/* Checklist items */}
                        {hasChecklist && !isCompleted && (
                          <CardContent className="px-4 pt-3 pb-4 space-y-2">
                            {checklist.map((item) => {
                              const toggleKey = `${task.id}-${item.id}`;
                              const toggling = togglingItem === toggleKey;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => toggleItem(task, item.id)}
                                  disabled={toggling || isMissed}
                                  className="flex items-center gap-3 w-full text-left group disabled:opacity-60"
                                  data-testid={`checkbox-item-${item.id}`}
                                >
                                  {toggling ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                                  ) : item.done ? (
                                    <CheckSquare className="h-4 w-4 text-green-600 shrink-0" />
                                  ) : (
                                    <Square className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                  )}
                                  <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : "group-hover:text-primary"}`}>
                                    {item.text}
                                  </span>
                                </button>
                              );
                            })}
                          </CardContent>
                        )}

                        {/* Completed time display */}
                        {isCompleted && task.minutesTaken !== null && (
                          <CardContent className="px-4 pt-0 pb-3">
                            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Completed in {fmtTime(task.minutesTaken)}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
