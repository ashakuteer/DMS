"use client"

import { useEffect, useState } from "react"
import { API_URL } from "@/lib/api-config"
import { authStorage } from "@/lib/auth"

export function useDailyActions() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)

    try {
      const token = authStorage.getAccessToken()

      const res = await fetch(`${API_URL}/api/dashboard/daily-actions`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    loading,
    refresh: fetchData,
  }
}
