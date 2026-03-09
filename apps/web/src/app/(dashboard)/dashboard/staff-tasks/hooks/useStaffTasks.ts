import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category: string;
  assignedToId: string;
  dueDate?: string | null;
  notes?: string | null;
  isRecurring?: boolean;
  recurrenceType?: string;
  checklist?: any[];
  createdAt: string;
}

export function useStaffTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = useCallback(async (params?: URLSearchParams) => {
    setLoading(true);

    try {
      const res = await fetchWithAuth(`/api/staff-tasks?${params?.toString() || ""}`);

      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
        const total = data.total || 0;
        setTotalPages(Math.max(1, Math.ceil(total / 20)));
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = async (taskId: string) => {
    const res = await fetchWithAuth(`/api/staff-tasks/${taskId}`, {
      method: "DELETE",
    });

    return res.ok;
  };

  const updateStatus = async (taskId: string, status: string) => {
    const res = await fetchWithAuth(`/api/staff-tasks/${taskId}/status`, {
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
