"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, XCircle, RefreshCw, Search, RotateCcw, AlertTriangle,
} from "lucide-react";

import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/access-denied";

const CATEGORIES = [
  { value: "ALL", label: "All Task Types" },
  { value: "GENERAL", label: "General" },
  { value: "DONOR_FOLLOWUP", label: "Donor Follow-up" },
  { value: "BENEFICIARY_UPDATE", label: "Beneficiary Update" },
  { value: "DATA_ENTRY", label: "Data Entry" },
  { value: "REPORTING", label: "Reporting" },
  { value: "OUTREACH", label: "Outreach" },
  { value: "ADMIN", label: "Admin" },
  { value: "FINANCE", label: "Finance" },
  { value: "FIELD_VISIT", label: "Field Visit" },
];

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysPassed(d: string | null | undefined) {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff;
}

function priorityColor(p: string) {
  if (p === "HIGH" || p === "URGENT") return "text-red-600 font-semibold";
  if (p === "MEDIUM") return "text-[#5FA8A8]";
  return "text-muted-foreground";
}

export default function MissedTasksPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (!user || (user.role !== "FOUNDER" && user.role !== "ADMIN")) {
    return <AccessDenied />;
  }

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "MISSED", limit: "500" });
      if (staffFilter !== "ALL") params.set("assignedToId", staffFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      const res = await fetchWithAuth(`/api/staff-tasks?${params}`);
      const data = await res.json();
      if (data?.items) setTasks(data.items);
    } catch {
      toast({ title: "Failed to load missed tasks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [staffFilter, categoryFilter]);

  useEffect(() => {
    fetchWithAuth("/api/staff-tasks/staff-list")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setStaffList(d); })
      .catch(() => {});
    // Auto-mark overdue tasks as missed on page load
    fetchWithAuth("/api/task-templates/mark-missed", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const restoreTask = async (taskId: string) => {
    setRestoringId(taskId);
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "PENDING" }),
      });
      if (res.ok) {
        toast({ title: "Task restored to Pending" });
        loadTasks();
      } else {
        toast({ title: "Failed to restore", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setRestoringId(null);
    }
  };

  const filtered = tasks.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.assignedTo?.name || "").toLowerCase().includes(q);
  });

  const byStaff = filtered.reduce<Record<string, { name: string; count: number }>>((acc, t) => {
    const id = t.assignedToId;
    if (!acc[id]) acc[id] = { name: t.assignedTo?.name || "Unknown", count: 0 };
    acc[id].count++;
    return acc;
  }, {});

  const topOffenders = Object.values(byStaff).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold">Missed Tasks</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Tasks not completed before the due date
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadTasks} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-1.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-red-600" data-testid="text-total-missed">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Missed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{Object.keys(byStaff).length}</p>
            <p className="text-xs text-muted-foreground">Staff Affected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-[#5FA8A8]">
              {tasks.filter((t) => t.dueDate && daysPassed(t.dueDate)! <= 3).length}
            </p>
            <p className="text-xs text-muted-foreground">Missed within 3 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold text-red-700">
              {tasks.filter((t) => t.dueDate && daysPassed(t.dueDate)! > 7).length}
            </p>
            <p className="text-xs text-muted-foreground">Missed &gt; 7 days ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Top offenders */}
      {topOffenders.length > 0 && (
        <div className="rounded-lg border p-4 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
          <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Staff with most missed tasks</p>
          <div className="flex flex-wrap gap-2">
            {topOffenders.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                {s.name} — {s.count} missed
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by task or staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            data-testid="input-search"
          />
        </div>
        <Select value={staffFilter} onValueChange={setStaffFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-staff-filter">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Staff</SelectItem>
            {staffList.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <SelectValue placeholder="All Task Types" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground border rounded-lg">
          <XCircle className="h-10 w-10 opacity-25" />
          <p className="text-sm">
            {tasks.length === 0 ? "No missed tasks — great job!" : "No tasks match your search."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[28%]">Task</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((task) => {
                const days = daysPassed(task.dueDate);
                const isOld = days !== null && days > 7;
                return (
                  <TableRow
                    key={task.id}
                    className="bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/60 dark:hover:bg-red-950/20"
                    data-testid={`missed-task-${task.id}`}
                  >
                    <TableCell>
                      <p className="font-medium text-sm text-red-800 dark:text-red-300">{task.title}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm" data-testid={`text-staff-${task.id}`}>
                        {task.assignedTo?.name || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {task.category?.replace(/_/g, " ") || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-red-600 font-medium" data-testid={`text-due-${task.id}`}>
                        {fmtDate(task.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-red-400 text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 gap-1"
                        data-testid={`badge-status-${task.id}`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Missed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {days !== null ? (
                        <Badge
                          variant="outline"
                          className={isOld
                            ? "border-red-500 text-red-700 bg-red-100 dark:bg-red-950 font-semibold"
                            : "border-[#5FA8A8] text-[#5FA8A8] bg-[#E6F4F1] dark:bg-[#5FA8A8]/20"
                          }
                          data-testid={`badge-days-${task.id}`}
                        >
                          {days} day{days !== 1 ? "s" : ""}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs ${priorityColor(task.priority)}`}>{task.priority}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => restoreTask(task.id)}
                        disabled={restoringId === task.id}
                        data-testid={`button-restore-${task.id}`}
                      >
                        {restoringId === task.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <RotateCcw className="h-3 w-3" />}
                        Restore
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
