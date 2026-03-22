"use client"

import { API_URL } from "@/lib/api-config"
import { useEffect, useState, useCallback } from "react"
import { authStorage } from "@/lib/auth"

export type TaskItem = {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  priority: string
  dueDate: string
  completedAt: string | null
  donorId: string | null
  beneficiaryId: string | null
  donor: { id: string; donorCode: string; firstName: string; lastName: string } | null
  beneficiary: { id: string; fullName: string } | null
}

export type TaskInboxData = {
  dueToday: TaskItem[]
  overdue: TaskItem[]
  total: number
}

export function useTaskInbox() {
  const [data, setData] = useState<TaskInboxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/tasks/today`)
      if (res.ok) {
        const result: TaskInboxData = await res.json()
        setData(result)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleStatus = useCallback(async (taskId: string, currentStatus: string) => {
    if (toggling.has(taskId)) return
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED"
    setToggling((prev) => new Set(prev).add(taskId))
    try {
      const token = authStorage.getAccessToken()
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setToggling((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }, [toggling, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, toggling, toggleStatus, refresh: fetchData }
}
