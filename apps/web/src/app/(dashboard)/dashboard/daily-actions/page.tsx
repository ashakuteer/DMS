"use client"

import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { useDailyActions } from "./hooks/useDailyActions"

import { BirthdaysSection } from "./components/BirthdaysSection"
import { SponsorshipSection } from "./components/SponsorshipSection"
import { PledgesSection } from "./components/PledgesSection"
import { AtRiskSection } from "./components/AtRiskSection"
import { FollowUpsSection } from "./components/FollowUpsSection"

export default function DailyActionsPage() {
  const { data, loading, refresh } = useDailyActions()

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )

  if (!data)
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        Failed to load
        <Button onClick={refresh}>Retry</Button>
      </div>
    )

  return (
    <div className="space-y-4">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Daily Action Inbox</h1>

        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <BirthdaysSection data={data} />
      </Card>

      <Card>
        <SponsorshipSection data={data} />
      </Card>

      <Card>
        <PledgesSection data={data} />
      </Card>

      <Card>
        <AtRiskSection data={data} />
      </Card>

      <Card>
        <FollowUpsSection data={data} />
      </Card>

    </div>
  )
}
