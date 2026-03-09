"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { isToday, isPast } from "date-fns"

export default function TodaySummary({ followUps }: any) {

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
              Today's Summary
            </span>
          </div>

          <Badge className="bg-orange-100 text-orange-800">
            {dueTodayCount} due today
          </Badge>

          <Badge className="bg-red-100 text-red-800">
            {overdueCount} overdue
          </Badge>

          <Badge className="bg-green-100 text-green-800">
            {completedTodayCount} completed today
          </Badge>

        </div>

      </CardContent>
    </Card>

  )
}
