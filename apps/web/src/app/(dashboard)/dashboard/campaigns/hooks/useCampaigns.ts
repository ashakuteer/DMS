"use client"

import { useEffect, useState } from "react"
import { fetchWithAuth } from "@/lib/auth"
import { Campaign } from "../types"

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth("/api/campaigns")
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data)
      }
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
    fetchCampaigns,
  }
}
