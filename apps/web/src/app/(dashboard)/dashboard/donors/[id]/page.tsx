"use client";

import AssignDonorOwner from "./components/AssignDonorOwner";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

import type {
  Donor,
  Donation,
  DonationFormData,
  Pledge,
  PledgeFormData,
  SpecialOccasion,
  SpecialOccasionFormData,
  FamilyMember,
  FamilyMemberFormData,
  Template,
  CommunicationLog,
  SponsoredBeneficiary,
  UserProfile,
  TimelineItem,
} from "./types";

import {
  formatCurrency,
  formatDate,
  formatMonthDay,
  getOccasionTypeLabel,
  getRelationTypeLabel,
} from "./utils";

import DonorHeader from "./components/DonorHeader";
import DonorStatsCards from "./components/DonorStatsCards";
import DonorSmartSummary from "./components/DonorSmartSummary";
import DonorOverviewTab from "./components/DonorOverviewTab";
import DonorSponsorshipsTab from "./components/DonorSponsorshipsTab";
import DonorTimelineTab from "./components/DonorTimelineTab";
import DonorDonationsTab from "./components/DonorDonationsTab";
import DonorPledgesTab from "./components/DonorPledgesTab";
import DonorSpecialDaysTab from "./components/DonorSpecialDaysTab";
import DonorFamilyTab from "./components/DonorFamilyTab";
import DonorCommunicationTab from "./components/DonorCommunicationTab";
import DonorCommunicationLogTab from "./components/DonorCommunicationLogTab";

import DonationDialog from "./dialogs/DonationDialog";
import EmailDialog from "./dialogs/EmailDialog";
import FamilyMemberDialog from "./dialogs/FamilyMemberDialog";
import SpecialOccasionDialog from "./dialogs/SpecialOccasionDialog";
import PledgeDialog from "./dialogs/PledgeDialog";
import FulfillPledgeDialog from "./dialogs/FulfillPledgeDialog";
import PostponePledgeDialog from "./dialogs/PostponePledgeDialog";
import CancelPledgeDialog from "./dialogs/CancelPledgeDialog";
import SponsorStatusDialog from "./dialogs/SponsorStatusDialog";
import SponsorHistoryDialog from "./dialogs/SponsorHistoryDialog";

export default function DonorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const donorId = params.id as string;
  const { toast } = useToast();

  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);

  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  const [donorInsights, setDonorInsights] = useState<{
    avgDonation: number;
    frequency: string;
    lastDonationDaysAgo: number | null;
    preferredMode: string;
    preferredDonationType: string;
    mostSponsoredHome: string;
    sponsoredBeneficiariesCount: number;
    totalDonations: number;
    donationCount: number;
  } | null>(null);

  const [donationForm, setDonationForm] = useState<DonationFormData>({
    donationAmount: "",
    donationDate: new Date().toISOString().split("T")[0],
    donationMode: "CASH",
    donationType: "CASH",
    designatedHome: "NONE",
    remarks: "",
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    toEmail: "",
    subject: "",
    body: "",
    attachReceipt: false,
    templateId: undefined as string | undefined,
  });
  const [selectedDonationForEmail, setSelectedDonationForEmail] = useState<Donation | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [showPostDonationPrompt, setShowPostDonationPrompt] = useState(false);
  const [newlyCreatedDonation, setNewlyCreatedDonation] = useState<Donation | null>(null);
  const [resendingReceiptId, setResendingReceiptId] = useState<string | null>(null);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMembersLoading, setFamilyMembersLoading] = useState(false);
  const [showFamilyMemberModal, setShowFamilyMemberModal] = useState(false);
  const [editingFamilyMember, setEditingFamilyMember] = useState<FamilyMember | null>(null);
  const [familyMemberForm, setFamilyMemberForm] = useState<FamilyMemberFormData>({
    name: "",
    relationType: "SPOUSE",
    birthMonth: "",
    birthDay: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [savingFamilyMember, setSavingFamilyMember] = useState(false);
  const [deletingFamilyMemberId, setDeletingFamilyMemberId] = useState<string | null>(null);

  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasion[]>([]);
  const [upcomingOccasions, setUpcomingOccasions] = useState<(SpecialOccasion & { daysUntil: number })[]>([]);
  const [specialOccasionsLoading, setSpecialOccasionsLoading] = useState(false);
  const [showSpecialOccasionModal, setShowSpecialOccasionModal] = useState(false);
  const [editingSpecialOccasion, setEditingSpecialOccasion] = useState<SpecialOccasion | null>(null);
  const [specialOccasionForm, setSpecialOccasionForm] = useState<SpecialOccasionFormData>({
    type: "DOB_SELF",
    month: "",
    day: "",
    relatedPersonName: "",
    notes: "",
  });
  const [savingSpecialOccasion, setSavingSpecialOccasion] = useState(false);
  const [deletingSpecialOccasionId, setDeletingSpecialOccasionId] = useState<string | null>(null);

  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [pledgesLoading, setPledgesLoading] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [editingPledge, setEditingPledge] = useState<Pledge | null>(null);
  const [pledgeForm, setPledgeForm] = useState<PledgeFormData>({
    pledgeType: "MONEY",
    amount: "",
    quantity: "",
    expectedFulfillmentDate: "",
    notes: "",
  });
  const [savingPledge, setSavingPledge] = useState(false);
  const [pledgeActionLoading, setPledgeActionLoading] = useState<string | null>(null);

  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [fulfillPledgeId, setFulfillPledgeId] = useState<string | null>(null);
  const [fulfillForm, setFulfillForm] = useState({
    autoCreateDonation: true,
    donationAmount: "",
    donationDate: new Date().toISOString().split("T")[0],
    donationMode: "CASH",
    remarks: "",
  });

  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [postponePledgeId, setPostponePledgeId] = useState<string | null>(null);
  const [postponeForm, setPostponeForm] = useState({
    newDate: "",
    notes: "",
  });

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelPledgeId, setCancelPledgeId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [sponsoredBeneficiaries, setSponsoredBeneficiaries] = useState<SponsoredBeneficiary[]>([]);
  const [sponsoredBeneficiariesLoading, setSponsoredBeneficiariesLoading] = useState(false);

  const [showSponsorStatusDialog, setShowSponsorStatusDialog] = useState(false);
  const [sponsorStatusTarget, setSponsorStatusTarget] = useState<SponsoredBeneficiary | null>(null);
  const [sponsorStatusData, setSponsorStatusData] = useState({
    status: "",
    note: "",
  });
  const [sponsorStatusLoading, setSponsorStatusLoading] = useState(false);

  const [showSponsorHistoryDialog, setShowSponsorHistoryDialog] = useState(false);
  const [sponsorHistoryTarget, setSponsorHistoryTarget] = useState<SponsoredBeneficiary | null>(null);
  const [sponsorHistoryEntries, setSponsorHistoryEntries] = useState<any[]>([]);
  const [sponsorHistoryLoading, setSponsorHistoryLoading] = useState(false);

  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotal, setTimelineTotal] = useState(0);
  const [timelineTotalPages, setTimelineTotalPages] = useState(0);
  const [timelineTypeCounts, setTimelineTypeCounts] = useState<Record<string, number>>({});
  const [timelineTypeFilter, setTimelineTypeFilter] = useState<string[]>([]);
  const [timelineStartDate, setTimelineStartDate] = useState("");
  const [timelineEndDate, setTimelineEndDate] = useState("");

  const canViewLogs = user?.role === "ADMIN" || user?.role === "STAFF";
  const canDeleteLogs = user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const canEdit = user?.role === "ADMIN" || user?.role === "STAFF" || user?.role === "TELECALLER";
  const canEditSponsorship = user?.role === "ADMIN" || user?.role === "STAFF";
  const canEditFamilyAndSpecialDays = user?.role === "ADMIN" || user?.role === "STAFF";
  const canSendWhatsApp = user?.role === "ADMIN" || user?.role === "STAFF";
  const canSendEmail = user?.role === "ADMIN" || user?.role === "STAFF";
  const isDataMasked = !isAdmin;

  const getDonorName = () => {
    if (!donor) return "";
    return [donor.firstName, donor.middleName, donor.lastName].filter(Boolean).join(" ");
  };

  const getInitials = () => {
    if (!donor) return "";
    const first = donor.firstName?.[0] || "";
    const last = donor.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getEmail = () => donor?.personalEmail || donor?.officialEmail || null;

  const getWhatsAppNumber = () => {
    const phone = donor?.whatsappPhone || donor?.primaryPhone;
    if (!phone) return null;
    return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  };

  const getDonorE164Phone = (): string | null => {
    const phone = donor?.whatsappPhone || donor?.primaryPhone;
    if (!phone) return null;
    let digits = phone.replace(/[^\d]/g, "");
    if (!digits || digits.length < 10) return null;
    const code = (donor?.primaryPhoneCode || "+91").replace(/[^\d]/g, "");
    if (phone.startsWith("+")) return "+" + digits;
    if (digits.startsWith(code) && digits.length > 10) return "+" + digits;
    if (digits.length === 10) return "+" + code + digits;
    return "+" + code + digits;
  };

  const hasWhatsAppNumber = !!getWhatsAppNumber();
  const hasEmail = !!getEmail();

  const resolvePlaceholders = (template: string, donation?: Donation) => {
    let result = template;
    result = result.replace(/\{\{donor_name\}\}/g, getDonorName());
    result = result.replace(/\{\{amount\}\}/g, donation ? formatCurrency(donation.donationAmount) : "[Amount]");
    result = result.replace(/\{\{donation_date\}\}/g, donation ? formatDate(donation.donationDate) : "[Date]");
    result = result.replace(/\{\{program_name\}\}/g, "General Fund");
    result = result.replace(/\{\{receipt_number\}\}/g, donation?.receiptNumber || "[Receipt #]");
    return result;
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard. Paste it in WhatsApp or your email client.",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const fetchTimeline = useCallback(async (page = 1, types: string[] = [], startDate = "", endDate = "") => {
    try {
      setTimelineLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (types.length > 0) params.set("types", types.join(","));
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetchWithAuth(`/api/donors/${donorId}/timeline?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTimelineItems(data.items || []);
        setTimelineTotal(data.total || 0);
        setTimelineTotalPages(data.totalPages || 0);
        setTimelineTypeCounts(data.typeCounts || {});
        setTimelinePage(page);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
      toast({
        title: "Error",
        description: "Failed to load timeline",
        variant: "destructive",
      });
    } finally {
      setTimelineLoading(false);
    }
  }, [donorId, toast]);

  const fetchDonor = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/donors/${donorId}`);

      if (res.ok) {
        const data = await res.json();
        setDonor(data);
      } else if (res.status === 403) {
        toast({
          title: "Access Denied",
          description: "You do not have permission to view this donor",
          variant: "destructive",
        });
        router.push("/dashboard/donors");
      } else if (res.status === 404) {
        toast({
          title: "Not Found",
          description: "Donor not found",
          variant: "destructive",
        });
        router.push("/dashboard/donors");
      }
    } catch (error) {
      console.error("Error fetching donor:", error);
    } finally {
      setLoading(false);
    }
  }, [donorId, router, toast]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/auth/profile");
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      }
    } catch {}
  }, []);

  const fetchDonations = useCallback(async () => {
    try {
      setDonationsLoading(true);
      const res = await fetchWithAuth(`/api/donations?donorId=${donorId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setDonations(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setDonationsLoading(false);
    }
  }, [donorId]);

  const fetchDonorInsights = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/dashboard/donor-insights/${donorId}`);
      if (res.ok) {
        const data = await res.json();
        setDonorInsights(data);
      }
    } catch (error) {
      console.error("Error fetching donor insights:", error);
    }
  }, [donorId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, []);

  const fetchCommunicationLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await fetchWithAuth(`/api/communication-logs/donor/${donorId}`);
      if (res.ok) {
        const data = await res.json();
        setCommunicationLogs(data);
      }
    } catch (error) {
      console.error("Error fetching communication logs:", error);
    } finally {
      setLogsLoading(false);
    }
  }, [donorId]);

  const fetchFamilyMembers = useCallback(async () => {
    try {
      setFamilyMembersLoading(true);
      const res = await fetchWithAuth(`/api/donor-relations/donors/${donorId}/family-members`);
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data);
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
    } finally {
      setFamilyMembersLoading(false);
    }
  }, [donorId]);

  const fetchSpecialOccasions = useCallback(async () => {
    try {
      setSpecialOccasionsLoading(true);
      const [occasionsRes, upcomingRes] = await Promise.all([
        fetchWithAuth(`/api/donor-relations/donors/${donorId}/special-occasions`),
        fetchWithAuth(`/api/donor-relations/donors/${donorId}/special-occasions/upcoming?days=30`),
      ]);

      if (occasionsRes.ok) {
        const data = await occasionsRes.json();
        setSpecialOccasions(data);
      }
      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingOccasions(data);
      }
    } catch (error) {
      console.error("Error fetching special occasions:", error);
    } finally {
      setSpecialOccasionsLoading(false);
    }
  }, [donorId]);

  const fetchPledges = useCallback(async () => {
    try {
      setPledgesLoading(true);
      const res = await fetchWithAuth(`/api/pledges?donorId=${donorId}`);
      if (res.ok) {
        const data = await res.json();
        setPledges(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching pledges:", error);
    } finally {
      setPledgesLoading(false);
    }
  }, [donorId]);

  const fetchSponsoredBeneficiaries = useCallback(async () => {
    try {
      setSponsoredBeneficiariesLoading(true);
      const res = await fetchWithAuth(`/api/donors/${donorId}/sponsorships`);
      if (res.ok) {
        const data = await res.json();
        setSponsoredBeneficiaries(data || []);
      }
    } catch (error) {
      console.error("Error fetching sponsored beneficiaries:", error);
    } finally {
      setSponsoredBeneficiariesLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchProfile();
    fetchDonor();
    fetchDonations();
    fetchDonorInsights();
    fetchTemplates();
    fetchFamilyMembers();
    fetchSpecialOccasions();
    fetchPledges();
    fetchSponsoredBeneficiaries();
    fetchTimeline();
  }, [
    fetchProfile,
    fetchDonor,
    fetchDonations,
    fetchDonorInsights,
    fetchTemplates,
    fetchFamilyMembers,
    fetchSpecialOccasions,
    fetchPledges,
    fetchSponsoredBeneficiaries,
    fetchTimeline,
  ]);

  useEffect(() => {
    if (canViewLogs && donorId) {
      fetchCommunicationLogs();
    }
  }, [canViewLogs, donorId, fetchCommunicationLogs]);

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donationForm.donationAmount || !donationForm.donationDate) {
      toast({
        title: "Validation Error",
        description: "Amount and date are required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      donorId,
      donationAmount: parseFloat(donationForm.donationAmount),
      donationDate: donationForm.donationDate,
      donationMode: donationForm.donationMode,
      donationType: donationForm.donationType,
      donationHomeType:
        donationForm.designatedHome === "NONE" ? null : donationForm.designatedHome || null,
      remarks: donationForm.remarks || null,
    };

    try {
      setSubmittingDonation(true);
      const res = await fetchWithAuth("/api/donations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newDonation = await res.json();
        toast({
          title: "Donation Recorded",
          description: `Receipt: ${newDonation.receiptNumber}`,
        });
        setShowDonationModal(false);
        setDonationForm({
          donationAmount: "",
          donationDate: new Date().toISOString().split("T")[0],
          donationMode: "CASH",
          donationType: "CASH",
          designatedHome: "NONE",
          remarks: "",
        });
        fetchDonations();
        fetchDonor();

        if (user?.role === "ADMIN") {
          setNewlyCreatedDonation(newDonation);
          setShowPostDonationPrompt(true);
        }
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to record donation",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("[Donation Form] Exception:", err);
      toast({
        title: "Error",
        description: "Failed to record donation",
        variant: "destructive",
      });
    } finally {
      setSubmittingDonation(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      setRequestingAccess(true);
      const res = await fetchWithAuth(`/api/donors/${donorId}/request-access`, {
        method: "POST",
      });

      if (res.ok) {
        toast({
          title: "Access Requested",
          description: "Your request has been logged. An admin will review it.",
        });
      } else {
        const error = await res.json();
        toast({
          title: "Request Failed",
          description: error.message || "Failed to request access",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to request access",
        variant: "destructive",
      });
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleOpenSponsorStatusChange = (s: SponsoredBeneficiary) => {
    setSponsorStatusTarget(s);
    setSponsorStatusData({ status: s.status || "ACTIVE", note: "" });
    setShowSponsorStatusDialog(true);
  };

  const handleSponsorStatusChange = async () => {
    if (!sponsorStatusTarget) return;
    setSponsorStatusLoading(true);
    try {
      const response = await fetchWithAuth(`/api/sponsorships/${sponsorStatusTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: sponsorStatusData.status,
          notes: sponsorStatusData.note || undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      toast({ title: "Success", description: "Sponsorship status updated" });
      setShowSponsorStatusDialog(false);
      fetchSponsoredBeneficiaries();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update sponsorship status",
        variant: "destructive",
      });
    } finally {
      setSponsorStatusLoading(false);
    }
  };

  const handleViewSponsorHistory = async (s: SponsoredBeneficiary) => {
    setSponsorHistoryTarget(s);
    setShowSponsorHistoryDialog(true);
    setSponsorHistoryLoading(true);
    try {
      const response = await fetchWithAuth(`/api/sponsorships/${s.id}/history`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setSponsorHistoryEntries(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
      setSponsorHistoryEntries([]);
    } finally {
      setSponsorHistoryLoading(false);
    }
  };

  const openEmailComposer = (template: Template | null, donation: Donation | null) => {
    const latestDonation = donation || donations[0];
    let subject = "";
    let body = "";

    if (template) {
      subject = resolvePlaceholders(template.emailSubject, latestDonation);
      body = resolvePlaceholders(template.emailBody, latestDonation);
    } else if (latestDonation) {
      subject = `Thank you for your donation - Receipt #${latestDonation.receiptNumber}`;
      body = `Dear ${getDonorName()},\n\nThank you for your generous donation of ${formatCurrency(
        latestDonation.donationAmount,
      )} on ${formatDate(latestDonation.donationDate)}.\n\nYour support means a lot to us.\n\nWarm regards,\nAsha Kuteer Foundation`;
    }

    setEmailForm({
      toEmail: getEmail() || "",
      subject,
      body,
      attachReceipt: !!latestDonation?.receiptNumber,
      templateId: template?.id,
    });

    setSelectedDonationForEmail(donation || latestDonation || null);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailForm.toEmail || !emailForm.subject || !emailForm.body) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingEmail(true);
      const res = await fetchWithAuth("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: donor?.id,
          donationId: selectedDonationForEmail?.id || undefined,
          templateId: emailForm.templateId || undefined,
          toEmail: emailForm.toEmail,
          subject: emailForm.subject,
          body: emailForm.body,
          attachReceipt: emailForm.attachReceipt && !!selectedDonationForEmail?.receiptNumber,
        }),
      });

      if (res.ok) {
        toast({
          title: "Email Sent",
          description: "Email was sent successfully",
        });
        setShowEmailModal(false);
        fetchCommunicationLogs();
      } else {
        const data = await res.json();
        const errorDetail = data.message || "Could not send email";
        const friendlyMsg = errorDetail.replace(/^Failed to send email:\s*/i, "");
        toast({
          title: "Failed to Send",
          description: friendlyMsg || "Could not send email. Please check SMTP settings.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const openWhatsApp = async (
    message: string,
    _templateId?: string,
    _donationId?: string,
    type?: string,
  ) => {
    const phone = getWhatsAppNumber();
    if (!phone || !donor?.id) return;

    try {
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
        method: "POST",
        body: JSON.stringify({
          donorId: donor.id,
          toE164: phone,
          message,
          type: type || "GENERAL",
        }),
      });

      if (res.ok) {
        toast({ title: "WhatsApp Sent", description: "Message sent via WhatsApp" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "WhatsApp Failed",
          description: err.message || "Could not send",
          variant: "destructive",
        });
      }
      fetchCommunicationLogs();
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to send WhatsApp",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!canDeleteLogs) return;
    try {
      const res = await fetchWithAuth(`/api/communication-logs/${logId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Log Deleted",
          description: "Communication log was deleted",
        });
        fetchCommunicationLogs();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete log",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete log",
        variant: "destructive",
      });
    }
  };

  const handleResendReceipt = async (donationId: string) => {
    if (!hasEmail) {
      toast({
        title: "Cannot Send Receipt",
        description: "This donor does not have an email address on file",
        variant: "destructive",
      });
      return;
    }

    try {
      setResendingReceiptId(donationId);
      const res = await fetchWithAuth(`/api/donations/${donationId}/resend-receipt`, {
        method: "POST",
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Receipt Sent",
          description: result.message || "Receipt was emailed successfully",
        });
        if (canViewLogs) fetchCommunicationLogs();
      } else {
        const error = await res.json();
        toast({
          title: "Failed to Send",
          description: error.message || "Could not re-send receipt",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to re-send receipt",
        variant: "destructive",
      });
    } finally {
      setResendingReceiptId(null);
    }
  };

  const resetFamilyMemberForm = () => {
    setFamilyMemberForm({
      name: "",
      relationType: "SPOUSE",
      birthMonth: "",
      birthDay: "",
      phone: "",
      email: "",
      notes: "",
    });
    setEditingFamilyMember(null);
  };

  const openAddFamilyMemberModal = () => {
    resetFamilyMemberForm();
    setShowFamilyMemberModal(true);
  };

  const openEditFamilyMemberModal = (member: FamilyMember) => {
    setEditingFamilyMember(member);
    setFamilyMemberForm({
      name: member.name,
      relationType: member.relationType,
      birthMonth: member.birthMonth ? String(member.birthMonth) : "",
      birthDay: member.birthDay ? String(member.birthDay) : "",
      phone: member.phone || "",
      email: member.email || "",
      notes: member.notes || "",
    });
    setShowFamilyMemberModal(true);
  };

  const handleSaveFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyMemberForm.name || !familyMemberForm.relationType) {
      toast({
        title: "Validation Error",
        description: "Name and relation type are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingFamilyMember(true);
      const payload = {
        name: familyMemberForm.name,
        relationType: familyMemberForm.relationType,
        birthMonth: familyMemberForm.birthMonth ? parseInt(familyMemberForm.birthMonth) : null,
        birthDay: familyMemberForm.birthDay ? parseInt(familyMemberForm.birthDay) : null,
        phone: familyMemberForm.phone || null,
        email: familyMemberForm.email || null,
        notes: familyMemberForm.notes || null,
      };

      let res;
      if (editingFamilyMember) {
        res = await fetchWithAuth(`/api/donor-relations/family-members/${editingFamilyMember.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithAuth(`/api/donor-relations/donors/${donorId}/family-members`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast({
          title: editingFamilyMember ? "Family Member Updated" : "Family Member Added",
          description: `${familyMemberForm.name} has been saved`,
        });
        setShowFamilyMemberModal(false);
        resetFamilyMemberForm();
        fetchFamilyMembers();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save family member",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save family member",
        variant: "destructive",
      });
    } finally {
      setSavingFamilyMember(false);
    }
  };

  const handleDeleteFamilyMember = async (memberId: string) => {
    try {
      setDeletingFamilyMemberId(memberId);
      const res = await fetchWithAuth(`/api/donor-relations/family-members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Family Member Deleted",
          description: "The family member has been removed",
        });
        fetchFamilyMembers();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete family member",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete family member",
        variant: "destructive",
      });
    } finally {
      setDeletingFamilyMemberId(null);
    }
  };

  const resetSpecialOccasionForm = () => {
    setSpecialOccasionForm({
      type: "DOB_SELF",
      month: "",
      day: "",
      relatedPersonName: "",
      notes: "",
    });
    setEditingSpecialOccasion(null);
  };

  const openAddSpecialOccasionModal = () => {
    resetSpecialOccasionForm();
    setShowSpecialOccasionModal(true);
  };

  const openEditSpecialOccasionModal = (occasion: SpecialOccasion) => {
    setEditingSpecialOccasion(occasion);
    setSpecialOccasionForm({
      type: occasion.type,
      month: String(occasion.month),
      day: String(occasion.day),
      relatedPersonName: occasion.relatedPersonName || "",
      notes: occasion.notes || "",
    });
    setShowSpecialOccasionModal(true);
  };

  const handleSaveSpecialOccasion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialOccasionForm.type || !specialOccasionForm.month || !specialOccasionForm.day) {
      toast({
        title: "Validation Error",
        description: "Type, month and day are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingSpecialOccasion(true);
      const payload = {
        type: specialOccasionForm.type,
        month: parseInt(specialOccasionForm.month),
        day: parseInt(specialOccasionForm.day),
        relatedPersonName: specialOccasionForm.relatedPersonName || null,
        notes: specialOccasionForm.notes || null,
      };

      let res;
      if (editingSpecialOccasion) {
        res = await fetchWithAuth(`/api/donor-relations/special-occasions/${editingSpecialOccasion.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithAuth(`/api/donor-relations/donors/${donorId}/special-occasions`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast({
          title: editingSpecialOccasion ? "Special Day Updated" : "Special Day Added",
          description: "The special day has been saved",
        });
        setShowSpecialOccasionModal(false);
        resetSpecialOccasionForm();
        fetchSpecialOccasions();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save special day",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save special day",
        variant: "destructive",
      });
    } finally {
      setSavingSpecialOccasion(false);
    }
  };

  const handleDeleteSpecialOccasion = async (occasionId: string) => {
    try {
      setDeletingSpecialOccasionId(occasionId);
      const res = await fetchWithAuth(`/api/donor-relations/special-occasions/${occasionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({
          title: "Special Day Deleted",
          description: "The special day has been removed",
        });
        fetchSpecialOccasions();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete special day",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete special day",
        variant: "destructive",
      });
    } finally {
      setDeletingSpecialOccasionId(null);
    }
  };

  const resetPledgeForm = () => {
    setPledgeForm({
      pledgeType: "MONEY",
      amount: "",
      quantity: "",
      expectedFulfillmentDate: "",
      notes: "",
    });
    setEditingPledge(null);
  };

  const openPledgeModal = (pledge?: Pledge) => {
    if (pledge) {
      setEditingPledge(pledge);
      setPledgeForm({
        pledgeType: pledge.pledgeType,
        amount: pledge.amount?.toString() || "",
        quantity: pledge.quantity || "",
        expectedFulfillmentDate: pledge.expectedFulfillmentDate?.split("T")[0] || "",
        notes: pledge.notes || "",
      });
    } else {
      resetPledgeForm();
    }
    setShowPledgeModal(true);
  };

  const handleSavePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pledgeForm.pledgeType || !pledgeForm.expectedFulfillmentDate) {
      toast({
        title: "Validation Error",
        description: "Pledge type and expected date are required",
        variant: "destructive",
      });
      return;
    }

    const needsAmount = pledgeForm.pledgeType === "MONEY";
    if (needsAmount && !pledgeForm.amount) {
      toast({
        title: "Validation Error",
        description: "Amount is required for money pledges",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingPledge(true);
      const payload = {
        donorId,
        pledgeType: pledgeForm.pledgeType,
        amount: pledgeForm.amount ? parseFloat(pledgeForm.amount) : null,
        quantity: pledgeForm.quantity || null,
        expectedFulfillmentDate: pledgeForm.expectedFulfillmentDate,
        notes: pledgeForm.notes || null,
      };

      let res;
      if (editingPledge) {
        res = await fetchWithAuth(`/api/pledges/${editingPledge.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithAuth(`/api/pledges`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast({
          title: editingPledge ? "Pledge Updated" : "Pledge Added",
          description: "The pledge has been saved successfully",
        });
        setShowPledgeModal(false);
        resetPledgeForm();
        fetchPledges();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save pledge",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save pledge",
        variant: "destructive",
      });
    } finally {
      setSavingPledge(false);
    }
  };

  const handleFulfillPledge = async (pledgeId: string) => {
    const pledge = pledges.find((p) => p.id === pledgeId);
    setFulfillPledgeId(pledgeId);
    setFulfillForm({
      autoCreateDonation: true,
      donationAmount: pledge?.amount?.toString() || "",
      donationDate: new Date().toISOString().split("T")[0],
      donationMode: "CASH",
      remarks: "",
    });
    setShowFulfillModal(true);
  };

  const handleFulfillConfirm = async () => {
    if (!fulfillPledgeId) return;
    try {
      setPledgeActionLoading(fulfillPledgeId);
      const res = await fetchWithAuth(`/api/pledges/${fulfillPledgeId}/mark-fulfilled`, {
        method: "POST",
        body: JSON.stringify({
          autoCreateDonation: fulfillForm.autoCreateDonation,
          donationAmount: fulfillForm.donationAmount
            ? parseFloat(fulfillForm.donationAmount)
            : undefined,
          donationDate: fulfillForm.donationDate,
          donationMode: fulfillForm.donationMode,
          remarks: fulfillForm.remarks || undefined,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Pledge Fulfilled",
          description: result.createdDonation
            ? `Donation created with receipt ${result.createdDonation.receiptNumber}`
            : "The pledge has been marked as fulfilled",
        });
        setShowFulfillModal(false);
        fetchPledges();
        fetchDonations();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to fulfill pledge",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to fulfill pledge",
        variant: "destructive",
      });
    } finally {
      setPledgeActionLoading(null);
    }
  };

  const handlePostponePledge = async (pledgeId: string) => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setPostponePledgeId(pledgeId);
    setPostponeForm({
      newDate: nextMonth.toISOString().split("T")[0],
      notes: "",
    });
    setShowPostponeModal(true);
  };

  const handlePostponeConfirm = async () => {
    if (!postponePledgeId || !postponeForm.newDate) return;
    try {
      setPledgeActionLoading(postponePledgeId);
      const res = await fetchWithAuth(`/api/pledges/${postponePledgeId}/postpone`, {
        method: "POST",
        body: JSON.stringify({
          newDate: postponeForm.newDate,
          notes: postponeForm.notes || undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: "Pledge Postponed",
          description: `Postponed to ${new Date(postponeForm.newDate).toLocaleDateString("en-IN")}`,
        });
        setShowPostponeModal(false);
        fetchPledges();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to postpone pledge",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to postpone pledge",
        variant: "destructive",
      });
    } finally {
      setPledgeActionLoading(null);
    }
  };

  const handleCancelPledge = async (pledgeId: string) => {
    setCancelPledgeId(pledgeId);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelPledgeId || !cancelReason.trim()) {
      toast({
        title: "Error",
        description: "Cancellation reason is required",
        variant: "destructive",
      });
      return;
    }
    try {
      setPledgeActionLoading(cancelPledgeId);
      const res = await fetchWithAuth(`/api/pledges/${cancelPledgeId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (res.ok) {
        toast({
          title: "Pledge Cancelled",
          description: "The pledge has been cancelled",
        });
        setShowCancelModal(false);
        fetchPledges();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to cancel pledge",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel pledge",
        variant: "destructive",
      });
    } finally {
      setPledgeActionLoading(null);
    }
  };

  const handlePledgeWhatsApp = async (pledgeId: string) => {
    try {
      const res = await fetchWithAuth(`/api/pledges/${pledgeId}/whatsapp-text`);
      if (res.ok) {
        const { text } = await res.json();
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied",
          description: "Pledge reminder copied to clipboard. Paste it in WhatsApp.",
        });
        await fetchWithAuth(`/api/pledges/${pledgeId}/log-whatsapp`, {
          method: "POST",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy reminder",
        variant: "destructive",
      });
    }
  };

  const handlePledgeEmail = async (pledgeId: string) => {
    try {
      setPledgeActionLoading(`email-${pledgeId}`);
      const res = await fetchWithAuth(`/api/pledges/${pledgeId}/send-reminder-email`, {
        method: "POST",
      });
      if (res.ok) {
        const result = await res.json();
        toast({ title: "Email Queued", description: result.message });
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.message || "Failed to send email",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setPledgeActionLoading(null);
    }
  };

  const logPostDonationAction = async (
    action: "send_email" | "send_whatsapp" | "send_whatsapp_auto" | "remind_later" | "skip",
  ) => {
    try {
      await fetchWithAuth("/api/communication-logs/post-donation-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: donor?.id,
          donationId: newlyCreatedDonation?.id,
          action,
        }),
      });
    } catch (error) {
      console.error("Failed to log post-donation action:", error);
    }
  };

  const authUser = authStorage.getUser();
  if (authUser && !hasPermission(authUser?.role, "donors", "view")) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <p className="text-lg font-medium">Donor not found</p>
      </div>
    );
  }

  const totalDonations = donations.reduce((sum, d) => sum + parseFloat(d.donationAmount), 0);
  const pendingPledges = donor.pledges?.filter((p) => p.status === "PENDING").length || 0;

  return (
    <div className="p-6 space-y-6">
      <DonorHeader
        donor={donor}
        donorName={getDonorName()}
        initials={getInitials()}
        isAdmin={isAdmin}
        canEdit={canEdit}
        isDataMasked={isDataMasked}
        requestingAccess={requestingAccess}
        onBack={() => router.back()}
        onRequestAccess={handleRequestAccess}
        onEdit={() => router.push(`/dashboard/donors/${donorId}/edit`)}
      />

      <DonorStatsCards
        totalDonations={totalDonations}
        donationCount={donations.length}
        pendingPledges={pendingPledges}
        specialDaysCount={donor.specialOccasions?.length || 0}
        familyMembersCount={donor.familyMembers?.length || 0}
      />

      {donorInsights && donorInsights.donationCount > 0 && (
        <DonorSmartSummary donorInsights={donorInsights} />
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sponsorships">Sponsorships</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="pledges">Pledges</TabsTrigger>
          <TabsTrigger value="special-days">Special Days</TabsTrigger>
          <TabsTrigger value="family">Family</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          {canViewLogs && <TabsTrigger value="comm-log">Log</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <DonorOverviewTab
            donor={donor}
            isDataMasked={isDataMasked}
            formatDate={formatDate}
            assignDonorOwner={
              <AssignDonorOwner donorId={donor.id} currentOwner={donor.assignedTo ?? null} />
            }
          />
        </TabsContent>

        <TabsContent value="sponsorships">
          <DonorSponsorshipsTab
            sponsoredBeneficiaries={sponsoredBeneficiaries}
            sponsoredBeneficiariesLoading={sponsoredBeneficiariesLoading}
            canEditSponsorship={canEditSponsorship}
            donorId={donor.id}
            donorPhone={donor.whatsappPhone || donor.primaryPhone || null}
            onViewAllBeneficiaries={() => router.push("/dashboard/beneficiaries")}
            onOpenStatusChange={handleOpenSponsorStatusChange}
            onViewHistory={handleViewSponsorHistory}
            onSendWhatsApp={async (_sponsorship, message) => {
              await openWhatsApp(message);
            }}
            onCopyMessage={(message) => copyToClipboard(message, "sponsorship-message")}
            onViewBeneficiary={(beneficiaryId) =>
              router.push(`/dashboard/beneficiaries/${beneficiaryId}`)
            }
          />
        </TabsContent>

        <TabsContent value="timeline">
          <DonorTimelineTab
            timelineStartDate={timelineStartDate}
            timelineEndDate={timelineEndDate}
            timelineTypeFilter={timelineTypeFilter}
            timelineTypeCounts={timelineTypeCounts}
            timelineItems={timelineItems}
            timelineLoading={timelineLoading}
            timelinePage={timelinePage}
            timelineTotal={timelineTotal}
            timelineTotalPages={timelineTotalPages}
            setTimelineStartDate={setTimelineStartDate}
            setTimelineEndDate={setTimelineEndDate}
            setTimelineTypeFilter={setTimelineTypeFilter}
            fetchTimeline={fetchTimeline}
          />
        </TabsContent>

        <TabsContent value="donations">
          <DonorDonationsTab
            donations={donations}
            donationsLoading={donationsLoading}
            isAdmin={!!isAdmin}
            canSendWhatsApp={!!canSendWhatsApp}
            canSendEmail={!!canSendEmail}
            hasWhatsAppNumber={hasWhatsAppNumber}
            hasEmail={hasEmail}
            templates={templates}
            donorName={getDonorName()}
            resendingReceiptId={resendingReceiptId}
            onAddDonation={() => setShowDonationModal(true)}
            onSendWhatsApp={async (donation) => {
              const e164Phone = getDonorE164Phone();
              if (!e164Phone || !donor?.id) {
                toast({
                  title: "No Phone",
                  description: "This donor has no valid phone number",
                  variant: "destructive",
                });
                return;
              }

              try {
                const res = await fetchWithAuth("/api/communications/whatsapp/send-by-key", {
                  method: "POST",
                  body: JSON.stringify({
                    templateKey: "DONATION_THANK_YOU",
                    donorId: donor.id,
                    toE164: e164Phone,
                    variables: {
                      "1": getDonorName(),
                      "2": donation.donationType || "General",
                      "3": `${donation.currency || "INR"} ${donation.donationAmount}`,
                    },
                  }),
                });

                if (res.ok) {
                  toast({
                    title: "WhatsApp Sent",
                    description: "Thank-you message sent via WhatsApp",
                  });
                  fetchCommunicationLogs();
                } else {
                  const err = await res.json();
                  toast({
                    title: "WhatsApp Failed",
                    description: err.message || "Failed to send",
                    variant: "destructive",
                  });
                }
              } catch {
                toast({
                  title: "Error",
                  description: "Failed to send WhatsApp",
                  variant: "destructive",
                });
              }
            }}
            onSendEmail={(donation) => openEmailComposer(null, donation)}
            onResendReceipt={handleResendReceipt}
          />
        </TabsContent>

        <TabsContent value="pledges">
          <DonorPledgesTab
            pledges={pledges}
            pledgesLoading={pledgesLoading}
            canEdit={!!canEdit}
            pledgeActionLoading={pledgeActionLoading}
            onAdd={() => openPledgeModal()}
            onEdit={(pledge) => openPledgeModal(pledge)}
            onFulfill={handleFulfillPledge}
            onPostpone={handlePostponePledge}
            onCancel={handleCancelPledge}
            onWhatsApp={handlePledgeWhatsApp}
            onEmail={handlePledgeEmail}
          />
        </TabsContent>

        <TabsContent value="special-days">
          <DonorSpecialDaysTab
            upcomingOccasions={upcomingOccasions}
            specialOccasions={specialOccasions}
            specialOccasionsLoading={specialOccasionsLoading}
            canEditFamilyAndSpecialDays={!!canEditFamilyAndSpecialDays}
            deletingSpecialOccasionId={deletingSpecialOccasionId}
            getOccasionTypeLabel={getOccasionTypeLabel}
            formatMonthDay={formatMonthDay}
            onAddSpecialDay={openAddSpecialOccasionModal}
            onEditSpecialDay={openEditSpecialOccasionModal}
            onDeleteSpecialDay={handleDeleteSpecialOccasion}
          />
        </TabsContent>

        <TabsContent value="family">
          <DonorFamilyTab
            familyMembers={familyMembers}
            familyMembersLoading={familyMembersLoading}
            canEditFamilyAndSpecialDays={!!canEditFamilyAndSpecialDays}
            deletingFamilyMemberId={deletingFamilyMemberId}
            getRelationTypeLabel={getRelationTypeLabel}
            formatMonthDay={formatMonthDay}
            onAddFamilyMember={openAddFamilyMemberModal}
            onEditFamilyMember={openEditFamilyMemberModal}
            onDeleteFamilyMember={handleDeleteFamilyMember}
          />
        </TabsContent>

        <TabsContent value="communication">
          <DonorCommunicationTab
            templates={templates}
            donations={donations}
            copiedField={copiedField}
            canSendWhatsApp={!!canSendWhatsApp}
            canSendEmail={!!canSendEmail}
            hasWhatsAppNumber={hasWhatsAppNumber}
            hasEmail={hasEmail}
            donorName={getDonorName()}
            resolvePlaceholders={resolvePlaceholders}
            copyToClipboard={copyToClipboard}
            openWhatsApp={openWhatsApp}
            openEmailComposer={openEmailComposer}
          />
        </TabsContent>

        {canViewLogs && (
          <TabsContent value="comm-log">
            <DonorCommunicationLogTab
              canDeleteLogs={!!canDeleteLogs}
              logsLoading={logsLoading}
              communicationLogs={communicationLogs}
              onDeleteLog={handleDeleteLog}
            />
          </TabsContent>
        )}
      </Tabs>

      <DonationDialog
        open={showDonationModal}
        onOpenChange={setShowDonationModal}
        donorName={getDonorName()}
        donationForm={donationForm}
        setDonationForm={setDonationForm}
        submittingDonation={submittingDonation}
        onSubmit={handleSubmitDonation}
      />

      <EmailDialog
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        donorName={getDonorName()}
        emailForm={emailForm}
        setEmailForm={setEmailForm}
        sendingEmail={sendingEmail}
        receiptNumber={selectedDonationForEmail?.receiptNumber || null}
        onSend={handleSendEmail}
      />

      <FamilyMemberDialog
        open={showFamilyMemberModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowFamilyMemberModal(false);
            resetFamilyMemberForm();
          }
        }}
        editingFamilyMember={!!editingFamilyMember}
        familyMemberForm={familyMemberForm}
        setFamilyMemberForm={setFamilyMemberForm}
        savingFamilyMember={savingFamilyMember}
        onSubmit={handleSaveFamilyMember}
        onCancel={() => {
          setShowFamilyMemberModal(false);
          resetFamilyMemberForm();
        }}
      />

      <SpecialOccasionDialog
        open={showSpecialOccasionModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowSpecialOccasionModal(false);
            resetSpecialOccasionForm();
          }
        }}
        editingSpecialOccasion={!!editingSpecialOccasion}
        specialOccasionForm={specialOccasionForm}
        setSpecialOccasionForm={setSpecialOccasionForm}
        savingSpecialOccasion={savingSpecialOccasion}
        onSubmit={handleSaveSpecialOccasion}
      />

      <PledgeDialog
        open={showPledgeModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowPledgeModal(false);
            resetPledgeForm();
          }
        }}
        editingPledge={!!editingPledge}
        pledgeForm={pledgeForm}
        setPledgeForm={setPledgeForm}
        savingPledge={savingPledge}
        onSubmit={handleSavePledge}
      />

      <FulfillPledgeDialog
        open={showFulfillModal}
        onOpenChange={setShowFulfillModal}
        fulfillForm={fulfillForm}
        setFulfillForm={setFulfillForm}
        pledgeActionLoading={pledgeActionLoading}
        onConfirm={handleFulfillConfirm}
      />

      <PostponePledgeDialog
        open={showPostponeModal}
        onOpenChange={setShowPostponeModal}
        postponeForm={postponeForm}
        setPostponeForm={setPostponeForm}
        pledgeActionLoading={pledgeActionLoading}
        onConfirm={handlePostponeConfirm}
      />

      <CancelPledgeDialog
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        pledgeActionLoading={pledgeActionLoading}
        onConfirm={handleCancelConfirm}
      />

      <SponsorStatusDialog
        open={showSponsorStatusDialog}
        onOpenChange={setShowSponsorStatusDialog}
        sponsorStatusTarget={sponsorStatusTarget}
        sponsorStatusData={sponsorStatusData}
        setSponsorStatusData={setSponsorStatusData}
        sponsorStatusLoading={sponsorStatusLoading}
        onConfirm={handleSponsorStatusChange}
      />

      <SponsorHistoryDialog
        open={showSponsorHistoryDialog}
        onOpenChange={setShowSponsorHistoryDialog}
        sponsorHistoryTarget={sponsorHistoryTarget}
        sponsorHistoryEntries={sponsorHistoryEntries}
        sponsorHistoryLoading={sponsorHistoryLoading}
      />
    </div>
  );
}
