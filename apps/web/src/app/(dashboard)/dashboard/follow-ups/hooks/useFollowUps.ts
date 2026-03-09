"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/auth"

export function useFollowUps(activeTab: string) {

  const [followUps, setFollowUps] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0
  })

  const [loading, setLoading] = useState(true)

  async function fetchFollowUps() {

    setLoading(true)

    try {

      let statusFilter = ""

      if (activeTab === "upcoming")
        statusFilter = "PENDING"

      else if (activeTab === "completed")
        statusFilter = "COMPLETED"

      const params = new URLSearchParams()

      if (statusFilter)
        params.set("status", statusFilter)

      params.set("limit", "200")

      const res = await fetchWithAuth(
        `/api/follow-ups?${params.toString()}`
      )

      if (res.ok) {

        const data = await res.json()

        setFollowUps(data.items || [])

      }

    } catch {

      console.error("Failed to fetch follow-ups")

    } finally {

      setLoading(false)

    }

  }

  async function fetchStats() {

    try {

      const res = await fetchWithAuth("/api/follow-ups/stats")

      if (res.ok) {

        const data = await res.json()

        setStats(data)

      }

    } catch {

      console.error("Failed to fetch stats")

    }

  }

  useEffect(() => {

    fetchFollowUps()
    fetchStats()

  }, [activeTab])

  return {
    followUps,
    stats,
    loading,
    refresh: fetchFollowUps
  }

}
