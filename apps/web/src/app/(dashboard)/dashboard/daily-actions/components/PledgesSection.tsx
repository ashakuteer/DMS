"use client"

import Link from "next/link"
import { Gift, AlertCircle, Clock } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "./SectionHeader"

const PLEDGE_TYPE_LABELS: Record<string, string> = {
  MONEY: "Money",
  RICE: "Rice",
  GROCERIES: "Groceries",
  MEDICINES: "Medicines",
  MEAL_SPONSOR: "Meal Sponsor",
  VISIT: "Visit",
  OTHER: "Other",
}

function formatPledgeAmount(pledgeType: string, amount: number | null, quantity: string | null, currency = "INR") {
  if (pledgeType === "MONEY" && amount != null) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  if (quantity) return quantity
  return PLEDGE_TYPE_LABELS[pledgeType] || pledgeType
}

export function PledgesSection({ data }: any) {
  const overdue: any[] = data?.pledges?.overdue || []
  const dueToday: any[] = data?.pledges?.dueToday || []
  const total = overdue.length + dueToday.length

  return (
    <>
      <SectionHeader
        title="Pledges"
        icon={Gift}
        count={total}
        section="pledges"
      />

      <CardContent className="pt-0">
        {total === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No pledges due
          </div>
        ) : (
          <div className="space-y-1">
            {overdue.map((p: any) => (
              <Link
                key={p.id}
                href={`/dashboard/donors/${p.donorId}?tab=pledges`}
                className="flex items-start justify-between py-2 border-b last:border-0 hover:bg-muted/50 rounded px-1 transition-colors"
                data-testid={`pledge-overdue-${p.id}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.donorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {PLEDGE_TYPE_LABELS[p.pledgeType] || p.pledgeType}
                    {" · "}
                    {formatPledgeAmount(p.pledgeType, p.amount, p.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <Badge variant="destructive" className="text-xs flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {p.daysOverdue > 0 ? `${p.daysOverdue}d overdue` : "Overdue"}
                  </Badge>
                </div>
              </Link>
            ))}

            {dueToday.map((p: any) => (
              <Link
                key={p.id}
                href={`/dashboard/donors/${p.donorId}?tab=pledges`}
                className="flex items-start justify-between py-2 border-b last:border-0 hover:bg-muted/50 rounded px-1 transition-colors"
                data-testid={`pledge-today-${p.id}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.donorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {PLEDGE_TYPE_LABELS[p.pledgeType] || p.pledgeType}
                    {" · "}
                    {formatPledgeAmount(p.pledgeType, p.amount, p.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due today
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </>
  )
}
