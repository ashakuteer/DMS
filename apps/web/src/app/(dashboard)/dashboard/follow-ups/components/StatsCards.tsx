"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Calendar, Clock, CheckCircle2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Stats {
  overdue: number
  dueToday: number
  dueThisWeek: number
  completed: number
}

export default function StatsCards({ stats }: { stats: Stats }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.overdue}</p>
              <p className="text-xs text-muted-foreground">{t("follow_ups.overdue")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.dueToday}</p>
              <p className="text-xs text-muted-foreground">{t("follow_ups.due_today")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.dueThisWeek}</p>
              <p className="text-xs text-muted-foreground">{t("follow_ups.this_week")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">{t("follow_ups.completed")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
