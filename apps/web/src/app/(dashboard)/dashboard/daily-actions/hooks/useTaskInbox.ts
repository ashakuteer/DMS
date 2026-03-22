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
  const [completing, setCompleting] = useState<Set<string>>(new Set())
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/tasks/today`)
      if (res.ok) {
        const result: TaskInboxData = await res.json()
        setData(result)
        setCompletedIds(new Set())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const markComplete = useCallback(async (taskId: string) => {
    if (completing.has(taskId) || completedIds.has(taskId)) return
    setCompleting((prev) => new Set(prev).add(taskId))
    try {
      const token = authStorage.getAccessToken()
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      })
      if (res.ok) {
        setCompletedIds((prev) => new Set(prev).add(taskId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }, [completing, completedIds])

  const unmarkComplete = useCallback(async (taskId: string) => {
    if (completing.has(taskId)) return
    setCompleting((prev) => new Set(prev).add(taskId))
    try {
      const token = authStorage.getAccessToken()
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "PENDING" }),
      })
      if (res.ok) {
        setCompletedIds((prev) => {
          const next = new Set(prev)
          next.delete(taskId)
          return next
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting((prev) => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }, [completing])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, completing, completedIds, markComplete, unmarkComplete, refresh: fetchData }
}
