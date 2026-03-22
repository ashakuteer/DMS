import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  completedAt?: string | null;
  assignedTo?: string | null;
  donorId?: string | null;
  createdAt: string;
  donor?: { id: string; donorCode: string; firstName: string; lastName: string } | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  // Compatibility fields for staff-tasks components
  category: string;
  notes?: string | null;
  minutesTaken?: null;
  isRecurring?: false;
  recurrenceType?: string;
  checklist?: any[];
}

function mapTask(t: any): Task {
  return {
    ...t,
    category: t.type,           // components use 'category', we map from 'type'
    notes: t.description ?? null,
    minutesTaken: null,
    isRecurring: false,
    recurrenceType: "NONE",
    checklist: [],
  };
}

export function useStaffTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = useCallback(async (params?: URLSearchParams) => {
    setLoading(true);
    try {
      const query = params?.toString() || "";
      const res = await fetchWithAuth(`/api/tasks${query ? `?${query}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        // /api/tasks returns a flat array
        const items = Array.isArray(data) ? data : (data.items || []);
        setTasks(items.map(mapTask));
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = async (taskId: string) => {
    const res = await fetchWithAuth(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });
    return res.ok;
  };

  const updateStatus = async (taskId: string, status: string) => {
    const res = await fetchWithAuth(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return res.ok;
  };

  return {
    tasks,
    loading,
    totalPages,
    fetchTasks,
    deleteTask,
    updateStatus,
  };
}
