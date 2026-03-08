"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { useCampaigns } from "./hooks/useCampaigns"
import CampaignCard from "./components/CampaignCard"
import { formatCurrency } from "./utils"
import { Card, CardContent } from "@/components/ui/card"

export default function CampaignsPage() {

  const { campaigns, loading, fetchCampaigns } = useCampaigns()

  const activeCampaigns = campaigns.filter((c) =>
    ["ACTIVE", "DRAFT"].includes(c.status)
  )

  const closedCampaigns = campaigns.filter((c) =>
    ["COMPLETED", "CANCELLED", "PAUSED"].includes(c.status)
  )

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      <div className="flex justify-between">

        <div>
          <h1 className="text-2xl font-bold">Fundraising Campaigns</h1>
          <p className="text-muted-foreground">
            Manage your fundraising campaigns
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Campaign
          </Button>
        </div>

      </div>

      <Tabs defaultValue="active">

        <TabsList>
          <TabsTrigger value="active">
            Active ({activeCampaigns.length})
          </TabsTrigger>

          <TabsTrigger value="closed">
            Closed ({closedCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">

              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onClick={() => console.log("open campaign", campaign.id)}
                />
              ))}

            </div>
          )}

        </TabsContent>

        <TabsContent value="closed">

          <div className="grid md:grid-cols-3 gap-4">

            {closedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => console.log("open campaign", campaign.id)}
              />
            ))}

          </div>

        </TabsContent>

      </Tabs>

    </div>
  )
}
