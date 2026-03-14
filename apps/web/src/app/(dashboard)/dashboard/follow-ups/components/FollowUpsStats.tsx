"use client"

import StatsCards from "./StatsCards"

interface Stats {
  total: number
  pending: number
  completed: number
  overdue: number
  dueToday: number
  dueThisWeek: number
}

interface Props {
  stats: Stats
}

export default function FollowUpsStats({ stats }: Props) {
  return <StatsCards stats={stats} />
}
