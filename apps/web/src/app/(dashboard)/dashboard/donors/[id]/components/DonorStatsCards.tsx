"use client";

import { useTranslation } from "react-i18next";
import { Calendar, Gift, IndianRupee, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "../utils";

interface DonorStatsCardsProps {
  totalDonations: number;
  donationsCount: number;
  averageDonation?: number;
  pendingPledges: number;
  totalPledges: number;
  specialOccasionsCount: number;
  familyMembersCount: number;
}

export default function DonorStatsCards({
  totalDonations,
  donationsCount,
  averageDonation,
  pendingPledges,
  totalPledges,
  specialOccasionsCount,
  familyMembersCount,
}: DonorStatsCardsProps) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("donor_profile.total_donations")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold" data-testid="text-total-donations">
              {formatCurrency(totalDonations.toString())}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("donor_profile.donations_count", { count: donationsCount })}
            {averageDonation && averageDonation > 0 && (
              <span className="ml-1 text-muted-foreground">
                · {t("donor_profile.avg")} {formatCurrency(averageDonation.toString())}
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("donor_profile.pending_pledges")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-600" />
            <span className="text-2xl font-bold">{pendingPledges}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("donor_profile.total_pledges", { count: totalPledges })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("donor_profile.tab_special_days")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-pink-600" />
            <span className="text-2xl font-bold">{specialOccasionsCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("donor_profile.special_days_hint")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("donor_profile.family_members")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-2xl font-bold">{familyMembersCount}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("donor_profile.family_members_hint")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
