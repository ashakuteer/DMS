"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DonorSmartSummaryProps {
  totalDonations: number;
  donationsCount: number;
  lastDonationDate?: string | null;
  pendingPledges: number;
  specialOccasionsCount: number;
}

export default function DonorSmartSummary({
  totalDonations,
  donationsCount,
  lastDonationDate,
  pendingPledges,
  specialOccasionsCount,
}: DonorSmartSummaryProps) {
  const { t } = useTranslation();
  const insights: string[] = [];

  if (donationsCount === 0) {
    insights.push(t("donor_profile.insight_no_donations"));
  }

  if (donationsCount > 0 && totalDonations > 100000) {
    insights.push(t("donor_profile.insight_high_value"));
  }

  if (pendingPledges > 0) {
    insights.push(t("donor_profile.insight_pending_pledges", { count: pendingPledges }));
  }

  if (specialOccasionsCount > 0) {
    insights.push(t("donor_profile.insight_special_days"));
  }

  if (lastDonationDate) {
    insights.push(t("donor_profile.insight_last_donation", { date: lastDonationDate }));
  }

  if (insights.length === 0) {
    insights.push(t("donor_profile.insight_none"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          {t("donor_profile.smart_insights")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {insights.map((item, index) => (
          <div
            key={index}
            className="text-sm text-muted-foreground flex items-start gap-2"
          >
            <span className="text-yellow-500 mt-[2px]">•</span>
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
