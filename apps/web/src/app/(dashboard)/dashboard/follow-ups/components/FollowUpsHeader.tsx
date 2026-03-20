"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Props {
  refresh: () => void
}

export default function FollowUpsHeader({ refresh }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">{t("follow_ups.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("follow_ups.subtitle")}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={refresh}>
        <RefreshCw className="h-4 w-4 mr-2" />
        {t("common.refresh")}
      </Button>
    </div>
  )
}
