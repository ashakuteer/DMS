"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface Props {
  refresh: () => void
}

export default function FollowUpsHeader({ refresh }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Follow-Ups</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage donor follow-up tasks
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={refresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>
  )
}
