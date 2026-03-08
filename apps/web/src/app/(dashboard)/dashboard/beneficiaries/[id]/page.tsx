"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

import { useBeneficiary } from "./hooks/useBeneficiary";

import BeneficiaryHeader from "./components/BeneficiaryHeader";
import BeneficiaryOverviewTab from "./components/BeneficiaryOverviewTab";
import BeneficiarySponsorsTab from "./components/BeneficiarySponsorsTab";
import BeneficiaryUpdatesTab from "./components/BeneficiaryUpdatesTab";
import BeneficiaryTimelineTab from "./components/BeneficiaryTimelineTab";
import BeneficiaryHealthTab from "./components/BeneficiaryHealthTab";
import BeneficiaryAcademicsTab from "./components/BeneficiaryAcademicsTab";
import BeneficiaryDocumentsTab from "./components/BeneficiaryDocumentsTab";

import AddSponsorDialog from "./dialogs/AddSponsorDialog";
import AddUpdateDialog from "./dialogs/AddUpdateDialog";
import SendToSponsorsDialog from "./dialogs/SendToSponsorsDialog";
import AddMetricDialog from "./dialogs/AddMetricDialog";
import AddHealthEventDialog from "./dialogs/AddHealthEventDialog";
import AddProgressCardDialog from "./dialogs/AddProgressCardDialog";
import UploadDocumentDialog from "./dialogs/UploadDocumentDialog";
import LinkPhotoDialog from "./dialogs/LinkPhotoDialog";
import EditBeneficiaryDialog from "./dialogs/EditBeneficiaryDialog";
import SponsorshipHistoryDialog from "./dialogs/SponsorshipHistoryDialog";
import SponsorshipStatusDialog from "./dialogs/SponsorshipStatusDialog";

export default function BeneficiaryProfilePage() {
  const params = useParams();
  const router = useRouter();
  const beneficiaryId = params.id as string;

  const {
    beneficiary,
    loading,
    activeTab,
    setActiveTab,
    dialogs,
    actions
  } = useBeneficiary(beneficiaryId);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!beneficiary) {
    return <div className="p-6">Beneficiary not found</div>;
  }

  return (
    <div className="p-6 space-y-6">

      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/beneficiaries")}
      >
        <ArrowLeft className="h-4 w-4 mr-2"/>
        Back to Beneficiaries
      </Button>

      <BeneficiaryHeader
        beneficiary={beneficiary}
        actions={actions}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>

          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>

        </TabsList>

        <TabsContent value="overview">
          <BeneficiaryOverviewTab beneficiary={beneficiary}/>
        </TabsContent>

        <TabsContent value="sponsors">
          <BeneficiarySponsorsTab beneficiary={beneficiary}/>
        </TabsContent>

        <TabsContent value="updates">
          <BeneficiaryUpdatesTab beneficiary={beneficiary}/>
        </TabsContent>

        <TabsContent value="timeline">
          <BeneficiaryTimelineTab beneficiary={beneficiary}/>
        </TabsContent>

        <TabsContent value="health">
          <BeneficiaryHealthTab beneficiary={beneficiary}/>
        </TabsContent>

        <TabsContent value="academics">
          <BeneficiaryAcademicsTab beneficiary={beneficiary}/>
        </TabsContent>

        <TabsContent value="documents">
          <BeneficiaryDocumentsTab beneficiary={beneficiary}/>
        </TabsContent>

      </Tabs>

      <AddSponsorDialog {...dialogs.addSponsor}/>
      <AddUpdateDialog {...dialogs.addUpdate}/>
      <SendToSponsorsDialog {...dialogs.sendToSponsors}/>
      <AddMetricDialog {...dialogs.addMetric}/>
      <AddHealthEventDialog {...dialogs.addHealthEvent}/>
      <AddProgressCardDialog {...dialogs.addProgressCard}/>
      <UploadDocumentDialog {...dialogs.uploadDocument}/>
      <LinkPhotoDialog {...dialogs.linkPhoto}/>
      <EditBeneficiaryDialog {...dialogs.editBeneficiary}/>
      <SponsorshipHistoryDialog {...dialogs.history}/>
      <SponsorshipStatusDialog {...dialogs.statusChange}/>

    </div>
  );
}
