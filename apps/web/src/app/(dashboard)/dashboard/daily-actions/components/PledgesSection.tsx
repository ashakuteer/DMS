"use client"

import { Gift } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { SectionHeader } from "./SectionHeader"

export function PledgesSection({ data }: any) {

  const pledges = [
    ...(data?.pledges?.overdue || []),
    ...(data?.pledges?.dueToday || []),
  ]

  return (
    <>
      <SectionHeader
        title="Pledges"
        icon={Gift}
        count={pledges.length}
        section="pledges"
      />

      <CardContent className="pt-0">
        {pledges.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No pledges
          </div>
        ) : (
          pledges.map((p: any) => (
            <div key={p.id} className="py-2 border-b">
              {p.donorName}
            </div>
          ))
        )}
      </CardContent>
    </>
  )
}
