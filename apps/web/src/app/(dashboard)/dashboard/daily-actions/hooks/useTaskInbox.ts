"use client"

import { API_URL } from "@/lib/api-config"
import { useEffect, useState, useCallback } from "react"
import { authStorage } from "@/lib/auth"

export type TaskStatus = "PENDING" | "COMPLETED" | "OVERDUE" | "IN_PROGRESS" | "MISSED"
export type TaskType = "BIRTHDAY" | "FOLLOW_UP" | "PLEDGE" | "REMINDER" | "GENERAL"
export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW"

export interface TaskItem {
  id: string
  title: string
  description: string | null
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  completedAt: string | null
  donorId: string | null
  assignedTo: string | null
  donor: {
    id: string
    donorCode: string
    firstName: string
    lastName: string
    primaryPhone: string | null
  } | null
  assignedUser: { id: string; name: string; email: string } | null
}

export interface CreateTaskInput {
  title: string
  type: TaskType
  priority: TaskPriority
  dueDate: string
  description?: string
  donorId?: string
}

export interface StaffUser {
  id: string
  name: string
  role: string
}

function authHeaders() {
  const token = authStorage.getAccessToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function useTaskInbox() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch only donor-related task types
      const [resPending, resOverdue] = await Promise.all([
        fetch(`${API_URL}/api/tasks?category=donor&status=PENDING`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/tasks?category=donor&status=OVERDUE`, { headers: authHeaders() }),
      ])
      const pending: TaskItem[] = resPending.ok ? await resPending.json() : []
      const overdue: TaskItem[] = resOverdue.ok ? await resOverdue.json() : []
      // Overdue first, then pending
      setTasks([
        ...overdue.map(t => ({ ...t, status: "OVERDUE" as TaskStatus })),
        ...pending,
      ])
    } catch (err) {
      console.error("[useTaskInbox] fetchTasks error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const completeTask = useCallback(async (taskId: string) => {
    if (completing.has(taskId)) return
    setCompleting(prev => new Set(prev).add(taskId))
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "COMPLETED" as TaskStatus } : t))
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) {
        // Revert on failure
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "PENDING" as TaskStatus } : t))
      }
    } catch (err) {
      console.error(err)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "PENDING" as TaskStatus } : t))
    } finally {
      setCompleting(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }, [completing])

  const reopenTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "PENDING" as TaskStatus } : t))
    try {
      await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: "PENDING" }),
      })
    } catch (err) {
      console.error(err)
    }
  }, [])

  const createTask = useCallback(async (input: CreateTaskInput) => {
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(input),
      })
      if (res.ok) {
        await fetchTasks()
        return true
      }
      return false
    } catch (err) {
      console.error(err)
      return false
    } finally {
      setCreating(false)
    }
  }, [fetchTasks])

  const generateTasks = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/tasks/generate`, {
        method: "POST",
        headers: authHeaders(),
      })
      await fetchTasks()
    } catch (err) {
      console.error(err)
    }
  }, [fetchTasks])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    completing,
    creating,
    completeTask,
    reopenTask,
    createTask,
    generateTasks,
    refresh: fetchTasks,
  }
}
