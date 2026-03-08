"use client"

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { Campaign } from "../types"
import { formatCurrency, HOME_LABELS } from "../utils"

interface Props {
  campaign: Campaign
  onClick: () => void
}

export default function CampaignCard({ campaign, onClick }: Props) {
  return (
    <Card className="cursor-pointer hover-elevate" onClick={onClick}>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>{campaign.name}</CardTitle>
          <Badge>{campaign.status}</Badge>
        </div>

        {campaign.description && (
          <CardDescription>{campaign.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">

        {campaign.goalAmount > 0 && (
          <>
            <Progress value={campaign.progressPercent} className="h-2" />

            <div className="flex justify-between text-sm">
              <span>Raised</span>
              <span>{formatCurrency(campaign.totalRaised)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>Goal</span>
              <span>{formatCurrency(campaign.goalAmount)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between text-sm">
          <span>Donors</span>
          <span>{campaign.donorCount}</span>
        </div>

        {campaign.startDate && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            {format(new Date(campaign.startDate), "dd MMM yyyy")}
          </div>
        )}

        <div className="flex gap-1 flex-wrap">
          {campaign.homeTypes?.map((ht) => (
            <Badge key={ht} variant="outline">
              {HOME_LABELS[ht] || ht}
            </Badge>
          ))}
        </div>

      </CardContent>
    </Card>
  )
}
