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

const HIGHLIGHT_CARD = {
  background: "linear-gradient(135deg, #5FA8A8, #6FAFD4)",
  boxShadow: "0 6px 18px rgba(95,168,168,0.25)",
};
const NORMAL_CARD = {
  background: "#FFFFFF",
  border: "1px solid #EEF2F7",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

export default function StatsCards({ stats }: { stats: Stats }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

      <Card className="border-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.06)]" style={HIGHLIGHT_CARD}>
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

      <Card className="border-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.06)]" style={HIGHLIGHT_CARD}>
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

      <Card className="border-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.06)]" style={NORMAL_CARD}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#F1F5F9]">
              <Clock className="h-5 w-5 text-[#5FA8A8]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0F172A]">{stats.dueThisWeek}</p>
              <p className="text-xs text-[#64748B]">{t("follow_ups.this_week")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.06)]" style={NORMAL_CARD}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#F1F5F9]">
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
