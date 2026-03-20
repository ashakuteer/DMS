"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useTranslation } from "react-i18next"

export default function EngagementFilter({
  value,
  onChange
}:{
  value:string
  onChange:(v:string)=>void
}){
  const { t } = useTranslation()

  return(
    <div className="flex items-center gap-3 flex-wrap">

      <span className="text-sm font-medium text-muted-foreground">
        {t("follow_ups.filter_by_engagement")}
      </span>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue/>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="ALL">{t("follow_ups.all_levels")}</SelectItem>
          <SelectItem value="HOT">HOT</SelectItem>
          <SelectItem value="WARM">WARM</SelectItem>
          <SelectItem value="COLD">COLD</SelectItem>
        </SelectContent>
      </Select>

    </div>
  )

}
