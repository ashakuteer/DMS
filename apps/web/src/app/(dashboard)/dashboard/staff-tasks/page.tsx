"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListChecks,
  RefreshCw,
  Trash2,
  Edit,
  User,
  Users,
  BarChart3,
  Calendar,
  ClipboardList,
  Eye,
  ChevronLeft,
  ChevronRight,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tasksAssigned?: number;
  tasksCompleted?: number;
  tasksOverdue?: number;
  performanceScore?: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  assignedToId: string;
  createdById: string;
  linkedDonorId: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string; email: string };
  createdBy?: { id: string; name: string };
  linkedDonor?: { id: string; firstName: string; lastName: string | null; donorCode: string } | null;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

interface PerformanceData {
  userId: string;
  userName: string;
  year: number;
  monthly: Array<{
    month: number;
    monthName: string;
    score: number;
    tasksCompleted: number;
    tasksOnTime: number;
    tasksOverdue: number;
    followUpsDone: number;
    donorResponses: number;
  }>;
  overall: {
    averageScore: number;
    totalCompleted: number;
    totalOnTime: number;
    totalOverdue: number;
  };
}

interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
}

const CATEGORIES = [
  "GENERAL",
  "DONOR_FOLLOWUP",
  "DATA_ENTRY",
  "REPORTING",
  "COMMUNICATION",
  "EVENT",
  "FUNDRAISING",
  "OTHER",
];

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "General",
  DONOR_FOLLOWUP: "Donor Follow-up",
  DATA_ENTRY: "Data Entry",
  REPORTING: "Reporting",
  COMMUNICATION: "Communication",
  EVENT: "Event",
  FUNDRAISING: "Fundraising",
  OTHER: "Other",
};

export default function StaffTasksPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; role: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("tasks");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, pending: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [assignedToFilter, setAssignedToFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [donorSearch, setDonorSearch] = useState("");
  const [donorResults, setDonorResults] = useState<Donor[]>([]);
  const [donorSearchLoading, setDonorSearchLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToId: "",
    priority: "MEDIUM",
    category: "GENERAL",
    dueDate: "",
    linkedDonorId: "",
    notes: "",
  });

  const [performanceUserId, setPerformanceUserId] = useState("");
  const [performanceYear, setPerformanceYear] = useState(new Date().getFullYear());
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  useEffect(() => {
    const stored = authStorage.getUser();
    if (stored) setUser(stored);
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (assignedToFilter !== "ALL") params.set("assignedToId", assignedToFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      params.set("page", String(currentPage));
      params.set("limit", "20");

      const res = await fetchWithAuth(`/api/staff-tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || data.tasks || data.data || []);
        const total = data.total || data.totalCount || 0;
        setTotalPages(Math.max(1, Math.ceil(total / 20)));
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch tasks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, assignedToFilter, searchQuery, currentPage, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/staff-tasks/stats");
      if (res.ok) {
        const data = await res.json();
        setTaskStats({
          total: data.total || 0,
          pending: data.pending || 0,
          inProgress: data.inProgress || data.in_progress || 0,
          completed: data.completed || 0,
          overdue: data.overdue || 0,
        });
      }
    } catch {
      console.error("Failed to fetch stats");
    }
  }, []);

  const fetchStaffList = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await fetchWithAuth("/api/staff-tasks/staff-list");
      if (res.ok) {
        const data = await res.json();
        setStaffList(Array.isArray(data) ? data : data.staff || data.items || []);
      }
    } catch {
      console.error("Failed to fetch staff list");
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const fetchPerformance = useCallback(async (userId: string, year: number) => {
    if (!userId) return;
    setPerformanceLoading(true);
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/staff/${userId}/performance?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setPerformanceData(data);
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch performance data", variant: "destructive" });
    } finally {
      setPerformanceLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchTasks();
      const isAdminOrManager = user.role === "ADMIN" || user.role === "MANAGER";
      if (isAdminOrManager) {
        fetchStaffList();
      }
    }
  }, [user, fetchStats, fetchTasks, fetchStaffList]);

  useEffect(() => {
    if (performanceUserId && activeTab === "performance") {
      fetchPerformance(performanceUserId, performanceYear);
    }
  }, [performanceUserId, performanceYear, activeTab, fetchPerformance]);

  const searchDonors = async (query: string) => {
    setDonorSearchLoading(true);
    try {
      const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        const donorList = data.items || data.donors || data.data || data;
        setDonorResults(Array.isArray(donorList) ? donorList : []);
      }
    } catch {
      console.error("Error searching donors");
    } finally {
      setDonorSearchLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignedToId: "",
      priority: "MEDIUM",
      category: "GENERAL",
      dueDate: "",
      linkedDonorId: "",
      notes: "",
    });
    setSelectedDonor(null);
    setDonorSearch("");
    setDonorResults([]);
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.assignedToId) {
      toast({ title: "Error", description: "Please assign the task to a staff member", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, string | undefined> = {
        title: formData.title,
        description: formData.description || undefined,
        assignedToId: formData.assignedToId,
        priority: formData.priority,
        category: formData.category,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
      };
      if (selectedDonor) body.linkedDonorId = selectedDonor.id;

      const res = await fetchWithAuth("/api/staff-tasks", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: "Created", description: "Task created successfully" });
        setShowCreateDialog(false);
        resetForm();
        fetchTasks();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to create task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTask) return;
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, string | undefined> = {
        title: formData.title,
        description: formData.description || undefined,
        assignedToId: formData.assignedToId || undefined,
        priority: formData.priority,
        category: formData.category,
        dueDate: formData.dueDate || undefined,
        notes: formData.notes || undefined,
      };
      if (selectedDonor) body.linkedDonorId = selectedDonor.id;

      const res = await fetchWithAuth(`/api/staff-tasks/${selectedTask.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: "Updated", description: "Task updated successfully" });
        setShowEditDialog(false);
        resetForm();
        fetchTasks();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to update task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast({ title: "Updated", description: "Task status updated" });
        fetchTasks();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to update status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const res = await fetchWithAuth(`/api/staff-tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Task deleted successfully" });
        fetchTasks();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to delete task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const openEditDialog = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignedToId: task.assignedToId,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      linkedDonorId: task.linkedDonorId || "",
      notes: task.notes || "",
    });
    if (task.linkedDonor) {
      setSelectedDonor({
        id: task.linkedDonor.id,
        donorCode: task.linkedDonor.donorCode,
        firstName: task.linkedDonor.firstName,
        lastName: task.linkedDonor.lastName,
      });
    } else {
      setSelectedDonor(null);
    }
    setDonorSearch("");
    setDonorResults([]);
    setShowEditDialog(true);
  };

  const openDetailDialog = (task: Task) => {
    setSelectedTask(task);
    setShowDetailDialog(true);
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; label: string }> = {
      LOW: { className: "", label: "Low" },
      MEDIUM: { className: "", label: "Medium" },
      HIGH: { className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", label: "High" },
      URGENT: { className: "", label: "Urgent" },
    };
    const c = config[priority] || { className: "", label: priority };
    if (priority === "LOW") return <Badge variant="secondary" data-testid={`badge-priority-${priority}`}>{c.label}</Badge>;
    if (priority === "MEDIUM") return <Badge variant="default" data-testid={`badge-priority-${priority}`}>{c.label}</Badge>;
    if (priority === "URGENT") return <Badge variant="destructive" data-testid={`badge-priority-${priority}`}>{c.label}</Badge>;
    return <Badge className={c.className} data-testid={`badge-priority-${priority}`}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "PENDING") return <Badge variant="secondary" data-testid={`badge-status-${status}`}>Pending</Badge>;
    if (status === "IN_PROGRESS") return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" data-testid={`badge-status-${status}`}>In Progress</Badge>;
    if (status === "COMPLETED") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid={`badge-status-${status}`}>Completed</Badge>;
    if (status === "OVERDUE") return <Badge variant="destructive" data-testid={`badge-status-${status}`}>Overdue</Badge>;
    return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const renderTaskForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="task-title">Title *</Label>
        <Input
          id="task-title"
          placeholder="Task title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          data-testid="input-task-title"
        />
      </div>
      <div>
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          placeholder="Task description..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="input-task-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Assigned To *</Label>
          <Select value={formData.assignedToId} onValueChange={(v) => setFormData({ ...formData, assignedToId: v })}>
            <SelectTrigger data-testid="select-assigned-to">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              {staffList.map((s) => (
                <SelectItem key={s.id} value={s.id} data-testid={`option-staff-${s.id}`}>
                  {s.name}
                </SelectItem>
              ))}
              {user && !staffList.find((s) => s.id === user.id) && (
                <SelectItem value={user.id}>Me ({user.name})</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
            <SelectTrigger data-testid="select-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="task-due-date">Due Date</Label>
          <Input
            id="task-due-date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            data-testid="input-due-date"
          />
        </div>
      </div>
      <div>
        <Label>Linked Donor (optional)</Label>
        {selectedDonor ? (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedDonor.firstName} {selectedDonor.lastName || ""}</p>
              <p className="text-xs text-muted-foreground">{selectedDonor.donorCode}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedDonor(null); setDonorSearch(""); }} data-testid="button-clear-donor">
              Change
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search donors..."
                value={donorSearch}
                onChange={(e) => {
                  setDonorSearch(e.target.value);
                  if (e.target.value.length >= 2) searchDonors(e.target.value);
                  else setDonorResults([]);
                }}
                className="pl-9"
                data-testid="input-donor-search"
              />
            </div>
            {donorSearchLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {donorResults.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {donorResults.map((d) => (
                  <div
                    key={d.id}
                    className="p-2 hover-elevate cursor-pointer border-b last:border-b-0"
                    onClick={() => { setSelectedDonor(d); setDonorResults([]); setDonorSearch(""); }}
                    data-testid={`donor-option-${d.id}`}
                  >
                    <p className="text-sm font-medium">{d.firstName} {d.lastName || ""}</p>
                    <p className="text-xs text-muted-foreground">{d.donorCode}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea
          id="task-notes"
          placeholder="Additional notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          data-testid="input-task-notes"
        />
      </div>
    </div>
  );

  if (!user) return null;
  if (!canAccessModule(user.role, "staffTasks")) return <AccessDenied />;

  const isAdminOrManager = user.role === "ADMIN" || user.role === "MANAGER";
  const canCreate = hasPermission(user.role, "staffTasks", "create");
  const canDelete = hasPermission(user.role, "staffTasks", "delete");
  const canUpdate = hasPermission(user.role, "staffTasks", "update");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Staff & Tasks</h1>
          <p className="text-muted-foreground">Manage tasks, staff performance and tracking</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => { fetchTasks(); fetchStats(); if (isAdminOrManager) fetchStaffList(); }} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} data-testid="button-new-task">
              <Plus className="h-4 w-4 mr-1" /> New Task
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            <ClipboardList className="h-4 w-4 mr-1" /> Tasks
          </TabsTrigger>
          {isAdminOrManager && (
            <TabsTrigger value="staff" data-testid="tab-staff">
              <Users className="h-4 w-4 mr-1" /> Staff
            </TabsTrigger>
          )}
          {isAdminOrManager && (
            <TabsTrigger value="performance" data-testid="tab-performance">
              <BarChart3 className="h-4 w-4 mr-1" /> Performance
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                    <ListChecks className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-total">{taskStats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-pending">{taskStats.pending}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                    <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-in-progress">{taskStats.inProgress}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="stat-completed">{taskStats.completed}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]" data-testid="filter-priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priority</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[150px]" data-testid="filter-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Category</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAdminOrManager && (
                  <Select value={assignedToFilter} onValueChange={(v) => { setAssignedToFilter(v); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[160px]" data-testid="filter-assigned-to">
                      <SelectValue placeholder="Assigned To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Staff</SelectItem>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-9"
                    data-testid="input-search-tasks"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="pt-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[60px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground" data-testid="text-no-tasks">No tasks found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {canCreate ? "Create a new task to get started" : "No tasks are assigned to you yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow
                        key={task.id}
                        className="cursor-pointer"
                        onClick={() => openDetailDialog(task)}
                        data-testid={`row-task-${task.id}`}
                      >
                        <TableCell className="font-medium max-w-[200px] truncate" data-testid={`text-task-title-${task.id}`}>
                          {task.title}
                        </TableCell>
                        <TableCell data-testid={`text-task-assigned-${task.id}`}>
                          {task.assignedTo?.name || "—"}
                        </TableCell>
                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                        <TableCell>
                          {canUpdate ? (
                            <Select
                              value={task.status}
                              onValueChange={(v) => { handleStatusChange(task.id, v); }}
                            >
                              <SelectTrigger
                                className="w-[130px] border-0 p-0 h-auto"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`select-status-${task.id}`}
                              >
                                {getStatusBadge(task.status)}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getStatusBadge(task.status)
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {CATEGORY_LABELS[task.category] || task.category}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {task.dueDate ? format(new Date(task.dueDate), "dd MMM yyyy") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); openEditDialog(task); }}
                                data-testid={`button-edit-task-${task.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                data-testid={`button-delete-task-${task.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground" data-testid="text-page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {isAdminOrManager && (
          <TabsContent value="staff" className="space-y-4 mt-4">
            {staffLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[120px]" />
                          <Skeleton className="h-3 w-[80px]" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-[60%]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : staffList.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground" data-testid="text-no-staff">No staff members found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.map((staff) => (
                  <Card key={staff.id} data-testid={`card-staff-${staff.id}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {staff.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <CardTitle className="text-base" data-testid={`text-staff-name-${staff.id}`}>{staff.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      {staff.performanceScore !== undefined && staff.performanceScore !== null && (
                        <div className={`text-lg font-bold ${getScoreColor(staff.performanceScore)}`} data-testid={`text-score-${staff.id}`}>
                          {staff.performanceScore}%
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate" data-testid={`text-staff-email-${staff.id}`}>{staff.email}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-semibold" data-testid={`text-assigned-${staff.id}`}>{staff.tasksAssigned || 0}</p>
                          <p className="text-xs text-muted-foreground">Assigned</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-600 dark:text-green-400" data-testid={`text-completed-${staff.id}`}>{staff.tasksCompleted || 0}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-red-600 dark:text-red-400" data-testid={`text-overdue-${staff.id}`}>{staff.tasksOverdue || 0}</p>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setAssignedToFilter(staff.id);
                            setActiveTab("tasks");
                          }}
                          data-testid={`button-view-tasks-${staff.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" /> View Tasks
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setPerformanceUserId(staff.id);
                            setActiveTab("performance");
                          }}
                          data-testid={`button-view-performance-${staff.id}`}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" /> Performance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        {isAdminOrManager && (
          <TabsContent value="performance" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label>Staff Member</Label>
                    <Select value={performanceUserId} onValueChange={setPerformanceUserId}>
                      <SelectTrigger data-testid="select-performance-user">
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Select value={String(performanceYear)} onValueChange={(v) => setPerformanceYear(Number(v))}>
                      <SelectTrigger className="w-[100px]" data-testid="select-performance-year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026].map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!performanceUserId ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground" data-testid="text-select-staff">Select a staff member to view performance</p>
                </CardContent>
              </Card>
            ) : performanceLoading ? (
              <Card>
                <CardContent className="pt-4 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : performanceData ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className={`text-3xl font-bold ${getScoreColor(performanceData.overall.averageScore)}`} data-testid="text-avg-score">
                        {performanceData.overall.averageScore}%
                      </p>
                      <p className="text-xs text-muted-foreground">Average Score</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-3xl font-bold" data-testid="text-total-completed">{performanceData.overall.totalCompleted}</p>
                      <p className="text-xs text-muted-foreground">Tasks Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-ontime">{performanceData.overall.totalOnTime}</p>
                      <p className="text-xs text-muted-foreground">On Time</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-overdue">{performanceData.overall.totalOverdue}</p>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance - {performanceData.userName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {performanceData.monthly.map((m) => (
                      <div key={m.month} className="space-y-1" data-testid={`performance-month-${m.month}`}>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium w-20">{m.monthName}</span>
                          <div className="flex-1">
                            <Progress value={m.score} className="h-3" />
                          </div>
                          <span className={`text-sm font-semibold w-12 text-right ${getScoreColor(m.score)}`}>
                            {m.score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-20">
                          <span>Completed: {m.tasksCompleted}</span>
                          <span>On time: {m.tasksOnTime}</span>
                          <span>Overdue: {m.tasksOverdue}</span>
                          <span>Follow-ups: {m.followUpsDone}</span>
                          <span>Responses: {m.donorResponses}</span>
                        </div>
                      </div>
                    ))}
                    {performanceData.monthly.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No performance data available for this period</p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No performance data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Create a new task and assign it to a staff member</DialogDescription>
          </DialogHeader>
          {renderTaskForm(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting} data-testid="button-submit-create">
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          {renderTaskForm(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting} data-testid="button-submit-edit">
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle data-testid="text-detail-title">{selectedTask?.title}</DialogTitle>
            <DialogDescription>Task details</DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getPriorityBadge(selectedTask.priority)}
                {getStatusBadge(selectedTask.status)}
                <Badge variant="outline">{CATEGORY_LABELS[selectedTask.category] || selectedTask.category}</Badge>
              </div>
              {selectedTask.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Description</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-detail-description">{selectedTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Assigned To</p>
                  <p className="text-muted-foreground" data-testid="text-detail-assigned">{selectedTask.assignedTo?.name || "—"}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Created By</p>
                  <p className="text-muted-foreground" data-testid="text-detail-created-by">{selectedTask.createdBy?.name || "—"}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Due Date</p>
                  <p className="text-muted-foreground" data-testid="text-detail-due-date">
                    {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), "dd MMM yyyy") : "No due date"}
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Created</p>
                  <p className="text-muted-foreground" data-testid="text-detail-created-at">
                    {format(new Date(selectedTask.createdAt), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
              {selectedTask.linkedDonor && (
                <div>
                  <p className="text-sm font-medium mb-1">Linked Donor</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-detail-donor">
                    {selectedTask.linkedDonor.firstName} {selectedTask.linkedDonor.lastName || ""} ({selectedTask.linkedDonor.donorCode})
                  </p>
                </div>
              )}
              {selectedTask.notes && (
                <div>
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-detail-notes">{selectedTask.notes}</p>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {canUpdate && (
                  <Button
                    variant="outline"
                    onClick={() => { setShowDetailDialog(false); openEditDialog(selectedTask); }}
                    data-testid="button-detail-edit"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
                {canUpdate && selectedTask.status !== "COMPLETED" && (
                  <Button
                    onClick={() => { handleStatusChange(selectedTask.id, "COMPLETED"); setShowDetailDialog(false); }}
                    data-testid="button-detail-complete"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => { handleDelete(selectedTask.id); setShowDetailDialog(false); }}
                    data-testid="button-detail-delete"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}