"use client"

import { AlertTriangle } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { SectionHeader } from "./SectionHeader"

export function AtRiskSection({ data }: any) {

  const donors = data?.atRiskDonors || []

  return (
    <>
      <SectionHeader
        title="At-Risk Donors"
        icon={AlertTriangle}
        count={donors.length}
        section="atRisk"
      />

      <CardContent className="pt-0">
        {donors.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No at-risk donors
          </div>
        ) : (
          donors.map((d: any) => (
            <div key={d.id} className="py-2 border-b">
              {d.donorName}
            </div>
          ))
        )}
      </CardContent>
    </>
  )
}
