"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"
import { DonationStats } from "../types"

export default function DonationStatsCard({ stats }: { stats: DonationStats }) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

      {stats.byHome.map((homeStat) => (

        <Card key={homeStat.homeType}>

          <CardHeader className="flex flex-row items-center justify-between">

            <CardTitle className="text-sm">
              {homeStat.label}
            </CardTitle>

            <Home className="h-4 w-4 text-muted-foreground" />

          </CardHeader>

          <CardContent>

            <div className="text-2xl font-bold">

              ₹{homeStat.cashTotal.toLocaleString()}

            </div>

            <p className="text-xs text-muted-foreground">
              {homeStat.totalCount} donations
            </p>

          </CardContent>

        </Card>

      ))}

    </div>
  )
}
