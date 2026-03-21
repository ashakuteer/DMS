"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, ClipboardList, Users, BarChart3, Repeat, CheckSquare } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { authStorage } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useTranslation } from "react-i18next";

import { useStaffTasks } from "./hooks/useStaffTasks";

import TaskStatsCards from "./components/TaskStatsCards";
import TaskFilters from "./components/TaskFilters";
import TaskTable from "./components/TaskTable";
import StaffCards from "./components/StaffCards";
import PerformanceView from "./components/PerformanceView";
import TemplatesTab from "./components/TemplatesTab";
import MyTasksView from "./components/MyTasksView";

import CreateTaskDialog from "./dialogs/CreateTaskDialog";
import EditTaskDialog from "./dialogs/EditTaskDialog";
import TaskDetailDialog from "./dialogs/TaskDetailDialog";

export default function StaffTasksPage() {

const { t } = useTranslation();
const { toast } = useToast();

const [user, setUser] = useState<any>(null);
const [activeTab, setActiveTab] = useState("my-tasks");

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
totalPages,
fetchTasks,
deleteTask,
updateStatus
} = useStaffTasks();

const [taskStats, setTaskStats] = useState({
total: 0,
pending: 0,
inProgress: 0,
completed: 0
});

const [staffList, setStaffList] = useState<any[]>([]);
const [performanceData, setPerformanceData] = useState<any>(null);

useEffect(() => {
const stored = authStorage.getUser();
if (stored) {
  setUser(stored);
  // Admin/Founder default to All Tasks view; Staff default to My Tasks
  if (stored.role === "FOUNDER" || stored.role === "ADMIN") {
    setActiveTab("tasks");
  } else {
    setActiveTab("my-tasks");
  }
}
}, []);

useEffect(() => {
fetchTasks();
}, [fetchTasks]);

if (!user) return null;

if (!canAccessModule(user.role, "staffTasks")) {
return <AccessDenied />;
}

const isAdminOrManager = user.role === "FOUNDER" || user.role === "ADMIN";

const canCreate = hasPermission(user.role, "staffTasks", "create");
const canDelete = hasPermission(user.role, "staffTasks", "delete");
const canUpdate = hasPermission(user.role, "staffTasks", "update");

const handleDelete = async (taskId: string) => {
const ok = await deleteTask(taskId);

if (ok) {
  toast({ title: "Deleted", description: "Task deleted" });
  fetchTasks();
} else {
  toast({
    title: "Error",
    description: "Failed to delete",
    variant: "destructive"
  });
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

return ( <div className="p-6 space-y-6 max-w-7xl mx-auto">

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
        <RefreshCw className="h-4 w-4"/>
      </Button>

      {canCreate && (
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-new-task">
          <Plus className="h-4 w-4 mr-1"/> {t("staff_tasks.new_task")}
        </Button>
      )}

    </div>

  </div>

  <Tabs value={activeTab} onValueChange={setActiveTab}>

    <TabsList className="flex-wrap h-auto">

      <TabsTrigger value="my-tasks" data-testid="tab-my-tasks">
        <CheckSquare className="h-4 w-4 mr-1"/>
        My Tasks
      </TabsTrigger>

      {isAdminOrManager && (
        <TabsTrigger value="tasks" data-testid="tab-all-tasks">
          <ClipboardList className="h-4 w-4 mr-1"/>
          {t("staff_tasks.tab_tasks")}
        </TabsTrigger>
      )}

      {isAdminOrManager && (
        <TabsTrigger value="staff" data-testid="tab-staff">
          <Users className="h-4 w-4 mr-1"/>
          {t("staff_tasks.tab_staff")}
        </TabsTrigger>
      )}

      {isAdminOrManager && (
        <TabsTrigger value="performance" data-testid="tab-performance">
          <BarChart3 className="h-4 w-4 mr-1"/>
          {t("staff_tasks.tab_performance")}
        </TabsTrigger>
      )}

      {isAdminOrManager && (
        <TabsTrigger value="templates" data-testid="tab-templates">
          <Repeat className="h-4 w-4 mr-1"/>
          Templates
        </TabsTrigger>
      )}

    </TabsList>

    <TabsContent value="my-tasks" className="space-y-4 mt-4">
      <MyTasksView userId={user.id} />
    </TabsContent>

    {isAdminOrManager && (
      <TabsContent value="tasks" className="space-y-4 mt-4">

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

      </TabsContent>
    )}

    {isAdminOrManager && (
      <TabsContent value="staff" className="mt-4">
        <StaffCards staff={staffList}/>
      </TabsContent>
    )}

    {isAdminOrManager && (
      <TabsContent value="performance" className="mt-4">
        <PerformanceView performance={performanceData}/>
      </TabsContent>
    )}

    {isAdminOrManager && (
      <TabsContent value="templates" className="mt-4">
        <TemplatesTab staffList={staffList} />
      </TabsContent>
    )}

  </Tabs>

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
  />

</div>

);
}
