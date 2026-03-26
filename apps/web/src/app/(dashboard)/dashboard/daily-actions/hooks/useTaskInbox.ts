"use client"

import { API_URL } from "@/lib/api-config"
import { useEffect, useState, useCallback } from "react"
import { authStorage } from "@/lib/auth"

export type TaskStatus = "PENDING" | "COMPLETED" | "OVERDUE" | "IN_PROGRESS" | "MISSED"
export type TaskType =
  | "BIRTHDAY"
  | "ANNIVERSARY"
  | "REMEMBRANCE"
  | "FOLLOW_UP"
  | "PLEDGE"
  | "SMART_REMINDER"
  | "SPONSOR_UPDATE"
  | "REMINDER"
  | "GENERAL"
  | "MANUAL"
  | "INTERNAL"
export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW"
export type TimeWindow = "overdue" | "today" | "7days" | "15days" | "30days"

export interface DonorOwner {
  id: string
  name: string
  email: string
}

export interface TaskDonor {
  id: string
  donorCode: string
  firstName: string
  lastName: string | null
  primaryPhone: string | null
  whatsappPhone: string | null
  prefWhatsapp: boolean
  assignedToUser: DonorOwner | null
}

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
  autoWhatsAppPossible: boolean
  manualRequired: boolean
  contactCount: number
  lastContactedAt: string | null
  donor: TaskDonor | null
  assignedUser: { id: string; name: string; email: string } | null
  sourceOccasion: {
    id: string
    type: string
    relatedPersonName: string | null
    month: number
    day: number
  } | null
  sourceSponsorship: {
    id: string
    sponsorshipType: string
    beneficiary: { id: string; fullName: string } | null
  } | null
  sourcePledge: {
    id: string
    pledgeType: string
    amount: string | null
    quantity: string | null
    expectedFulfillmentDate: string | null
  } | null
}

export interface CreateTaskInput {
  title: string
  type: TaskType
  priority: TaskPriority
  dueDate: string
  description?: string
  donorId?: string
}

export interface LogContactInput {
  contactMethod: string
  outcome?: string
  notes?: string
}

function authHeaders() {
  const token = authStorage.getAccessToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function buildUrl(timeWindow: TimeWindow, typeFilter: string): string {
  const params = new URLSearchParams()
  params.set("category", "donor")
  params.set("timeWindow", timeWindow)
  if (typeFilter !== "ALL") params.set("type", typeFilter)
  return `${API_URL}/api/tasks?${params.toString()}`
}

export function useTaskInbox() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("today")
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [showCompleted, setShowCompleted] = useState(false)

  const fetchTasks = useCallback(async (tw?: TimeWindow, tf?: string) => {
    const window = tw ?? timeWindow
    const type = tf ?? typeFilter
    setLoading(true)
    try {
      const url = buildUrl(window, type)
      const res = await fetch(url, { headers: authHeaders() })
      const data: TaskItem[] = res.ok ? await res.json() : []

      if (window === "overdue") {
        // For overdue window, also fetch completed overdue tasks if showCompleted
        setTasks(data.map(t => ({ ...t, status: "OVERDUE" as TaskStatus })))
      } else {
        setTasks(data)
      }
    } catch (err) {
      console.error("[useTaskInbox] fetchTasks error:", err)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [timeWindow, typeFilter])

  const changeTimeWindow = useCallback((tw: TimeWindow) => {
    setTimeWindow(tw)
    fetchTasks(tw, typeFilter)
  }, [fetchTasks, typeFilter])

  const changeTypeFilter = useCallback((tf: string) => {
    setTypeFilter(tf)
    fetchTasks(timeWindow, tf)
  }, [fetchTasks, timeWindow])

  const completeTask = useCallback(async (taskId: string) => {
    if (completing.has(taskId)) return
    setCompleting(prev => new Set(prev).add(taskId))
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "COMPLETED" as TaskStatus } : t))
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: authHeaders(),
      })
      if (!res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "PENDING" as TaskStatus } : t))
      }
    } catch {
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
    } catch {
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

  const logContact = useCallback(async (taskId: string, input: LogContactInput): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/contact`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(input),
      })
      if (res.ok) {
        // Update local task state to reflect incremented contact count
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, contactCount: t.contactCount + 1, lastContactedAt: new Date().toISOString() }
            : t
        ))
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tasks,
    loading,
    completing,
    creating,
    timeWindow,
    typeFilter,
    showCompleted,
    setShowCompleted,
    changeTimeWindow,
    changeTypeFilter,
    completeTask,
    reopenTask,
    createTask,
    generateTasks,
    logContact,
    refresh: fetchTasks,
  }
}
