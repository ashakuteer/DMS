"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import type {
  Beneficiary,
  Sponsorship,
  BeneficiaryMetric,
  ProgressCard,
  HealthEvent,
  BeneficiaryDocument,
  HealthTimelineItem,
  EducationTimelineItem,
  SponsorshipHistoryEntry,
  DonorSearchResult,
} from "../types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getTermLabel(term: string) {
  switch (term) {
    case "TERM_1": return "Term 1";
    case "TERM_2": return "Term 2";
    case "TERM_3": return "Term 3";
    case "ANNUAL": return "Annual";
    default: return term;
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function useBeneficiary(beneficiaryId: string) {
  const router = useRouter();
  const { toast } = useToast();

  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [metrics, setMetrics] = useState<BeneficiaryMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [progressCards, setProgressCards] = useState<ProgressCard[]>([]);
  const [progressCardsLoading, setProgressCardsLoading] = useState(false);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [healthEventsLoading, setHealthEventsLoading] = useState(false);
  const [documents, setDocuments] = useState<BeneficiaryDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [healthTimeline, setHealthTimeline] = useState<HealthTimelineItem[]>([]);
  const [healthTimelineLoading, setHealthTimelineLoading] = useState(false);
  const [educationTimeline, setEducationTimeline] = useState<EducationTimelineItem[]>([]);
  const [educationTimelineLoading, setEducationTimelineLoading] = useState(false);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [showLinkPhotoDialog, setShowLinkPhotoDialog] = useState(false);
  const [linkPhotoUrl, setLinkPhotoUrl] = useState("");

  const [showAddSponsorDialog, setShowAddSponsorDialog] = useState(false);
  const [addSponsorLoading, setAddSponsorLoading] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");
  const [donorSearchResults, setDonorSearchResults] = useState<DonorSearchResult[]>([]);
  const [donorSearchLoading, setDonorSearchLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<DonorSearchResult | null>(null);
  const [newSponsorship, setNewSponsorship] = useState({
    sponsorshipType: "FULL",
    amount: "",
    inKindItem: "",
    frequency: "ADHOC",
    startDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    fullName: "",
    homeType: "ORPHAN_GIRLS",
    gender: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    approxAge: "",
    joinDate: "",
    educationClassOrRole: "",
    schoolOrCollege: "",
    healthNotes: "",
    currentHealthStatus: "",
    background: "",
    hobbies: "",
    dreamCareer: "",
    favouriteSubject: "",
    favouriteGame: "",
    favouriteActivityAtHome: "",
    bestFriend: "",
    sourceOfPrideOrHappiness: "",
    funFact: "",
    additionalNotes: "",
    heightCmAtJoin: "",
    weightKgAtJoin: "",
    status: "ACTIVE",
  });

  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [statusChangeSponsorship, setStatusChangeSponsorship] = useState<Sponsorship | null>(null);
  const [statusChangeData, setStatusChangeData] = useState({ status: "", note: "" });
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historySponsorship, setHistorySponsorship] = useState<Sponsorship | null>(null);
  const [historyEntries, setHistoryEntries] = useState<SponsorshipHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showAddUpdateDialog, setShowAddUpdateDialog] = useState(false);
  const [addUpdateLoading, setAddUpdateLoading] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    title: "",
    content: "",
    updateType: "GENERAL" as string,
    isPrivate: false,
  });
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<string[]>([]);

  const [showSendToSponsorsDialog, setShowSendToSponsorsDialog] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [sponsorDispatchData, setSponsorDispatchData] = useState<any>(null);
  const [sendingToSponsors, setSendingToSponsors] = useState(false);

  const [showAddMetricDialog, setShowAddMetricDialog] = useState(false);
  const [addMetricLoading, setAddMetricLoading] = useState(false);
  const [newMetric, setNewMetric] = useState({
    recordedOn: format(new Date(), "yyyy-MM-dd"),
    heightCm: "",
    weightKg: "",
    healthStatus: "NORMAL",
    notes: "",
  });

  const [showAddHealthEventDialog, setShowAddHealthEventDialog] = useState(false);
  const [addHealthEventLoading, setAddHealthEventLoading] = useState(false);
  const [newHealthEvent, setNewHealthEvent] = useState({
    eventDate: format(new Date(), "yyyy-MM-dd"),
    title: "",
    description: "",
    severity: "LOW",
    requiresDonorUpdate: false,
    shareWithDonor: false,
  });
  const [healthEventFile, setHealthEventFile] = useState<File | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [showAddProgressCardDialog, setShowAddProgressCardDialog] = useState(false);
  const [addProgressCardLoading, setAddProgressCardLoading] = useState(false);
  const [newProgressCard, setNewProgressCard] = useState({
    academicYear: "",
    term: "TERM_1",
    classGrade: "",
    school: "",
    overallPercentage: "",
    remarks: "",
  });
  const [progressCardFile, setProgressCardFile] = useState<File | null>(null);
  const [educationExporting, setEducationExporting] = useState(false);

  const [showUploadDocumentDialog, setShowUploadDocumentDialog] = useState(false);
  const [uploadDocumentLoading, setUploadDocumentLoading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: "",
    docType: "OTHER",
    description: "",
    isSensitive: false,
    shareWithDonor: false,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const fetchBeneficiary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}`);
      if (!response.ok) throw new Error("Failed to fetch beneficiary");
      const data = await response.json();
      console.log("[Beneficiary Profile]", data.code, { photoUrl: data.photoUrl });
      setBeneficiary(data);
    } catch (error) {
      console.error("Failed to fetch beneficiary:", error);
      toast({ title: "Error", description: "Failed to load beneficiary profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [beneficiaryId, toast]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/metrics`);
      if (response.ok) setMetrics(await response.json().then((d: any) => Array.isArray(d) ? d : []));
    } catch { /* silent */ } finally { setMetricsLoading(false); }
  }, [beneficiaryId]);

  const fetchProgressCards = useCallback(async () => {
    setProgressCardsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/progress-cards`);
      if (response.ok) setProgressCards(await response.json().then((d: any) => Array.isArray(d) ? d : []));
    } catch { /* silent */ } finally { setProgressCardsLoading(false); }
  }, [beneficiaryId]);

  const fetchHealthEvents = useCallback(async () => {
    setHealthEventsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/health-events`);
      if (response.ok) setHealthEvents(await response.json().then((d: any) => Array.isArray(d) ? d : []));
    } catch { /* silent */ } finally { setHealthEventsLoading(false); }
  }, [beneficiaryId]);

  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`);
      if (response.ok) setDocuments(await response.json().then((d: any) => Array.isArray(d) ? d : []));
    } catch { /* silent */ } finally { setDocumentsLoading(false); }
  }, [beneficiaryId]);

  const fetchHealthTimeline = useCallback(async () => {
    setHealthTimelineLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/health-timeline`);
      if (response.ok) setHealthTimeline(await response.json().then((d: any) => Array.isArray(d) ? d : []));
    } catch { /* silent */ } finally { setHealthTimelineLoading(false); }
  }, [beneficiaryId]);

  const fetchEducationTimeline = useCallback(async () => {
    setEducationTimelineLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/education-timeline`);
      if (response.ok) setEducationTimeline(await response.json().then((d: any) => Array.isArray(d) ? d : []));
    } catch { /* silent */ } finally { setEducationTimelineLoading(false); }
  }, [beneficiaryId]);

  useEffect(() => {
    fetchBeneficiary().then(() => {
      fetchMetrics();
      fetchProgressCards();
      fetchHealthEvents();
      fetchDocuments();
      fetchHealthTimeline();
      fetchEducationTimeline();
    });
  }, [fetchBeneficiary, fetchMetrics, fetchProgressCards, fetchHealthEvents, fetchDocuments, fetchHealthTimeline, fetchEducationTimeline]);

  const searchDonors = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setDonorSearchResults([]); return; }
    setDonorSearchLoading(true);
    try {
      const response = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setDonorSearchResults(data.items || []);
      }
    } catch { /* silent */ } finally { setDonorSearchLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (donorSearch) searchDonors(donorSearch); }, 300);
    return () => clearTimeout(timer);
  }, [donorSearch, searchDonors]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !beneficiary) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Error", description: "Only JPG, PNG, and WebP images are allowed", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiary.id}/photo`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || `Upload failed (${response.status})`);
      }
      const data = await response.json();
      setBeneficiary(prev => prev ? { ...prev, photoUrl: data.photoUrl } : prev);
      toast({ title: "Success", description: "Photo uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Photo upload failed", description: error?.message || "Failed to upload photo", variant: "destructive" });
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const handlePhotoRemove = async () => {
    if (!beneficiary) return;
    setPhotoUploading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiary.id}/photo`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setBeneficiary(prev => prev ? { ...prev, photoUrl: undefined } : prev);
      toast({ title: "Success", description: "Photo removed" });
    } catch {
      toast({ title: "Error", description: "Failed to remove photo", variant: "destructive" });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleLinkPhoto = async () => {
    if (!beneficiary || !linkPhotoUrl.trim()) return;
    setPhotoUploading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiary.id}/photo/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: linkPhotoUrl.trim() }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to link photo");
      }
      const data = await response.json();
      setBeneficiary(prev => prev ? { ...prev, photoUrl: data.photoUrl } : prev);
      setShowLinkPhotoDialog(false);
      setLinkPhotoUrl("");
      toast({ title: "Success", description: "Photo linked successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to link photo", variant: "destructive" });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleAddSponsor = async () => {
    if (!selectedDonor) {
      toast({ title: "Error", description: "Please select a donor", variant: "destructive" });
      return;
    }
    setAddSponsorLoading(true);
    try {
      const payload: any = {
        donorId: selectedDonor.id,
        sponsorshipType: newSponsorship.sponsorshipType,
        frequency: newSponsorship.frequency,
      };
      if (newSponsorship.amount) payload.amount = parseFloat(newSponsorship.amount);
      if (newSponsorship.inKindItem) payload.inKindItem = newSponsorship.inKindItem;
      if (newSponsorship.startDate) payload.startDate = newSponsorship.startDate;
      if (newSponsorship.notes) payload.notes = newSponsorship.notes;

      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to add sponsor");
      }
      toast({ title: "Success", description: "Sponsor linked successfully" });
      setShowAddSponsorDialog(false);
      setSelectedDonor(null);
      setDonorSearch("");
      setNewSponsorship({ sponsorshipType: "FULL", amount: "", inKindItem: "", frequency: "ADHOC", startDate: format(new Date(), "yyyy-MM-dd"), notes: "" });
      fetchBeneficiary();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add sponsor", variant: "destructive" });
    } finally {
      setAddSponsorLoading(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    setAddUpdateLoading(true);
    try {
      const payload = { ...newUpdate, documentIds: selectedAttachmentIds.length > 0 ? selectedAttachmentIds : undefined };
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add update");
      toast({ title: "Success", description: "Update added successfully" });
      setShowAddUpdateDialog(false);
      setNewUpdate({ title: "", content: "", updateType: "GENERAL", isPrivate: false });
      setSelectedAttachmentIds([]);
      fetchBeneficiary();
    } catch {
      toast({ title: "Error", description: "Failed to add update", variant: "destructive" });
    } finally {
      setAddUpdateLoading(false);
    }
  };

  const handleOpenSendToSponsors = async (updateId: string) => {
    setSelectedUpdateId(updateId);
    setShowSendToSponsorsDialog(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiary-updates/${updateId}/sponsors`);
      if (response.ok) setSponsorDispatchData(await response.json());
    } catch {
      toast({ title: "Error", description: "Failed to load sponsor information", variant: "destructive" });
    }
  };

  const handleSendToSponsors = async (channel: "EMAIL" | "WHATSAPP") => {
    if (!selectedUpdateId) return;
    setSendingToSponsors(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiary-updates/${selectedUpdateId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      if (!response.ok) throw new Error("Failed to send update to sponsors");
      const result = await response.json();
      toast({ title: "Success", description: `Update sent to ${result.dispatchCount || 0} sponsor(s) via ${channel}` });
      setShowSendToSponsorsDialog(false);
      setSponsorDispatchData(null);
    } catch {
      toast({ title: "Error", description: "Failed to send update to sponsors", variant: "destructive" });
    } finally {
      setSendingToSponsors(false);
    }
  };

  const handleOpenStatusChange = (sponsorship: Sponsorship) => {
    setStatusChangeSponsorship(sponsorship);
    setStatusChangeData({ status: sponsorship.status || "ACTIVE", note: "" });
    setShowStatusChangeDialog(true);
  };

  const handleStatusChange = async () => {
    if (!statusChangeSponsorship) return;
    setStatusChangeLoading(true);
    try {
      const response = await fetchWithAuth(`/api/sponsorships/${statusChangeSponsorship.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusChangeData.status, notes: statusChangeData.note || undefined }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      toast({ title: "Success", description: "Sponsorship status updated" });
      setShowStatusChangeDialog(false);
      fetchBeneficiary();
    } catch {
      toast({ title: "Error", description: "Failed to update sponsorship status", variant: "destructive" });
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handleViewHistory = async (sponsorship: Sponsorship) => {
    setHistorySponsorship(sponsorship);
    setShowHistoryDialog(true);
    setHistoryLoading(true);
    try {
      const response = await fetchWithAuth(`/api/sponsorships/${sponsorship.id}/history`);
      if (!response.ok) throw new Error("Failed to fetch history");
      setHistoryEntries(await response.json());
    } catch {
      toast({ title: "Error", description: "Failed to load history", variant: "destructive" });
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteSponsorship = async (sponsorshipId: string) => {
    try {
      const response = await fetchWithAuth(`/api/sponsorships/${sponsorshipId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove sponsorship");
      toast({ title: "Success", description: "Sponsorship removed" });
      fetchBeneficiary();
    } catch {
      toast({ title: "Error", description: "Failed to remove sponsorship", variant: "destructive" });
    }
  };

  const handleAddMetric = async () => {
    setAddMetricLoading(true);
    try {
      const payload: any = { healthStatus: newMetric.healthStatus || "NORMAL" };
      if (newMetric.recordedOn) payload.recordedOn = newMetric.recordedOn;
      if (newMetric.heightCm) payload.heightCm = parseFloat(newMetric.heightCm);
      if (newMetric.weightKg) payload.weightKg = parseFloat(newMetric.weightKg);
      if (newMetric.notes) payload.notes = newMetric.notes;

      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add measurement");
      toast({ title: "Success", description: "Measurement recorded successfully" });
      setShowAddMetricDialog(false);
      setNewMetric({ recordedOn: format(new Date(), "yyyy-MM-dd"), heightCm: "", weightKg: "", healthStatus: "NORMAL", notes: "" });
      fetchMetrics();
      fetchHealthTimeline();
      fetchBeneficiary();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add measurement", variant: "destructive" });
    } finally {
      setAddMetricLoading(false);
    }
  };

  const handleAddHealthEvent = async () => {
    if (!newHealthEvent.title.trim() || !newHealthEvent.description.trim()) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }
    setAddHealthEventLoading(true);
    try {
      let documentId: string | undefined;
      if (healthEventFile) {
        const formData = new FormData();
        formData.append("file", healthEventFile);
        formData.append("title", `Medical: ${newHealthEvent.title}`);
        formData.append("docType", healthEventFile.type === "application/pdf" ? "PRESCRIPTION" : "MEDICAL_REPORT");
        formData.append("description", `Attached to health event: ${newHealthEvent.title}`);
        formData.append("shareWithDonor", "false");
        const uploadResponse = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`, { method: "POST", body: formData });
        if (uploadResponse.ok) documentId = (await uploadResponse.json()).id;
      }
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/health-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newHealthEvent, documentId }),
      });
      if (!response.ok) throw new Error("Failed to add health event");
      toast({ title: "Success", description: "Health event added successfully" });
      setShowAddHealthEventDialog(false);
      setNewHealthEvent({ eventDate: format(new Date(), "yyyy-MM-dd"), title: "", description: "", severity: "LOW", requiresDonorUpdate: false, shareWithDonor: false });
      setHealthEventFile(null);
      fetchHealthEvents();
      fetchHealthTimeline();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add health event", variant: "destructive" });
    } finally {
      setAddHealthEventLoading(false);
    }
  };

  const handleExportHealthPdf = async () => {
    setExportingPdf(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/health-history/export`);
      if (!response.ok) throw new Error("Failed to export");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health-history-${beneficiary?.code || beneficiaryId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Health history PDF downloaded" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to export health history", variant: "destructive" });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleNotifySponsors = async (eventId: string) => {
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/health-events/${eventId}/notify-sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to notify sponsors");
      toast({ title: "Success", description: "Sponsors notified successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to notify sponsors", variant: "destructive" });
    }
  };

  const handleCopyHealthWhatsApp = (event: HealthEvent) => {
    if (!beneficiary) return;
    const message = `Health Update for ${beneficiary.fullName}\n\nDate: ${format(new Date(event.eventDate), "dd MMM yyyy")}\nEvent: ${event.title}\n${event.description}`;
    navigator.clipboard.writeText(message);
    toast({ title: "Copied", description: "Health update copied to clipboard" });
  };

  const handleAddProgressCard = async () => {
    if (!newProgressCard.academicYear.trim() || !newProgressCard.classGrade.trim()) {
      toast({ title: "Error", description: "Academic year and class/grade are required", variant: "destructive" });
      return;
    }
    setAddProgressCardLoading(true);
    try {
      let fileDocumentId: string | undefined;
      if (progressCardFile) {
        const formData = new FormData();
        formData.append("file", progressCardFile);
        formData.append("title", `Report Card - ${newProgressCard.academicYear} ${newProgressCard.term}`);
        formData.append("docType", "REPORT_CARD");
        formData.append("description", `Progress card for ${newProgressCard.classGrade}, ${newProgressCard.term}`);
        formData.append("shareWithDonor", "true");
        const uploadResponse = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`, { method: "POST", body: formData });
        if (uploadResponse.ok) fileDocumentId = (await uploadResponse.json()).id;
      }
      const payload: any = {
        ...newProgressCard,
        overallPercentage: newProgressCard.overallPercentage ? parseFloat(newProgressCard.overallPercentage) : undefined,
      };
      if (fileDocumentId) payload.fileDocumentId = fileDocumentId;
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/progress-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to add progress card");
      toast({ title: "Success", description: "Progress card added" });
      setShowAddProgressCardDialog(false);
      setProgressCardFile(null);
      setNewProgressCard({ academicYear: "", term: "TERM_1", classGrade: "", school: "", overallPercentage: "", remarks: "" });
      fetchProgressCards();
      fetchEducationTimeline();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add progress card", variant: "destructive" });
    } finally {
      setAddProgressCardLoading(false);
    }
  };

  const handleExportEducationPdf = async () => {
    setEducationExporting(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/education-summary/export`);
      if (!response.ok) throw new Error("Failed to export education summary");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `education-summary-${beneficiary?.code || beneficiaryId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Education summary PDF downloaded" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to export", variant: "destructive" });
    } finally {
      setEducationExporting(false);
    }
  };

  const handleShareProgressCard = async (card: ProgressCard) => {
    if (!beneficiary) return;
    try {
      const updatePayload = {
        title: `Academic Progress - ${card.academicYear} ${getTermLabel(card.term)}`,
        content: `${beneficiary.fullName} has received their ${getTermLabel(card.term)} progress card for ${card.academicYear}.\n\nClass: ${card.classGrade}${card.school ? `\nSchool: ${card.school}` : ""}${card.overallPercentage != null ? `\nOverall Score: ${card.overallPercentage}%` : ""}${card.remarks ? `\nRemarks: ${card.remarks}` : ""}`,
        updateType: "ACADEMIC",
        isPrivate: false,
      };
      const createResponse = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      if (!createResponse.ok) throw new Error("Failed to create update");
      const createdUpdate = await createResponse.json();
      await handleOpenSendToSponsors(createdUpdate.id);
      fetchBeneficiary();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to share progress card", variant: "destructive" });
    }
  };

  const handleUploadDocument = async () => {
    if (!documentFile) {
      toast({ title: "Error", description: "Please select a file to upload", variant: "destructive" });
      return;
    }
    if (!newDocument.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    setUploadDocumentLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", documentFile);
      formData.append("title", newDocument.title);
      formData.append("docType", newDocument.docType);
      if (newDocument.description) formData.append("description", newDocument.description);
      formData.append("isSensitive", String(newDocument.isSensitive));
      formData.append("shareWithDonor", String(newDocument.shareWithDonor));
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`, { method: "POST", body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to upload document");
      }
      toast({ title: "Success", description: "Document uploaded successfully" });
      setShowUploadDocumentDialog(false);
      setNewDocument({ title: "", docType: "OTHER", description: "", isSensitive: false, shareWithDonor: false });
      setDocumentFile(null);
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload document", variant: "destructive" });
    } finally {
      setUploadDocumentLoading(false);
    }
  };

  const handleViewDocument = async (docId: string, storagePath: string) => {
    try {
      await fetchWithAuth(`/api/beneficiaries/documents/${docId}`);
    } catch { /* ignore */ } finally {
      window.open(storagePath, "_blank");
    }
  };

  const openEditDialog = () => {
    if (!beneficiary) return;
    setEditForm({
      fullName: beneficiary.fullName || "",
      homeType: beneficiary.homeType || "ORPHAN_GIRLS",
      gender: beneficiary.gender || "",
      dobDay: beneficiary.dobDay?.toString() || "",
      dobMonth: beneficiary.dobMonth?.toString() || "",
      dobYear: beneficiary.dobYear?.toString() || "",
      approxAge: beneficiary.approxAge?.toString() || "",
      joinDate: beneficiary.joinDate ? beneficiary.joinDate.split("T")[0] : "",
      educationClassOrRole: beneficiary.educationClassOrRole || "",
      schoolOrCollege: beneficiary.schoolOrCollege || "",
      healthNotes: beneficiary.healthNotes || "",
      currentHealthStatus: beneficiary.currentHealthStatus || "",
      background: beneficiary.background || "",
      hobbies: beneficiary.hobbies || "",
      dreamCareer: beneficiary.dreamCareer || "",
      favouriteSubject: beneficiary.favouriteSubject || "",
      favouriteGame: beneficiary.favouriteGame || "",
      favouriteActivityAtHome: beneficiary.favouriteActivityAtHome || "",
      bestFriend: beneficiary.bestFriend || "",
      sourceOfPrideOrHappiness: beneficiary.sourceOfPrideOrHappiness || "",
      funFact: beneficiary.funFact || "",
      additionalNotes: beneficiary.additionalNotes || "",
      heightCmAtJoin: beneficiary.heightCmAtJoin?.toString() || "",
      weightKgAtJoin: beneficiary.weightKgAtJoin?.toString() || "",
      status: beneficiary.status || "ACTIVE",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!beneficiary) return;
    setEditLoading(true);
    try {
      const payload: any = {
        fullName: editForm.fullName,
        homeType: editForm.homeType,
        status: editForm.status,
      };
      if (editForm.gender) payload.gender = editForm.gender;
      if (editForm.dobDay) payload.dobDay = parseInt(editForm.dobDay);
      if (editForm.dobMonth) payload.dobMonth = parseInt(editForm.dobMonth);
      if (editForm.dobYear) payload.dobYear = parseInt(editForm.dobYear);
      if (editForm.approxAge) payload.approxAge = parseInt(editForm.approxAge);
      if (editForm.joinDate) payload.joinDate = editForm.joinDate;
      if (editForm.educationClassOrRole) payload.educationClassOrRole = editForm.educationClassOrRole;
      if (editForm.schoolOrCollege) payload.schoolOrCollege = editForm.schoolOrCollege;
      if (editForm.healthNotes) payload.healthNotes = editForm.healthNotes;
      if (editForm.currentHealthStatus) payload.currentHealthStatus = editForm.currentHealthStatus;
      if (editForm.background) payload.background = editForm.background;
      if (editForm.hobbies) payload.hobbies = editForm.hobbies;
      if (editForm.dreamCareer) payload.dreamCareer = editForm.dreamCareer;
      if (editForm.favouriteSubject) payload.favouriteSubject = editForm.favouriteSubject;
      if (editForm.favouriteGame) payload.favouriteGame = editForm.favouriteGame;
      if (editForm.favouriteActivityAtHome) payload.favouriteActivityAtHome = editForm.favouriteActivityAtHome;
      if (editForm.bestFriend) payload.bestFriend = editForm.bestFriend;
      if (editForm.sourceOfPrideOrHappiness) payload.sourceOfPrideOrHappiness = editForm.sourceOfPrideOrHappiness;
      if (editForm.funFact) payload.funFact = editForm.funFact;
      if (editForm.additionalNotes) payload.additionalNotes = editForm.additionalNotes;
      if (editForm.heightCmAtJoin) payload.heightCmAtJoin = parseFloat(editForm.heightCmAtJoin);
      if (editForm.weightKgAtJoin) payload.weightKgAtJoin = parseFloat(editForm.weightKgAtJoin);

      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update beneficiary");
      }
      toast({ title: "Success", description: "Beneficiary updated successfully" });
      setShowEditDialog(false);
      fetchBeneficiary();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  };

  const generateWhatsAppMessage = (sponsorship: Sponsorship) => {
    if (!beneficiary) return "";
    const donorName = `${sponsorship.donor.firstName} ${sponsorship.donor.lastName || ""}`.trim();
    const message = `Dear ${donorName},\n\nThank you for your continued support for ${beneficiary.fullName} at Asha Kuteer Foundation.\n\nYour sponsorship means the world to them and helps us provide care, education, and a loving home.\n\nWith gratitude,\nAsha Kuteer Foundation`;
    return encodeURIComponent(message);
  };

  const handleCopyMessage = (sponsorship: Sponsorship) => {
    const message = decodeURIComponent(generateWhatsAppMessage(sponsorship));
    navigator.clipboard.writeText(message);
    toast({ title: "Copied", description: "Message copied to clipboard" });
  };

  const handleSendWhatsApp = (sponsorship: Sponsorship) => {
    const message = generateWhatsAppMessage(sponsorship);
    const phone = sponsorship.donor.primaryPhone?.replace(/\D/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleViewDonorProfile = (donorId: string) => {
    router.push(`/dashboard/donors/${donorId}`);
  };

  const growthChartData = useMemo(() => {
    const data: { date: string; dateLabel: string; heightCm?: number; weightKg?: number }[] = [];
    if (beneficiary && (beneficiary.heightCmAtJoin || beneficiary.weightKgAtJoin)) {
      const joinDate = beneficiary.joinDate
        ? new Date(beneficiary.joinDate)
        : beneficiary.createdAt
          ? new Date(beneficiary.createdAt)
          : null;
      if (joinDate) {
        data.push({
          date: joinDate.toISOString(),
          dateLabel: format(joinDate, "MMM yyyy"),
          heightCm: beneficiary.heightCmAtJoin || undefined,
          weightKg: beneficiary.weightKgAtJoin ? Number(beneficiary.weightKgAtJoin) : undefined,
        });
      }
    }
    metrics.forEach(m => {
      data.push({
        date: new Date(m.recordedOn).toISOString(),
        dateLabel: format(new Date(m.recordedOn), "MMM yyyy"),
        heightCm: m.heightCm || undefined,
        weightKg: m.weightKg ? Number(m.weightKg) : undefined,
      });
    });
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return data;
  }, [beneficiary, metrics]);

  const user = authStorage.getUser();
  const canEdit = user?.role === "ADMIN" || user?.role === "STAFF";
  const isAdmin = user?.role === "ADMIN";

  const dialogs = {
    addSponsor: {
      open: showAddSponsorDialog,
      onOpenChange: setShowAddSponsorDialog,
      beneficiaryName: beneficiary?.fullName || "",
      selectedDonor,
      donorSearch,
      donorSearchResults,
      donorSearchLoading,
      newSponsorship,
      addSponsorLoading,
      setSelectedDonor,
      setDonorSearch,
      setDonorSearchResults,
      setNewSponsorship,
      onSubmit: handleAddSponsor,
    },
    addUpdate: {
      open: showAddUpdateDialog,
      onOpenChange: setShowAddUpdateDialog,
      beneficiaryName: beneficiary?.fullName || "",
      newUpdate,
      setNewUpdate,
      addUpdateLoading,
      onSubmit: handleAddUpdate,
    },
    sendToSponsors: {
      open: showSendToSponsorsDialog,
      onOpenChange: setShowSendToSponsorsDialog,
      sending: sendingToSponsors,
      sponsorCount: sponsorDispatchData?.sponsorCount || 0,
      onSendEmail: () => handleSendToSponsors("EMAIL"),
      onSendWhatsapp: () => handleSendToSponsors("WHATSAPP"),
    },
    addMetric: {
      open: showAddMetricDialog,
      onOpenChange: setShowAddMetricDialog,
      newMetric,
      setNewMetric,
      loading: addMetricLoading,
      onSubmit: handleAddMetric,
    },
    addHealthEvent: {
      open: showAddHealthEventDialog,
      onOpenChange: setShowAddHealthEventDialog,
      beneficiaryName: beneficiary?.fullName || "",
      newHealthEvent,
      setNewHealthEvent,
      healthEventFile,
      setHealthEventFile,
      addHealthEventLoading,
      onSubmit: handleAddHealthEvent,
    },
    addProgressCard: {
      open: showAddProgressCardDialog,
      onOpenChange: setShowAddProgressCardDialog,
      beneficiaryName: beneficiary?.fullName || "",
      newProgressCard,
      setNewProgressCard,
      progressCardFile,
      setProgressCardFile,
      addProgressCardLoading,
      onSubmit: handleAddProgressCard,
    },
    uploadDocument: {
      open: showUploadDocumentDialog,
      onOpenChange: setShowUploadDocumentDialog,
      beneficiaryName: beneficiary?.fullName || "",
      newDocument,
      setNewDocument,
      documentFile,
      setDocumentFile,
      uploadDocumentLoading,
      formatFileSize,
      onSubmit: handleUploadDocument,
    },
    linkPhoto: {
      open: showLinkPhotoDialog,
      onOpenChange: setShowLinkPhotoDialog,
      linkPhotoUrl,
      setLinkPhotoUrl,
      photoUploading,
      onSubmit: handleLinkPhoto,
    },
    editBeneficiary: {
      open: showEditDialog,
      onOpenChange: setShowEditDialog,
      editForm,
      setEditForm,
      editLoading,
      months: MONTHS,
      onSubmit: handleSaveEdit,
      photoUrl: beneficiary?.photoUrl ?? undefined,
      photoUploading,
      onPhotoUpload: handlePhotoUpload,
      onPhotoRemove: handlePhotoRemove,
    },
    history: {
      open: showHistoryDialog,
      onOpenChange: setShowHistoryDialog,
      historySponsorship,
      historyEntries,
      historyLoading,
    },
    statusChange: {
      open: showStatusChangeDialog,
      onOpenChange: setShowStatusChangeDialog,
      statusChangeSponsorship,
      statusChangeData,
      setStatusChangeData,
      statusChangeLoading,
      onSubmit: handleStatusChange,
    },
  };

  return {
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
    actions: {
      openAddSponsor: () => setShowAddSponsorDialog(true),
      openStatusChange: handleOpenStatusChange,
      viewHistory: handleViewHistory,
      deleteSponsorship: handleDeleteSponsorship,
      copyMessage: handleCopyMessage,
      viewDonorProfile: handleViewDonorProfile,
      sendWhatsApp: handleSendWhatsApp,
      openAddUpdate: () => setShowAddUpdateDialog(true),
      openSendToSponsors: handleOpenSendToSponsors,
      openAddMetric: () => setShowAddMetricDialog(true),
      openAddHealthEvent: () => setShowAddHealthEventDialog(true),
      exportHealthPdf: handleExportHealthPdf,
      notifySponsors: handleNotifySponsors,
      copyHealthWhatsApp: handleCopyHealthWhatsApp,
      openAddProgressCard: () => setShowAddProgressCardDialog(true),
      exportEducationPdf: handleExportEducationPdf,
      shareProgressCard: handleShareProgressCard,
      openUploadDocument: () => setShowUploadDocumentDialog(true),
      viewDocument: handleViewDocument,
      openEdit: openEditDialog,
      openLinkPhoto: () => setShowLinkPhotoDialog(true),
    },
  };
}
