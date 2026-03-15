"use client"

import { useState, useCallback, useEffect } from "react"
import { authStorage } from "@/lib/auth"
import { apiFetch } from "@/lib/api"
import { hasPermission } from "@/lib/permissions"
import type { SpecialOccasion, SpecialOccasionFormData } from "../types"

interface UpcomingOccasion extends SpecialOccasion {
  daysUntil: number
}

const EMPTY_OCCASION_FORM: SpecialOccasionFormData = {
  type: "DOB_SELF",
  month: "",
  day: "",
  relatedPersonName: "",
  notes: "",
}

export function useDonorSpecialDays(donorId: string) {
  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasion[]>([])
  const [specialOccasionsLoading, setSpecialOccasionsLoading] = useState(false)
  const [deletingSpecialOccasionId, setDeletingSpecialOccasionId] = useState<string | null>(null)

  const [showSpecialOccasionDialog, setShowSpecialOccasionDialog] = useState(false)
  const [editingSpecialOccasion, setEditingSpecialOccasion] = useState(false)
  const [editingSpecialOccasionId, setEditingSpecialOccasionId] = useState<string | null>(null)
  const [specialOccasionForm, setSpecialOccasionForm] = useState<SpecialOccasionFormData>(EMPTY_OCCASION_FORM)
  const [savingSpecialOccasion, setSavingSpecialOccasion] = useState(false)

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
      const res = await apiFetch(`/api/donor-relations/donors/${donorId}/special-occasions`)
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
      const res = await apiFetch(
        `/api/donor-relations/special-occasions/${occasionId}`,
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
  }, [])

  const onAdd = useCallback(() => {
    setEditingSpecialOccasion(false)
    setEditingSpecialOccasionId(null)
    setSpecialOccasionForm(EMPTY_OCCASION_FORM)
    setShowSpecialOccasionDialog(true)
  }, [])

  const onEdit = useCallback((occasion: SpecialOccasion) => {
    setEditingSpecialOccasion(true)
    setEditingSpecialOccasionId(occasion.id)
    setSpecialOccasionForm({
      type: occasion.type,
      month: occasion.month.toString(),
      day: occasion.day.toString(),
      relatedPersonName: occasion.relatedPersonName || "",
      notes: occasion.notes || "",
    })
    setShowSpecialOccasionDialog(true)
  }, [])

  const handleSpecialOccasionSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSpecialOccasion(true)
    try {
      const body = {
        type: specialOccasionForm.type,
        month: parseInt(specialOccasionForm.month),
        day: parseInt(specialOccasionForm.day),
        relatedPersonName: specialOccasionForm.relatedPersonName || undefined,
        notes: specialOccasionForm.notes || undefined,
      }
      const url = editingSpecialOccasionId
        ? `/api/donor-relations/special-occasions/${editingSpecialOccasionId}`
        : `/api/donor-relations/donors/${donorId}/special-occasions`
      const method = editingSpecialOccasionId ? "PATCH" : "POST"
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setShowSpecialOccasionDialog(false)
        setSpecialOccasionForm(EMPTY_OCCASION_FORM)
        setEditingSpecialOccasionId(null)
        await fetchSpecialOccasions()
      }
    } catch {
      console.error("Failed to save special occasion")
    } finally {
      setSavingSpecialOccasion(false)
    }
  }, [donorId, specialOccasionForm, editingSpecialOccasionId, fetchSpecialOccasions])

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
    showSpecialOccasionDialog,
    setShowSpecialOccasionDialog,
    editingSpecialOccasion,
    specialOccasionForm,
    setSpecialOccasionForm,
    savingSpecialOccasion,
    handleSpecialOccasionSubmit,
  }
}
