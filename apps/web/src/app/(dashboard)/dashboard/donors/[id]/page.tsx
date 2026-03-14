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

import DonorHeader from "./components/DonorHeader";
import DonorStatsCards from "./components/DonorStatsCards";
import DonorOverviewTab from "./components/DonorOverviewTab";
import DonorDonationsTab from "./components/DonorDonationsTab";
import DonorPledgesTab from "./components/DonorPledgesTab";
import DonorFamilyTab from "./components/DonorFamilyTab";
import DonorSpecialDaysTab from "./components/DonorSpecialDaysTab";
import DonorTimelineTab from "./components/DonorTimelineTab";
import DonorCommunicationTab from "./components/DonorCommunicationTab";
import DonorCommunicationLogTab from "./components/DonorCommunicationLogTab";

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

      <DonorStatsCards
        totalDonations={donations.totalDonations}
        donationsCount={donations.donations.length}
        pendingPledges={pledges.pendingCount}
        totalPledges={pledges.pledges.length}
        specialOccasionsCount={specialDays.specialOccasions.length}
        familyMembersCount={family.familyMembers.length}
      />

      <Tabs defaultValue="overview">

        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="pledges">Pledges</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="special-days">Special Days</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
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

        <TabsContent value="communication">
          <DonorCommunicationTab {...communication} />
        </TabsContent>

        <TabsContent value="comm-log">
          <DonorCommunicationLogTab {...communication} />
        </TabsContent>

      </Tabs>

    </div>
  );
}
