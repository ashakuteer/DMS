"use client"

import { useState, useCallback, useEffect } from "react"
import { fetchWithAuth, authStorage } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import type { SpecialOccasion } from "../types"

interface UpcomingOccasion extends SpecialOccasion {
  daysUntil: number
}

export function useDonorSpecialDays(donorId: string) {
  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasion[]>([])
  const [specialOccasionsLoading, setSpecialOccasionsLoading] = useState(false)
  const [deletingSpecialOccasionId, setDeletingSpecialOccasionId] = useState<string | null>(null)

  const user = authStorage.getUser()
  const canEditFamilyAndSpecialDays = hasPermission(user?.role, "donors", "edit")

  const upcomingOccasions: UpcomingOccasion[] = specialOccasions
    .map((occasion) => {
      const today = new Date()
      const year = today.getFullYear()
      const thisYear = new Date(year, occasion.month - 1, occasion.day)
      const nextYear = new Date(year + 1, occasion.month - 1, occasion.day)
      const next = thisYear >= today ? thisYear : nextYear
      const daysUntil = Math.floor((next.getTime() - today.getTime()) / 86400000)
      return { ...occasion, daysUntil }
    })
    .filter((o) => o.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const fetchSpecialOccasions = useCallback(async () => {
    setSpecialOccasionsLoading(true)
    try {
      const res = await fetchWithAuth(`/api/donors/${donorId}/special-occasions`)
      if (res.ok) {
        const data = await res.json()
        setSpecialOccasions(data || [])
      }
    } catch {
      console.error("Failed to fetch special occasions")
    } finally {
      setSpecialOccasionsLoading(false)
    }
  }, [donorId])

  useEffect(() => {
    fetchSpecialOccasions()
  }, [fetchSpecialOccasions])

  const onDelete = useCallback(async (occasionId: string) => {
    setDeletingSpecialOccasionId(occasionId)
    try {
      const res = await fetchWithAuth(
        `/api/donors/${donorId}/special-occasions/${occasionId}`,
        { method: "DELETE" }
      )
      if (res.ok) {
        setSpecialOccasions((prev) => prev.filter((o) => o.id !== occasionId))
      }
    } catch {
      console.error("Failed to delete special occasion")
    } finally {
      setDeletingSpecialOccasionId(null)
    }
  }, [donorId])

  const onAdd = useCallback(() => {}, [])
  const onEdit = useCallback((_occasion: SpecialOccasion) => {}, [])

  return {
    specialOccasions,
    specialOccasionsLoading,
    upcomingOccasions,
    canEditFamilyAndSpecialDays,
    deletingSpecialOccasionId,
    fetchSpecialOccasions,
    onAdd,
    onEdit,
    onDelete,
  }
}
