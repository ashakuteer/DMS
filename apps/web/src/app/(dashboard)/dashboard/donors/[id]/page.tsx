"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

import { useDonorData } from "./hooks/useDonorData";
import { useDonorDonations } from "./hooks/useDonorDonations";
import { useDonorFamily } from "./hooks/useDonorFamily";
import { useDonorSpecialDays } from "./hooks/useDonorSpecialDays";
import { useDonorPledges } from "./hooks/useDonorPledges";
import { useDonorCommunication } from "./hooks/useDonorCommunication";
import { useDonorTimeline } from "./hooks/useDonorTimeline";
import { useDonorSponsorships } from "./hooks/useDonorSponsorships";

import DonorHeader from "./components/DonorHeader";
import DonorStatsCards from "./components/DonorStatsCards";
import DonorOverviewTab from "./components/DonorOverviewTab";
import DonorDonationsTab from "./components/DonorDonationsTab";
import DonorPledgesTab from "./components/DonorPledgesTab";
import DonorFamilyTab from "./components/DonorFamilyTab";
import DonorSpecialDaysTab from "./components/DonorSpecialDaysTab";
import DonorTimelineTab from "./components/DonorTimelineTab";
import DonorCommunicationLogTab from "./components/DonorCommunicationLogTab";
import DonorSponsorshipsTab from "./components/DonorSponsorshipsTab";
import DonorQuickActions from "./components/DonorQuickActions";
import AddDonorSponsorshipDialog from "./dialogs/AddDonorSponsorshipDialog";
import SponsorStatusDialog from "./dialogs/SponsorStatusDialog";
import SponsorHistoryDialog from "./dialogs/SponsorHistoryDialog";

function DonorProfileSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function DonorProfilePage() {

  const router = useRouter();
  const params = useParams();
  const donorId = params.id as string;

  const { t } = useTranslation();
  const user = authStorage.getUser();
  const canEdit = hasPermission(user?.role, "donors", "edit");
  const [requestingAccess, setRequestingAccess] = useState(false);

  // Track which tabs have been opened to enable lazy loading
  const [hasOpenedTimeline, setHasOpenedTimeline] = useState(false);
  const [hasOpenedCommLog, setHasOpenedCommLog] = useState(false);
  const [hasOpenedFamily, setHasOpenedFamily] = useState(false);
  const [hasOpenedSpecialDays, setHasOpenedSpecialDays] = useState(false);

  const handleRequestAccess = async () => {
    setRequestingAccess(true);
    try {
      await fetchWithAuth(`/api/donors/${donorId}/request-access`, { method: "POST" });
    } catch {
      console.error("Failed to request access");
    } finally {
      setRequestingAccess(false);
    }
  };

  const donorData = useDonorData(donorId);
  const donations = useDonorDonations(donorId, donorData.donor);
  const family = useDonorFamily(donorId, hasOpenedFamily);
  const specialDays = useDonorSpecialDays(donorId, hasOpenedSpecialDays);
  const pledges = useDonorPledges(donorId);
  const communication = useDonorCommunication(donorId, donorData.donor, donations.donations, hasOpenedCommLog);
  const timeline = useDonorTimeline(donorId, hasOpenedTimeline);
  const sponsorships = useDonorSponsorships(
    donorId,
    donorData.donor?.whatsappPhone || donorData.donor?.primaryPhone,
  );

  if (donorData.loading) return <DonorProfileSkeleton />;
  if (!donorData.donor) return <div>{t("donor_profile.not_found")}</div>;

  const donor = donorData.donor;

  const handleTabChange = (value: string) => {
    if (value === "timeline") setHasOpenedTimeline(true);
    if (value === "comm-log") setHasOpenedCommLog(true);
    if (value === "family") setHasOpenedFamily(true);
    if (value === "special-days") setHasOpenedSpecialDays(true);
  };

  return (
    <div className="p-6 space-y-6">

      <DonorHeader
        donor={donor}
        donorId={donorId}
        isDataMasked={false}
        canEdit={canEdit}
        requestingAccess={requestingAccess}
        getDonorName={donorData.getDonorName}
        getInitials={donorData.getInitials}
        onBack={() => router.back()}
        onEdit={() => router.push(`/dashboard/donors/${donorId}/edit`)}
        onRequestAccess={handleRequestAccess}
      />

      <DonorQuickActions
        donor={donor}
        donorId={donorId}
        templates={communication.templates}
        latestDonation={donations.donations[0] ?? null}
      />

      <DonorStatsCards
        totalDonations={donations.totalDonations}
        donationsCount={donations.donations.length}
        averageDonation={
          donations.donations.length > 0
            ? donations.totalDonations / donations.donations.length
            : 0
        }
        pendingPledges={pledges.pendingCount}
        totalPledges={pledges.pledges.length}
        specialOccasionsCount={
          (donor.specialOccasions?.length ?? specialDays.specialOccasions.length)
        }
        familyMembersCount={
          (donor.familyMembers?.length ?? family.familyMembers.length)
        }
      />

      <Tabs defaultValue="overview" onValueChange={handleTabChange}>

        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">{t("donor_profile.tab_overview")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("donor_profile.tab_timeline")}</TabsTrigger>
          <TabsTrigger value="donations">{t("donor_profile.tab_donations")}</TabsTrigger>
          <TabsTrigger value="pledges">{t("donor_profile.tab_pledges")}</TabsTrigger>
          <TabsTrigger value="family">{t("donor_profile.tab_family")}</TabsTrigger>
          <TabsTrigger value="special-days">{t("donor_profile.tab_special_days")}</TabsTrigger>
          <TabsTrigger value="sponsorships">{t("donor_profile.tab_sponsorships")}</TabsTrigger>
          <TabsTrigger value="comm-log">{t("donor_profile.tab_comm_log")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DonorOverviewTab donor={donor} isDataMasked={false} />
        </TabsContent>

        <TabsContent value="timeline">
          <DonorTimelineTab {...timeline} />
        </TabsContent>

        <TabsContent value="donations">
          <DonorDonationsTab {...donations} />
        </TabsContent>

        <TabsContent value="pledges">
          <DonorPledgesTab {...pledges} />
        </TabsContent>

        <TabsContent value="family">
          <DonorFamilyTab {...family} />
        </TabsContent>

        <TabsContent value="special-days">
          <DonorSpecialDaysTab {...specialDays} />
        </TabsContent>

        <TabsContent value="sponsorships">
          <DonorSponsorshipsTab
            sponsoredBeneficiaries={sponsorships.sponsoredBeneficiaries}
            sponsoredBeneficiariesLoading={sponsorships.sponsoredBeneficiariesLoading}
            canEditSponsorship={sponsorships.canEditSponsorship}
            donorPhone={donor.whatsappPhone || donor.primaryPhone}
            donorId={donorId}
            onViewAllBeneficiaries={sponsorships.onViewAllBeneficiaries}
            onOpenStatusChange={sponsorships.onOpenStatusChange}
            onViewHistory={sponsorships.onViewHistory}
            onSendUpdate={sponsorships.onSendUpdate}
            onCopyMessage={sponsorships.onCopyMessage}
            onViewBeneficiary={sponsorships.onViewBeneficiary}
            onAddSponsorship={sponsorships.onAddSponsorship}
            onDeleteSponsorship={sponsorships.onDeleteSponsorship}
          />
        </TabsContent>

        <TabsContent value="comm-log">
          <DonorCommunicationLogTab {...communication} />
        </TabsContent>

      </Tabs>

      <AddDonorSponsorshipDialog
        open={sponsorships.showAddDialog}
        onOpenChange={sponsorships.setShowAddDialog}
        form={sponsorships.sponsorshipForm}
        setForm={sponsorships.setSponsorshipForm}
        loading={sponsorships.addingSponsor}
        onSubmit={sponsorships.handleAddSponsorshipSubmit}
      />

      <SponsorStatusDialog
        open={sponsorships.showStatusDialog}
        onOpenChange={sponsorships.setShowStatusDialog}
        sponsorStatusTarget={sponsorships.sponsorStatusTarget}
        sponsorStatusData={sponsorships.sponsorStatusData}
        setSponsorStatusData={sponsorships.setSponsorStatusData}
        sponsorStatusLoading={sponsorships.sponsorStatusLoading}
        onConfirm={sponsorships.handleStatusConfirm}
      />

      <SponsorHistoryDialog
        open={sponsorships.showHistoryDialog}
        onOpenChange={sponsorships.setShowHistoryDialog}
        sponsorHistoryTarget={sponsorships.sponsorHistoryTarget}
        sponsorHistoryEntries={sponsorships.sponsorHistoryEntries}
        sponsorHistoryLoading={sponsorships.sponsorHistoryLoading}
      />

    </div>
  );
}
