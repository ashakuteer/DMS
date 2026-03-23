"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Repeat, ClipboardList } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { useToast } from "@/hooks/use-toast";
import { authStorage } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useTranslation } from "react-i18next";

import { useStaffTasks } from "./hooks/useStaffTasks";

import TaskStatsCards from "./components/TaskStatsCards";
import TaskFilters from "./components/TaskFilters";
import TaskTable from "./components/TaskTable";
import MyTasksView from "./components/MyTasksView";
import TemplatesTab from "./components/TemplatesTab";

import CreateTaskDialog from "./dialogs/CreateTaskDialog";
import EditTaskDialog from "./dialogs/EditTaskDialog";
import TaskDetailDialog from "./dialogs/TaskDetailDialog";

export default function StaffTasksPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const [selectedTask, setSelectedTask] = useState<any>(null);

  const {
    tasks,
    loading,
    fetchTasks,
    deleteTask,
    updateStatus,
  } = useStaffTasks();

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const [staffList, setStaffList] = useState<any[]>([]);

  const loadAdminData = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/staff-tasks/staff-list");
      const staffData = await res.json();
      if (Array.isArray(staffData)) setStaffList(staffData);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    const stored = authStorage.getUser();
    if (stored) {
      setUser(stored);
      if (stored.role === "FOUNDER" || stored.role === "ADMIN") {
        loadAdminData();
      }
    }
  }, [loadAdminData]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (priorityFilter !== "ALL") params.set("priority", priorityFilter);
    if (searchQuery) params.set("search", searchQuery);
    fetchTasks(params);
  }, [fetchTasks, statusFilter, priorityFilter, searchQuery]);

  if (!user) return null;

  if (!canAccessModule(user.role, "staffTasks")) {
    return <AccessDenied />;
  }

  const isAdminOrManager = user.role === "FOUNDER" || user.role === "ADMIN";
  const isFounder = user.role === "FOUNDER";

  const canCreate = hasPermission(user.role, "staffTasks", "create");
  const canDelete = hasPermission(user.role, "staffTasks", "delete");
  const canUpdate = hasPermission(user.role, "staffTasks", "update");

  const handleDelete = async (taskId: string) => {
    const ok = await deleteTask(taskId);
    if (ok) {
      toast({ title: "Deleted", description: "Task deleted" });
      fetchTasks();
    } else {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const openEditDialog = (task: any) => {
    setSelectedTask(task);
    setShowEditDialog(true);
  };

  const openDetailDialog = (task: any) => {
    setSelectedTask(task);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("staff_tasks.title")}</h1>
          <p className="text-muted-foreground">{t("staff_tasks.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchTasks()}
            data-testid="button-refresh-tasks"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-new-task">
              <Plus className="h-4 w-4 mr-1" /> {t("staff_tasks.new_task")}
            </Button>
          )}
        </div>
      </div>

      {/* ── Section A: Recurring Task Templates (Founder only) ── */}
      {isFounder && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recurring Task Templates</h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Define recurring task templates — tasks are auto-generated for your team based on the frequency you set.
          </p>
          <TemplatesTab staffList={staffList} />
          <Separator />
        </section>
      )}

      {/* ── Section B: Active Tasks ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Active Tasks</h2>
        </div>

        {isAdminOrManager ? (
          <>
            <TaskStatsCards stats={taskStats} />
            <TaskFilters
              status={statusFilter}
              setStatus={setStatusFilter}
              priority={priorityFilter}
              setPriority={setPriorityFilter}
              search={searchQuery}
              setSearch={setSearchQuery}
            />
            <TaskTable
              tasks={tasks}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onView={openDetailDialog}
              canUpdate={canUpdate}
              canDelete={canDelete}
              updateStatus={updateStatus}
            />
          </>
        ) : (
          <MyTasksView userId={user.id} />
        )}
      </section>

      <CreateTaskDialog
        open={showCreateDialog}
        setOpen={setShowCreateDialog}
        onSuccess={fetchTasks}
      />

      <EditTaskDialog
        open={showEditDialog}
        setOpen={setShowEditDialog}
        task={selectedTask}
        onSuccess={fetchTasks}
      />

      <TaskDetailDialog
        open={showDetailDialog}
        setOpen={setShowDetailDialog}
        task={selectedTask}
        onChecklistChange={() => fetchTasks()}
      />

    </div>
  );
}
