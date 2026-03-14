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
    canEdit,
    isAdmin,
    photoUploading,
    handlePhotoUpload,
    handlePhotoRemove,
    metrics,
    metricsLoading,
    healthEvents,
    healthEventsLoading,
    healthTimeline,
    healthTimelineLoading,
    progressCards,
    progressCardsLoading,
    educationTimeline,
    educationTimelineLoading,
    educationExporting,
    documents,
    documentsLoading,
    growthChartData,
    exportingPdf,
    dialogs,
    actions,
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
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2"/>
        Back to Beneficiaries
      </Button>

      <BeneficiaryHeader
        beneficiary={beneficiary}
        canEdit={canEdit}
        isAdmin={isAdmin}
        photoUploading={photoUploading}
        onPhotoUpload={handlePhotoUpload}
        onPhotoRemove={handlePhotoRemove}
        onOpenLinkPhoto={actions.openLinkPhoto}
        onOpenEdit={actions.openEdit}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="sponsors" data-testid="tab-sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="updates" data-testid="tab-updates">Updates</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health">Health</TabsTrigger>
          <TabsTrigger value="academics" data-testid="tab-academics">Academics</TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BeneficiaryOverviewTab beneficiary={beneficiary}/>
        </TabsContent>

        <TabsContent value="sponsors">
          <BeneficiarySponsorsTab
            beneficiary={beneficiary}
            canEdit={canEdit}
            onOpenAddSponsor={actions.openAddSponsor}
            onOpenStatusChange={actions.openStatusChange}
            onViewHistory={actions.viewHistory}
            onDeleteSponsorship={actions.deleteSponsorship}
            onCopyMessage={actions.copyMessage}
            onViewDonorProfile={actions.viewDonorProfile}
            onSendWhatsApp={actions.sendWhatsApp}
          />
        </TabsContent>

        <TabsContent value="updates">
          <BeneficiaryUpdatesTab
            beneficiary={beneficiary}
            onOpenAddUpdate={actions.openAddUpdate}
            onOpenSendToSponsors={actions.openSendToSponsors}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <BeneficiaryTimelineTab
            timelineEvents={beneficiary.timelineEvents || []}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="health">
          <BeneficiaryHealthTab
            metrics={metrics}
            metricsLoading={metricsLoading}
            healthEvents={healthEvents}
            healthEventsLoading={healthEventsLoading}
            healthTimeline={healthTimeline}
            healthTimelineLoading={healthTimelineLoading}
            growthChartData={growthChartData}
            exportingPdf={exportingPdf}
            beneficiaryName={beneficiary.fullName}
            onOpenAddMetric={actions.openAddMetric}
            onOpenAddHealthEvent={actions.openAddHealthEvent}
            onExportHealthPdf={actions.exportHealthPdf}
            onNotifySponsors={actions.notifySponsors}
            onCopyHealthWhatsApp={actions.copyHealthWhatsApp}
          />
        </TabsContent>

        <TabsContent value="academics">
          <BeneficiaryAcademicsTab
            progressCards={progressCards}
            progressCardsLoading={progressCardsLoading}
            educationTimeline={educationTimeline}
            educationTimelineLoading={educationTimelineLoading}
            educationExporting={educationExporting}
            hasSponsors={(beneficiary.sponsorships || []).some((s: any) => s.isActive)}
            onExportEducationPdf={actions.exportEducationPdf}
            onOpenAddProgressCard={actions.openAddProgressCard}
            onShareProgressCard={actions.shareProgressCard}
          />
        </TabsContent>

        <TabsContent value="documents">
          <BeneficiaryDocumentsTab
            documents={documents}
            documentsLoading={documentsLoading}
            onOpenUploadDocument={actions.openUploadDocument}
            onViewDocument={actions.viewDocument}
          />
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
