import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category: string;
  dueDate?: string | null;
  completedAt?: string | null;
  startedAt?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string } | null;
  linkedDonor?: { id: string; donorCode: string; firstName: string; lastName: string } | null;
  checklist?: any[] | null;
  minutesTaken?: number | null;
  notes?: string | null;
  isRecurring?: boolean;
  recurrenceType?: string | null;
  templateId?: string | null;
  createdAt: string;
}

export function useStaffTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = useCallback(async (params?: URLSearchParams) => {
    setLoading(true);
    try {
      const p = params ? new URLSearchParams(params.toString()) : new URLSearchParams();
      p.set("excludePersonal", "true");
      const res = await fetchWithAuth(`/api/staff-tasks?${p}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        setTasks(items);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch staff tasks", err);
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

  const updateStatus = async (taskId: string, status: string, notes?: string, minutesTaken?: number) => {
    const body: Record<string, unknown> = { status };
    if (notes !== undefined) body.notes = notes;
    if (minutesTaken !== undefined) body.minutesTaken = minutesTaken;
    const res = await fetchWithAuth(`/api/staff-tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify(body),
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
