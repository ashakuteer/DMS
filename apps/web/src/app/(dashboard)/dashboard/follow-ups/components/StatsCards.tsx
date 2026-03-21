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

      <Card className="border-0 transition-shadow hover:shadow-md" style={{ background: "linear-gradient(135deg, #5FA8A8, #7FAFD4)", boxShadow: "0 4px 12px rgba(95,168,168,0.25)" }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white/20">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.overdue}</p>
              <p className="text-xs text-white/80">{t("follow_ups.overdue")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 transition-shadow hover:shadow-md" style={{ background: "linear-gradient(135deg, #5FA8A8, #7FAFD4)", boxShadow: "0 4px 12px rgba(95,168,168,0.25)" }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.dueToday}</p>
              <p className="text-xs text-white/80">{t("follow_ups.due_today")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 transition-shadow hover:shadow-md" style={{ background: "linear-gradient(135deg, #E6F4F4, #EEF6FB)", border: "1px solid #D1E3E3", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white/70">
              <Clock className="h-5 w-5 text-[#5FA8A8]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">{stats.dueThisWeek}</p>
              <p className="text-xs text-[#64748B]">{t("follow_ups.this_week")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 transition-shadow hover:shadow-md" style={{ background: "linear-gradient(135deg, #E6F4F4, #EEF6FB)", border: "1px solid #D1E3E3", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white/70">
              <CheckCircle2 className="h-5 w-5 text-[#5FA8A8]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">{stats.completed}</p>
              <p className="text-xs text-[#64748B]">{t("follow_ups.completed")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
