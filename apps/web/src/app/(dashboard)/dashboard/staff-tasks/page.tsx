"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, ClipboardList, Users, BarChart3 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { authStorage } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

import { useStaffTasks } from "./hooks/useStaffTasks";

import TaskStatsCards from "./components/TaskStatsCards";
import TaskFilters from "./components/TaskFilters";
import TaskTable from "./components/TaskTable";
import StaffCards from "./components/StaffCards";
import PerformanceView from "./components/PerformanceView";

import CreateTaskDialog from "./dialogs/CreateTaskDialog";
import EditTaskDialog from "./dialogs/EditTaskDialog";
import TaskDetailDialog from "./dialogs/TaskDetailDialog";

export default function StaffTasksPage() {

const { toast } = useToast();

const [user, setUser] = useState<any>(null);
const [activeTab, setActiveTab] = useState("tasks");

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
if (stored) setUser(stored);
}, []);

useEffect(() => {
fetchTasks();
}, [fetchTasks]);

if (!user) return null;

if (!canAccessModule(user.role, "staffTasks")) {
return <AccessDenied />;
}

const isAdminOrManager = user.role === "ADMIN" || user.role === "MANAGER";

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
      <h1 className="text-2xl font-bold">Staff & Tasks</h1>
      <p className="text-muted-foreground">
        Manage tasks, staff performance and tracking
      </p>
    </div>

    <div className="flex gap-2">

      <Button
        variant="outline"
        size="icon"
        onClick={() => fetchTasks()}
      >
        <RefreshCw className="h-4 w-4"/>
      </Button>

      {canCreate && (
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1"/> New Task
        </Button>
      )}

    </div>

  </div>

  <Tabs value={activeTab} onValueChange={setActiveTab}>

    <TabsList>

      <TabsTrigger value="tasks">
        <ClipboardList className="h-4 w-4 mr-1"/>
        Tasks
      </TabsTrigger>

      {isAdminOrManager && (
        <TabsTrigger value="staff">
          <Users className="h-4 w-4 mr-1"/>
          Staff
        </TabsTrigger>
      )}

      {isAdminOrManager && (
        <TabsTrigger value="performance">
          <BarChart3 className="h-4 w-4 mr-1"/>
          Performance
        </TabsTrigger>
      )}

    </TabsList>

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

  </Tabs>

  <CreateTaskDialog
    open={showCreateDialog}
    setOpen={setShowCreateDialog}
  />

  <EditTaskDialog
    open={showEditDialog}
    setOpen={setShowEditDialog}
    task={selectedTask}
  />

  <TaskDetailDialog
    open={showDetailDialog}
    setOpen={setShowDetailDialog}
    task={selectedTask}
  />

</div>

);
}
