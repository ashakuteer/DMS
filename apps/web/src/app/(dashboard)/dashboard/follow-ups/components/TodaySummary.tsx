"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { isToday, isPast } from "date-fns"
import { useTranslation } from "react-i18next"

export default function TodaySummary({ followUps }: any) {
  const { t } = useTranslation()

  const dueTodayCount =
    followUps.filter((f: any) =>
      f.status === "PENDING" &&
      isToday(new Date(f.dueDate))
    ).length

  const overdueCount =
    followUps.filter((f: any) =>
      f.status === "PENDING" &&
      isPast(new Date(f.dueDate)) &&
      !isToday(new Date(f.dueDate))
    ).length

  const completedTodayCount =
    followUps.filter((f: any) =>
      f.status === "COMPLETED" &&
      f.completedAt &&
      isToday(new Date(f.completedAt))
    ).length

  return (

    <Card>
      <CardContent className="pt-4 pb-4">

        <div className="flex items-center gap-6 flex-wrap">

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t("follow_ups.todays_summary")}
            </span>
          </div>

          <Badge className="bg-[#E6F4F1] text-[#5FA8A8]">
            {t("follow_ups.due_today_count", { count: dueTodayCount })}
          </Badge>

          <Badge className="bg-red-100 text-red-800">
            {t("follow_ups.overdue_count", { count: overdueCount })}
          </Badge>

          <Badge className="bg-green-100 text-green-800">
            {t("follow_ups.completed_today_count", { count: completedTodayCount })}
          </Badge>

        </div>

      </CardContent>
    </Card>

  )
}
