"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, AlertCircle } from "lucide-react"
import { useCampaigns } from "./hooks/useCampaigns"
import CampaignCard from "./components/CampaignCard"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "react-i18next"

export default function CampaignsPage() {
  const { t } = useTranslation();

  const { campaigns, loading, error, fetchCampaigns } = useCampaigns()

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
          <h1 className="text-2xl font-bold">{t("campaigns.title")}</h1>
          <p className="text-muted-foreground">
            {t("campaigns.subtitle")}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchCampaigns} data-testid="button-refresh-campaigns">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button data-testid="button-new-campaign">
            <Plus className="h-4 w-4 mr-1" />
            {t("campaigns.new_campaign")}
          </Button>
        </div>

      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span data-testid="text-campaigns-error">{error}</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">

        <TabsList>
          <TabsTrigger value="active">
            {t("campaigns.active")} ({activeCampaigns.length})
          </TabsTrigger>

          <TabsTrigger value="closed">
            {t("campaigns.closed")} ({closedCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">

          {loading ? (
            <p data-testid="text-campaigns-loading">{t("common.loading")}</p>
          ) : activeCampaigns.length === 0 && !error ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No active campaigns found.
              </CardContent>
            </Card>
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

          {closedCampaigns.length === 0 && !error ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No closed campaigns found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {closedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onClick={() => console.log("open campaign", campaign.id)}
                />
              ))}
            </div>
          )}

        </TabsContent>

      </Tabs>

    </div>
  )
}
