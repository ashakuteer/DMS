"use client"

import { Clock } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { SectionHeader } from "./SectionHeader"

export function FollowUpsSection({ data }: any) {

  const items = [
    ...(data?.followUps?.dueToday || []),
    ...(data?.followUps?.overdue || []),
  ]

  return (
    <>
      <SectionHeader
        title="Follow Ups"
        icon={Clock}
        count={items.length}
        section="followUps"
      />

      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No follow-ups
          </div>
        ) : (
          items.map((f: any) => (
            <div key={f.id} className="py-2 border-b">
              {f.donorName}
            </div>
          ))
        )}
      </CardContent>
    </>
  )
}
