"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, RefreshCw, User, Users, Loader2, CheckCircle2, Circle,
  Clock, XCircle, AlertCircle, Search, Pencil, Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/access-denied";

import CreateTaskDialog from "../staff-tasks/dialogs/CreateTaskDialog";
import EditTaskDialog from "../staff-tasks/dialogs/EditTaskDialog";
import TaskDetailDialog from "../staff-tasks/dialogs/TaskDetailDialog";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Pending",     color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700 border-green-200" },
  MISSED:      { label: "Missed",      color: "bg-red-100 text-red-700 border-red-200" },
  OVERDUE:     { label: "Overdue",     color: "bg-orange-100 text-orange-700 border-orange-200" },
};

const PRIORITY_DOT: Record<string, string> = {
  LOW: "bg-green-500", MEDIUM: "bg-yellow-500", HIGH: "bg-orange-500", CRITICAL: "bg-red-500",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
      {cfg.label}
    </Badge>
  );
}

export default function FounderTasksPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [personalTasks, setPersonalTasks] = useState<any[]>([]);
  const [staffTasks, setStaffTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);

  const [personalSearch, setPersonalSearch] = useState("");
  const [personalStatus, setPersonalStatus] = useState("ALL");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffStatus, setStaffStatus] = useState("ALL");
  const [staffPersonFilter, setStaffPersonFilter] = useState("ALL");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [createMode, setCreateMode] = useState<"personal" | "staff">("personal");

  if (!user || user.role !== "FOUNDER") {
    return <AccessDenied />;
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [personalRes, staffRes, staffListRes] = await Promise.all([
        fetchWithAuth(`/api/staff-tasks?assignedToId=${user.id}&limit=200`),
        fetchWithAuth(`/api/staff-tasks?createdById=${user.id}&limit=500`),
        fetchWithAuth("/api/staff-tasks/staff-list"),
      ]);
      const [personalData, staffData, staffListData] = await Promise.all([
        personalRes.json(),
        staffRes.json(),
        staffListRes.json(),
      ]);

      if (personalData?.items) setPersonalTasks(personalData.items);
      if (staffData?.items) {
        const notSelf = staffData.items.filter((t: any) => t.assignedToId !== user.id);
        setStaffTasks(notSelf);
      }
      if (Array.isArray(staffListData)) setStaffList(staffListData);
    } catch {
      toast({ title: "Failed to load tasks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const openEdit = (task: any) => { setSelectedTask(task); setShowEditDialog(true); };
  const openDetail = (task: any) => { setSelectedTask(task); setShowDetailDialog(true); };

  const openCreate = (mode: "personal" | "staff") => {
    setCreateMode(mode);
    setShowCreateDialog(true);
  };

  const filteredPersonal = personalTasks.filter((t) => {
    if (personalStatus !== "ALL" && t.status !== personalStatus) return false;
    if (personalSearch) {
      const q = personalSearch.toLowerCase();
      if (!t.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredStaff = staffTasks.filter((t) => {
    if (staffStatus !== "ALL" && t.status !== staffStatus) return false;
    if (staffPersonFilter !== "ALL" && t.assignedToId !== staffPersonFilter) return false;
    if (staffSearch) {
      const q = staffSearch.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.assignedTo?.name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const personalStats = {
    total: personalTasks.length,
    completed: personalTasks.filter((t) => t.status === "COMPLETED").length,
    pending: personalTasks.filter((t) => t.status === "PENDING").length,
    inProgress: personalTasks.filter((t) => t.status === "IN_PROGRESS").length,
  };

  const staffStats = {
    total: staffTasks.length,
    completed: staffTasks.filter((t) => t.status === "COMPLETED").length,
    pending: staffTasks.filter((t) => t.status === "PENDING").length,
    inProgress: staffTasks.filter((t) => t.status === "IN_PROGRESS").length,
  };

  const TaskRow = ({ task }: { task: any }) => (
    <TableRow key={task.id} data-testid={`task-row-${task.id}`}>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[280px]">{task.description}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || "bg-gray-400"}`} />
          <span className="text-xs">{task.priority}</span>
        </div>
      </TableCell>
      <TableCell><StatusBadge status={task.status} /></TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">{fmtDate(task.dueDate)}</span>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => openDetail(task)}
            data-testid={`button-view-${task.id}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => openEdit(task)}
            data-testid={`button-edit-${task.id}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Founder Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Your personal tasks and tasks you've assigned to staff
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadData}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── Section A: My Personal Tasks ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">My Personal Tasks</h2>
              </div>
              <Button
                size="sm"
                onClick={() => openCreate("personal")}
                data-testid="button-create-personal-task"
              >
                <Plus className="h-4 w-4 mr-1" /> New Personal Task
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: personalStats.total, color: "text-foreground" },
                { label: "Pending", value: personalStats.pending, color: "text-yellow-600" },
                { label: "In Progress", value: personalStats.inProgress, color: "text-blue-600" },
                { label: "Completed", value: personalStats.completed, color: "text-green-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-3 pb-3">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={personalSearch}
                  onChange={(e) => setPersonalSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-personal-search"
                />
              </div>
              <Select value={personalStatus} onValueChange={setPersonalStatus}>
                <SelectTrigger className="w-[150px]" data-testid="select-personal-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {filteredPersonal.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground border rounded-lg">
                <CheckCircle2 className="h-10 w-10 opacity-25" />
                <p className="text-sm">
                  {personalTasks.length === 0
                    ? "No personal tasks yet. Create one to get started."
                    : "No tasks match your search."}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Task</TableHead>
                      <TableHead className="w-[100px]">Priority</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[130px]">Due Date</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonal.map((task) => <TaskRow key={task.id} task={task} />)}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          {/* ── Section B: Tasks Assigned to Staff ── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Tasks Assigned to Staff</h2>
              </div>
              <Button
                size="sm"
                onClick={() => openCreate("staff")}
                data-testid="button-assign-staff-task"
              >
                <Plus className="h-4 w-4 mr-1" /> Assign Task to Staff
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Assigned", value: staffStats.total, color: "text-foreground" },
                { label: "Pending", value: staffStats.pending, color: "text-yellow-600" },
                { label: "In Progress", value: staffStats.inProgress, color: "text-blue-600" },
                { label: "Completed", value: staffStats.completed, color: "text-green-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-3 pb-3">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by task or staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="pl-8"
                  data-testid="input-staff-search"
                />
              </div>
              <Select value={staffStatus} onValueChange={setStaffStatus}>
                <SelectTrigger className="w-[150px]" data-testid="select-staff-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="MISSED">Missed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={staffPersonFilter} onValueChange={setStaffPersonFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-staff-member">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Staff</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {filteredStaff.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground border rounded-lg">
                <Users className="h-10 w-10 opacity-25" />
                <p className="text-sm">
                  {staffTasks.length === 0
                    ? "No tasks assigned to staff yet."
                    : "No tasks match your search."}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Task</TableHead>
                      <TableHead className="w-[140px]">Assigned To</TableHead>
                      <TableHead className="w-[100px]">Priority</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[130px]">Due Date</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((task) => (
                      <TableRow key={task.id} data-testid={`staff-task-row-${task.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[280px]">{task.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm" data-testid={`text-assigned-${task.id}`}>
                            {task.assignedTo?.name || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || "bg-gray-400"}`} />
                            <span className="text-xs">{task.priority}</span>
                          </div>
                        </TableCell>
                        <TableCell><StatusBadge status={task.status} /></TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{fmtDate(task.dueDate)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => openDetail(task)}
                              data-testid={`button-view-${task.id}`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => openEdit(task)}
                              data-testid={`button-edit-${task.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      )}

      <CreateTaskDialog
        open={showCreateDialog}
        setOpen={setShowCreateDialog}
        onSuccess={loadData}
      />

      <EditTaskDialog
        open={showEditDialog}
        setOpen={setShowEditDialog}
        task={selectedTask}
        onSuccess={loadData}
      />

      <TaskDetailDialog
        open={showDetailDialog}
        setOpen={setShowDetailDialog}
        task={selectedTask}
        onChecklistChange={loadData}
      />

    </div>
  );
}
