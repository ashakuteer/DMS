"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

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
  const insights: string[] = [];

  if (donationsCount === 0) {
    insights.push("This donor has not made any donations yet.");
  }

  if (donationsCount > 0 && totalDonations > 100000) {
    insights.push("High value donor. Maintain regular engagement.");
  }

  if (pendingPledges > 0) {
    insights.push(`${pendingPledges} pledge(s) pending follow-up.`);
  }

  if (specialOccasionsCount > 0) {
    insights.push("Special days available for relationship engagement.");
  }

  if (lastDonationDate) {
    insights.push(`Last donation recorded on ${lastDonationDate}.`);
  }

  if (insights.length === 0) {
    insights.push("No special insights available yet.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Smart Relationship Insights
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
