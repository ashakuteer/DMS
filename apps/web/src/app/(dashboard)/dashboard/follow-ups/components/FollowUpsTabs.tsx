"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "react-i18next"

export default function FollowUpsTabs({
  activeTab,
  setActiveTab,
  stats,
  children
}:any){
  const { t } = useTranslation()

  return(

    <Tabs value={activeTab} onValueChange={setActiveTab}>

      <TabsList>

        <TabsTrigger value="upcoming">
          {t("follow_ups.tab_upcoming")}
          {stats.pending > 0 &&
            <Badge className="ml-1 bg-muted text-muted-foreground">
              {stats.pending}
            </Badge>}
        </TabsTrigger>

        <TabsTrigger value="completed">
          {t("follow_ups.tab_completed")}
        </TabsTrigger>

        <TabsTrigger value="all">
          {t("follow_ups.tab_all")}
        </TabsTrigger>

      </TabsList>

      {children}

    </Tabs>

  )

}
