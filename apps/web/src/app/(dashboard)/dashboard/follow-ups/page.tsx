"use client"

import { useState } from "react"
import { authStorage } from "@/lib/auth"
import { canAccessModule } from "@/lib/permissions"
import { AccessDenied } from "@/components/access-denied"

import { useFollowUps } from "./hooks/useFollowUps"

import FollowUpsHeader from "./components/FollowUpsHeader"
import TodaySummary from "./components/TodaySummary"
import FollowUpsStats from "./components/FollowUpsStats"

export default function FollowUpsPage(){

  const [user] = useState(authStorage.getUser())

  const [activeTab,setActiveTab] = useState("upcoming")

  const {
    followUps,
    stats,
    loading,
    refresh
  } = useFollowUps(activeTab)

  if(!user) return null

  if(!canAccessModule(user.role,"followUps"))
    return <AccessDenied/>

  return(

    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      <FollowUpsHeader
        refresh={refresh}
      />

      <TodaySummary
        followUps={followUps}
      />

      <FollowUpsStats
        stats={stats}
      />

    </div>

  )

}
