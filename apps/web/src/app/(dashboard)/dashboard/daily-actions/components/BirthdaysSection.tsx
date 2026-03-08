"use client"

import { Cake } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { SectionHeader } from "./SectionHeader"

export function BirthdaysSection({ data }: any) {

  const birthdays = data?.todaySpecialDays?.birthdays || []

  return (
    <>
      <SectionHeader
        title="Birthdays"
        icon={Cake}
        count={birthdays.length}
        section="birthdays"
      />

      <CardContent className="pt-0">
        {birthdays.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No birthdays today
          </div>
        ) : (
          birthdays.map((b: any) => (
            <div key={b.id} className="py-2 border-b">
              {b.donorName}
            </div>
          ))
        )}
      </CardContent>
    </>
  )
}
