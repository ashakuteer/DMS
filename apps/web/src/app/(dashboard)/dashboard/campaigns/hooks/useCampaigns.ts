"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/auth"
import { Campaign } from "../types"

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth("/api/campaigns")
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data)
      } else if (res.status === 401) {
        setError("Session expired. Please log in again.")
      } else if (res.status === 403) {
        setError("You do not have permission to view campaigns.")
      } else {
        setError(`Failed to load campaigns (${res.status})`)
      }
    } catch {
      setError("Network error — unable to reach the server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
  }
}
