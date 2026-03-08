"use client"

import { HandCoins } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { SectionHeader } from "./SectionHeader"

export function SponsorshipSection({ data }: any) {

  const items = data?.sponsorshipsDue || []

  return (
    <>
      <SectionHeader
        title="Sponsorships Due"
        icon={HandCoins}
        count={items.length}
        section="sponsorships"
      />

      <CardContent className="pt-0">
        {items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No sponsorships due
          </div>
        ) : (
          items.map((s: any) => (
            <div key={s.id} className="py-2 border-b">
              {s.donorName} → {s.beneficiaryName}
            </div>
          ))
        )}
      </CardContent>
    </>
  )
}
