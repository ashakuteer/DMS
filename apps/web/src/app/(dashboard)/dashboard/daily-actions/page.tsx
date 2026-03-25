"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DailyActionsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/donor-actions")
  }, [router])
  return null
}
