"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function DonorProfilePage() {

  const router = useRouter();
  const params = useParams();
  const donorId = params.id as string;

  const user = authStorage.getUser();
  const canEdit = hasPermission(user?.role, "donors", "edit");
  const [requestingAccess, setRequestingAccess] = useState(false);

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
  const family = useDonorFamily(donorId);
  const specialDays = useDonorSpecialDays(donorId);
  const pledges = useDonorPledges(donorId);
  const communication = useDonorCommunication(donorId, donorData.donor, donations.donations);
  const timeline = useDonorTimeline(donorId);
  const sponsorships = useDonorSponsorships(
    donorId,
    donorData.donor?.whatsappPhone || donorData.donor?.primaryPhone,
  );

  if (donorData.loading) return <div>Loading...</div>;
  if (!donorData.donor) return <div>Donor not found</div>;

  const donor = donorData.donor;

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
        specialOccasionsCount={specialDays.specialOccasions.length}
        familyMembersCount={family.familyMembers.length}
      />

      <Tabs defaultValue="overview">

        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="pledges">Pledges</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="special-days">Special Days</TabsTrigger>
          <TabsTrigger value="sponsorships">Sponsorships</TabsTrigger>
          <TabsTrigger value="comm-log">Comm Log</TabsTrigger>
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
