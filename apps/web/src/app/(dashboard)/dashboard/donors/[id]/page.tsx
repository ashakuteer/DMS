"use client";

import AssignDonorOwner from "./components/AssignDonorOwner";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Edit,
  Lock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Gift,
  Users,
  Clock,
  IndianRupee,
  User,
  Building,
  MessageSquare,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
  CreditCard,
  CalendarClock,
  Copy,
  Check,
  MessageSquareText,
  ExternalLink,
  History,
  Trash2,
  Send,
  Loader2,
  Package,
  Home,
  Filter,
  Cake,
  Handshake,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

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
    designatedHome: "NONE", // ✅ added
    remarks: "",
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [communicationLogs, setCommunicationLogs] = useState<
    CommunicationLog[]
  >([]);
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
  const [selectedDonationForEmail, setSelectedDonationForEmail] =
    useState<Donation | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showPostDonationPrompt, setShowPostDonationPrompt] = useState(false);
  const [newlyCreatedDonation, setNewlyCreatedDonation] =
    useState<Donation | null>(null);
  const [postDonationActionPending, setPostDonationActionPending] =
    useState(false);
  const [resendingReceiptId, setResendingReceiptId] = useState<string | null>(
    null,
  );

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMembersLoading, setFamilyMembersLoading] = useState(false);
  const [showFamilyMemberModal, setShowFamilyMemberModal] = useState(false);
  const [editingFamilyMember, setEditingFamilyMember] =
    useState<FamilyMember | null>(null);
  const [familyMemberForm, setFamilyMemberForm] =
    useState<FamilyMemberFormData>({
      name: "",
      relationType: "SPOUSE",
      birthMonth: "",
      birthDay: "",
      phone: "",
      email: "",
      notes: "",
    });
  const [savingFamilyMember, setSavingFamilyMember] = useState(false);
  const [deletingFamilyMemberId, setDeletingFamilyMemberId] = useState<
    string | null
  >(null);

  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasion[]>(
    [],
  );
  const [upcomingOccasions, setUpcomingOccasions] = useState<
    (SpecialOccasion & { daysUntil: number })[]
  >([]);
  const [specialOccasionsLoading, setSpecialOccasionsLoading] = useState(false);
  const [showSpecialOccasionModal, setShowSpecialOccasionModal] =
    useState(false);
  const [editingSpecialOccasion, setEditingSpecialOccasion] =
    useState<SpecialOccasion | null>(null);
  const [specialOccasionForm, setSpecialOccasionForm] =
    useState<SpecialOccasionFormData>({
      type: "DOB_SELF",
      month: "",
      day: "",
      relatedPersonName: "",
      notes: "",
    });
  const [savingSpecialOccasion, setSavingSpecialOccasion] = useState(false);
  const [deletingSpecialOccasionId, setDeletingSpecialOccasionId] = useState<
    string | null
  >(null);

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
  const [pledgeActionLoading, setPledgeActionLoading] = useState<string | null>(
    null,
  );

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

  const [sponsoredBeneficiaries, setSponsoredBeneficiaries] = useState<
    SponsoredBeneficiary[]
  >([]);
  const [sponsoredBeneficiariesLoading, setSponsoredBeneficiariesLoading] =
    useState(false);
  const [showSponsorStatusDialog, setShowSponsorStatusDialog] = useState(false);
  const [sponsorStatusTarget, setSponsorStatusTarget] =
    useState<SponsoredBeneficiary | null>(null);
  const [sponsorStatusData, setSponsorStatusData] = useState({
    status: "",
    note: "",
  });
  const [sponsorStatusLoading, setSponsorStatusLoading] = useState(false);
  const [showSponsorHistoryDialog, setShowSponsorHistoryDialog] =
    useState(false);
  const [sponsorHistoryTarget, setSponsorHistoryTarget] =
    useState<SponsoredBeneficiary | null>(null);
  const [sponsorHistoryEntries, setSponsorHistoryEntries] = useState<any[]>([]);
  const [sponsorHistoryLoading, setSponsorHistoryLoading] = useState(false);

    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotal, setTimelineTotal] = useState(0);
  const [timelineTotalPages, setTimelineTotalPages] = useState(0);
  const [timelineTypeCounts, setTimelineTypeCounts] = useState<
    Record<string, number>
  >({});
  const [timelineTypeFilter, setTimelineTypeFilter] = useState<string[]>([]);
  const [timelineStartDate, setTimelineStartDate] = useState("");
  const [timelineEndDate, setTimelineEndDate] = useState("");

  const fetchTimeline = useCallback(
    async (page = 1, types: string[] = [], startDate = "", endDate = "") => {
      try {
        setTimelineLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: "30" });
        if (types.length > 0) params.set("types", types.join(","));
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        const res = await fetchWithAuth(
          `/api/donors/${donorId}/timeline?${params.toString()}`,
        );
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
    },
    [donorId],
  );

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
      const res = await fetchWithAuth(
        `/api/donations?donorId=${donorId}&limit=100`,
      );
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
      const res = await fetchWithAuth(
        `/api/dashboard/donor-insights/${donorId}`,
      );
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

  const canViewLogs = user?.role === "ADMIN" || user?.role === "STAFF";
  const canDeleteLogs = user?.role === "ADMIN";

  const fetchCommunicationLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await fetchWithAuth(
        `/api/communication-logs/donor/${donorId}`,
      );
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
      const res = await fetchWithAuth(
        `/api/donor-relations/donors/${donorId}/family-members`,
      );
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
        fetchWithAuth(
          `/api/donor-relations/donors/${donorId}/special-occasions`,
        ),
        fetchWithAuth(
          `/api/donor-relations/donors/${donorId}/special-occasions/upcoming?days=30`,
        ),
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

    console.log("[Donation Form] Submit triggered, form data:", donationForm);

    if (!donationForm.donationAmount || !donationForm.donationDate) {
      console.log("[Donation Form] Validation failed: missing amount or date");
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
      donationHomeType: donationForm.designatedHome === "NONE" ? null : donationForm.designatedHome || null,
      remarks: donationForm.remarks || null,
    };

    console.log(
      "[Donation Form] Sending POST /api/donations with payload:",
      payload,
    );

    try {
      setSubmittingDonation(true);
      const res = await fetchWithAuth("/api/donations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("[Donation Form] Response status:", res.status);

      if (res.ok) {
        const newDonation = await res.json();
        console.log("[Donation Form] Success! New donation:", newDonation);
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
        console.log("[Donation Form] Error response:", error);
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

  const isAdmin = user?.role === "ADMIN";
  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "STAFF" ||
    user?.role === "TELECALLER";
  const canEditSponsorship = user?.role === "ADMIN" || user?.role === "STAFF";
  const isDataMasked = !isAdmin;

  const handleOpenSponsorStatusChange = (s: SponsoredBeneficiary) => {
    setSponsorStatusTarget(s);
    setSponsorStatusData({ status: s.status || "ACTIVE", note: "" });
    setShowSponsorStatusDialog(true);
  };

  const handleSponsorStatusChange = async () => {
    if (!sponsorStatusTarget) return;
    setSponsorStatusLoading(true);
    try {
      const response = await fetchWithAuth(
        `/api/sponsorships/${sponsorStatusTarget.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: sponsorStatusData.status,
            notes: sponsorStatusData.note || undefined,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to update status");
      toast({ title: "Success", description: "Sponsorship status updated" });
      setShowSponsorStatusDialog(false);
      fetchSponsoredBeneficiaries();
    } catch (error) {
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
    } catch (error) {
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

  const getSponsorStatusBadgeVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PAUSED":
        return "outline";
      case "COMPLETED":
        return "secondary";
      case "STOPPED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getDonorName = () => {
    if (!donor) return "";
    return [donor.firstName, donor.middleName, donor.lastName]
      .filter(Boolean)
      .join(" ");
  };

  const getInitials = () => {
    if (!donor) return "";
    const first = donor.firstName?.[0] || "";
    const last = donor.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "INDIVIDUAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "CSR_REP":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "NGO":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "WHATSAPP_GROUP":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonthDay = (month: number, day: number) => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${day} ${monthNames[month - 1]}`;
  };

  const resolvePlaceholders = (template: string, donation?: Donation) => {
    let result = template;
    result = result.replace(/\{\{donor_name\}\}/g, getDonorName());
    result = result.replace(
      /\{\{amount\}\}/g,
      donation ? formatCurrency(donation.donationAmount) : "[Amount]",
    );
    result = result.replace(
      /\{\{donation_date\}\}/g,
      donation ? formatDate(donation.donationDate) : "[Date]",
    );
    result = result.replace(/\{\{program_name\}\}/g, "General Fund");
    result = result.replace(
      /\{\{receipt_number\}\}/g,
      donation?.receiptNumber || "[Receipt #]",
    );
    return result;
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      toast({
        title: "Copied!",
        description:
          "Text copied to clipboard. Paste it in WhatsApp or your email client.",
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

  const getWhatsAppNumber = () => {
    // Prefer dedicated WhatsApp number, fallback to primary phone
    const phone = donor?.whatsappPhone || donor?.primaryPhone;
    if (!phone) return null;
    // Remove all non-numeric characters except leading +
    return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  };

  const openWhatsApp = async (
    message: string,
    templateId?: string,
    donationId?: string,
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
        toast({ title: "WhatsApp Failed", description: err.message || "Could not send", variant: "destructive" });
      }
      fetchCommunicationLogs();
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast({ title: "Error", description: "Failed to send WhatsApp", variant: "destructive" });
    }
  };

  const canSendWhatsApp = user?.role === "ADMIN" || user?.role === "STAFF";
  const canSendEmail = user?.role === "ADMIN" || user?.role === "STAFF";
  const hasWhatsAppNumber = !!getWhatsAppNumber();

  const getEmail = () => {
    return donor?.personalEmail || donor?.officialEmail || null;
  };
  const hasEmail = !!getEmail();

  const openEmailComposer = (
    template: Template | null,
    donation: Donation | null,
  ) => {
    const latestDonation = donation || donations[0];
    let subject = "";
    let body = "";

    if (template) {
      subject = resolvePlaceholders(template.emailSubject, latestDonation);
      body = resolvePlaceholders(template.emailBody, latestDonation);
    } else if (latestDonation) {
      subject = `Thank you for your donation - Receipt #${latestDonation.receiptNumber}`;
      body = `Dear ${getDonorName()},\n\nThank you for your generous donation of ${formatCurrency(latestDonation.donationAmount)} on ${formatDate(latestDonation.donationDate)}.\n\nYour support means a lot to us.\n\nWarm regards,\nAsha Kuteer Foundation`;
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
          attachReceipt:
            emailForm.attachReceipt &&
            !!selectedDonationForEmail?.receiptNumber,
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
        const friendlyMsg = errorDetail.replace(/^Failed to send email:\s*/i, '');
        toast({
          title: "Failed to Send",
          description: friendlyMsg || "Could not send email. Please check SMTP settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
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
    } catch (error) {
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
      const res = await fetchWithAuth(
        `/api/donations/${donationId}/resend-receipt`,
        {
          method: "POST",
        },
      );

      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Receipt Sent",
          description: result.message || "Receipt was emailed successfully",
        });
        if (canViewLogs) {
          fetchCommunicationLogs();
        }
      } else {
        const error = await res.json();
        toast({
          title: "Failed to Send",
          description: error.message || "Could not re-send receipt",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to re-send receipt",
        variant: "destructive",
      });
    } finally {
      setResendingReceiptId(null);
    }
  };

  const canEditFamilyAndSpecialDays =
    user?.role === "ADMIN" || user?.role === "STAFF";

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
        birthMonth: familyMemberForm.birthMonth
          ? parseInt(familyMemberForm.birthMonth)
          : null,
        birthDay: familyMemberForm.birthDay
          ? parseInt(familyMemberForm.birthDay)
          : null,
        phone: familyMemberForm.phone || null,
        email: familyMemberForm.email || null,
        notes: familyMemberForm.notes || null,
      };

      let res;
      if (editingFamilyMember) {
        res = await fetchWithAuth(
          `/api/donor-relations/family-members/${editingFamilyMember.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await fetchWithAuth(
          `/api/donor-relations/donors/${donorId}/family-members`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
      }

      if (res.ok) {
        toast({
          title: editingFamilyMember
            ? "Family Member Updated"
            : "Family Member Added",
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
    } catch (error) {
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
      const res = await fetchWithAuth(
        `/api/donor-relations/family-members/${memberId}`,
        {
          method: "DELETE",
        },
      );

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
    } catch (error) {
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
    if (
      !specialOccasionForm.type ||
      !specialOccasionForm.month ||
      !specialOccasionForm.day
    ) {
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
        res = await fetchWithAuth(
          `/api/donor-relations/special-occasions/${editingSpecialOccasion.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
      } else {
        res = await fetchWithAuth(
          `/api/donor-relations/donors/${donorId}/special-occasions`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
      }

      if (res.ok) {
        toast({
          title: editingSpecialOccasion
            ? "Special Day Updated"
            : "Special Day Added",
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
    } catch (error) {
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
      const res = await fetchWithAuth(
        `/api/donor-relations/special-occasions/${occasionId}`,
        {
          method: "DELETE",
        },
      );

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
    } catch (error) {
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
        expectedFulfillmentDate:
          pledge.expectedFulfillmentDate?.split("T")[0] || "",
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
    } catch (error) {
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
      const res = await fetchWithAuth(
        `/api/pledges/${fulfillPledgeId}/mark-fulfilled`,
        {
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
        },
      );

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
    } catch (error) {
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
      const res = await fetchWithAuth(
        `/api/pledges/${postponePledgeId}/postpone`,
        {
          method: "POST",
          body: JSON.stringify({
            newDate: postponeForm.newDate,
            notes: postponeForm.notes || undefined,
          }),
        },
      );

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
    } catch (error) {
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
    } catch (error) {
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
          description:
            "Pledge reminder copied to clipboard. Paste it in WhatsApp.",
        });
        await fetchWithAuth(`/api/pledges/${pledgeId}/log-whatsapp`, {
          method: "POST",
        });
      }
    } catch (error) {
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
      const res = await fetchWithAuth(
        `/api/pledges/${pledgeId}/send-reminder-email`,
        { method: "POST" },
      );
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setPledgeActionLoading(null);
    }
  };

  const getPledgeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MONEY: "Money",
      RICE: "Rice",
      GROCERIES: "Groceries",
      MEDICINES: "Medicines",
      MEAL_SPONSOR: "Meal Sponsor",
      VISIT: "Visit",
      OTHER: "Other",
    };
    return labels[type] || type;
  };

  const getPledgeStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "FULFILLED":
        return "default";
      case "POSTPONED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getOccasionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DOB_SELF: "Birthday (Self)",
      DOB_SPOUSE: "Birthday (Spouse)",
      DOB_CHILD: "Birthday (Child)",
      ANNIVERSARY: "Wedding Anniversary",
      DEATH_ANNIVERSARY: "Memorial Day",
      OTHER: "Other",
    };
    return labels[type] || type.replace(/_/g, " ");
  };

  const getRelationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SPOUSE: "Spouse",
      CHILD: "Child",
      FATHER: "Father",
      MOTHER: "Mother",
      SIBLING: "Sibling",
      IN_LAW: "In-law",
      GRANDPARENT: "Grandparent",
      OTHER: "Other",
    };
    return labels[type] || type;
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

  const getDonorE164Phone = (): string | null => {
    const phone = donor?.whatsappPhone || donor?.primaryPhone;
    if (!phone) return null;
    let digits = phone.replace(/[^\d]/g, "");
    if (!digits || digits.length < 10) return null;
    const code = (donor?.primaryPhoneCode || "+91").replace(/[^\d]/g, "");
    if (phone.startsWith("+")) {
      return "+" + digits;
    }
    if (digits.startsWith(code) && digits.length > 10) {
      return "+" + digits;
    }
    if (digits.length === 10) {
      return "+" + code + digits;
    }
    return "+" + code + digits;
  };

  const formatCurrency = (amount: string, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(parseFloat(amount));
  };

  const authUser = authStorage.getUser();
  if (authUser && !hasPermission(authUser?.role, "donors", "view"))
    return <AccessDenied />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <User className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Donor not found</p>
      </div>
    );
  }

  const totalDonations = donations.reduce(
    (sum, d) => sum + parseFloat(d.donationAmount),
    0,
  );
  const pendingPledges =
    donor.pledges?.filter((p) => p.status === "PENDING").length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16">
            <AvatarImage src={donor.profilePicUrl} />
            <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl font-bold text-foreground"
                data-testid="text-donor-name"
              >
                {getDonorName()}
              </h1>
              <Badge variant="outline">{donor.donorCode}</Badge>
              <Badge className={getCategoryColor(donor.category)}>
                {donor.category.replace(/_/g, " ")}
              </Badge>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    className={`flex items-center gap-1 ${
                      donor.healthStatus === "GREEN"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : donor.healthStatus === "YELLOW"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : donor.healthStatus === "RED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                    data-testid="badge-health-score"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        donor.healthStatus === "GREEN"
                          ? "bg-green-500"
                          : donor.healthStatus === "YELLOW"
                            ? "bg-yellow-500"
                            : donor.healthStatus === "RED"
                              ? "bg-red-500"
                              : "bg-gray-400"
                      }`}
                    />
                    {donor.healthScore ?? 100}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Relationship Health:{" "}
                    {donor.healthStatus === "GREEN"
                      ? "Healthy"
                      : donor.healthStatus === "YELLOW"
                        ? "Needs Attention"
                        : donor.healthStatus === "RED"
                          ? "At Risk"
                          : "Unknown"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-muted-foreground">
              {donor.profession || "No profession specified"}
              {donor.city && ` • ${donor.city}`}
              {donor.state && `, ${donor.state}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDataMasked && (
            <Button
              variant="outline"
              onClick={handleRequestAccess}
              disabled={requestingAccess}
              data-testid="button-request-access"
            >
              <Lock className="mr-2 h-4 w-4" />
              {requestingAccess ? "Requesting..." : "Request Full Access"}
            </Button>
          )}
          {canEdit && (
            <Button
              onClick={() => router.push(`/dashboard/donors/${donorId}/edit`)}
              data-testid="button-edit-donor"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Donor
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                {formatCurrency(totalDonations.toString())}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {donations.length} donation(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Pledges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              <span className="text-2xl font-bold">{pendingPledges}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {donor.pledges?.length || 0} total pledge(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Special Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pink-600" />
              <span className="text-2xl font-bold">
                {donor.specialOccasions?.length || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Birthdays, anniversaries, etc.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Family Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">
                {donor.familyMembers?.length || 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Spouse, children, etc.
            </p>
          </CardContent>
        </Card>
      </div>

      {donorInsights && donorInsights.donationCount > 0 && (
        <Card
          className="border-0 shadow-sm bg-gradient-to-br from-violet-50/50 to-blue-50/50 dark:from-violet-950/20 dark:to-blue-950/20"
          data-testid="card-smart-summary"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-lg">Smart Summary</CardTitle>
            </div>
            <CardDescription>
              AI-powered insights about this donor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Donation</p>
                  <p className="font-semibold">
                    {formatCurrency(donorInsights.avgDonation.toString())}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="font-semibold">{donorInsights.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <CalendarClock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Donation</p>
                  <p className="font-semibold">
                    {donorInsights.lastDonationDaysAgo !== null
                      ? donorInsights.lastDonationDaysAgo === 0
                        ? "Today"
                        : donorInsights.lastDonationDaysAgo === 1
                          ? "Yesterday"
                          : `${donorInsights.lastDonationDaysAgo} days ago`
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/50">
                  <CreditCard className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Preferred Mode
                  </p>
                  <p className="font-semibold">{donorInsights.preferredMode}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
                  <Package className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Preferred Type
                  </p>
                  <p className="font-semibold">
                    {donorInsights.preferredDonationType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/50">
                  <Home className="h-4 w-4 text-pink-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Most Sponsored Home
                  </p>
                  <p className="font-semibold">
                    {donorInsights.mostSponsoredHome}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 dark:bg-gray-900/40">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                  <Heart className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Sponsored Beneficiaries
                  </p>
                  <p className="font-semibold">
                    {donorInsights.sponsoredBeneficiariesCount}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="sponsorships" data-testid="tab-sponsorships">
            <Heart className="h-4 w-4 mr-1" />
            Sponsorships
          </TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="donations" data-testid="tab-donations">
            Donations
          </TabsTrigger>
          <TabsTrigger value="pledges" data-testid="tab-pledges">
            Pledges
          </TabsTrigger>
          <TabsTrigger value="special-days" data-testid="tab-special-days">
            Special Days
          </TabsTrigger>
          <TabsTrigger value="family" data-testid="tab-family">
            Family
          </TabsTrigger>
          <TabsTrigger value="communication" data-testid="tab-communication">
            <MessageSquareText className="h-4 w-4 mr-1" />
            Communication
          </TabsTrigger>
          {canViewLogs && (
            <TabsTrigger value="comm-log" data-testid="tab-comm-log">
              <History className="h-4 w-4 mr-1" />
              Log
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {donor.primaryPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Primary Phone</span>
                    <span
                      className="flex items-center gap-1"
                      data-testid="text-primary-phone"
                    >
                      {donor.primaryPhoneCode} {donor.primaryPhone}
                      {isDataMasked && donor.primaryPhone?.includes("*") && (
                        <Lock className="h-3 w-3 text-amber-500" />
                      )}
                    </span>
                  </div>
                )}
                {donor.alternatePhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Alternate Phone
                    </span>
                    <span>{donor.alternatePhone}</span>
                  </div>
                )}
                {donor.whatsappPhone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <span>{donor.whatsappPhone}</span>
                  </div>
                )}
                {donor.personalEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Personal Email
                    </span>
                    <span
                      className="flex items-center gap-1"
                      data-testid="text-personal-email"
                    >
                      {donor.personalEmail}
                      {isDataMasked && donor.personalEmail?.includes("*") && (
                        <Lock className="h-3 w-3 text-amber-500" />
                      )}
                    </span>
                  </div>
                )}
                {donor.officialEmail && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Official Email
                    </span>
                    <span>{donor.officialEmail}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {donor.address && (
                  <div>
                    <span className="text-muted-foreground block mb-1">
                      Street Address
                    </span>
                    <span>{donor.address}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">City</span>
                  <span>{donor.city || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">State</span>
                  <span>{donor.state || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Country</span>
                  <span>{donor.country || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pincode</span>
                  <span>{donor.pincode || "-"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span>{donor.gender?.replace(/_/g, " ") || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span>
                    {donor.approximateAge
                      ? `~${donor.approximateAge} years`
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Religion</span>
                  <span>{donor.religion || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Profession</span>
                  <span>{donor.profession || "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Income Level</span>
                  <span>{donor.incomeSpectrum?.replace(/_/g, " ") || "-"}</span>
                </div>
                {donor.pan && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">PAN</span>
                    <span>{donor.pan}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Donation Frequency
                  </span>
                  <span>
                    {donor.donationFrequency?.replace(/_/g, " ") || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Timezone</span>
                  <span>{donor.timezone || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-2">
                    Communication
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {donor.prefEmail && (
                      <Badge variant="secondary">Email</Badge>
                    )}
                    {donor.prefWhatsapp && (
                      <Badge variant="secondary">WhatsApp</Badge>
                    )}
                    {donor.prefSms && <Badge variant="secondary">SMS</Badge>}
                    {donor.prefReminders && (
                      <Badge variant="secondary">Reminders</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-2">
                    Support Preferences
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {donor.supportPreferences && donor.supportPreferences.length > 0 ? (
                      donor.supportPreferences.map((pref: string) => (
                        <Badge key={pref} variant="secondary" data-testid={`badge-support-pref-${pref.toLowerCase()}`}>
                          {pref.charAt(0) + pref.slice(1).toLowerCase()}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-2">
                    Special Flags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {donor.isUnder18Helper && <Badge>Under 18 Helper</Badge>}
                    {donor.isSeniorCitizen && <Badge>Senior Citizen</Badge>}
                    {donor.isSingleParent && <Badge>Single Parent</Badge>}
                    {donor.isDisabled && <Badge>Disabled</Badge>}
                    {!donor.isUnder18Helper &&
                      !donor.isSeniorCitizen &&
                      !donor.isSingleParent &&
                      !donor.isDisabled && (
                        <span className="text-sm text-muted-foreground">
                          None
                        </span>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {donor.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{donor.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Source & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>{donor.sourceOfDonor?.replace(/_/g, " ") || "-"}</span>
              </div>
              {donor.sourceDetails && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source Details</span>
                  <span>{donor.sourceDetails}</span>
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground pt-2">Assigned To</span>

                <div className="w-[320px] max-w-full">
                  <AssignDonorOwner
                    donorId={donor.id}
                    currentOwner={donor.assignedTo ?? null}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created By</span>
                <span>{donor.createdBy?.name || "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created On</span>
                <span>{formatDate(donor.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsorships">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sponsored Beneficiaries</CardTitle>
                  <CardDescription>
                    Children and elderly this donor supports
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/beneficiaries")}
                  data-testid="button-view-all-beneficiaries"
                >
                  View All Beneficiaries
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sponsoredBeneficiariesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sponsoredBeneficiaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Heart className="h-10 w-10 mb-2 opacity-50" />
                  <p>No sponsored beneficiaries yet</p>
                  <p className="text-sm">
                    Link this donor as a sponsor from the beneficiary's profile
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sponsoredBeneficiaries.map((sponsorship) => {
                    const homeLabel =
                      sponsorship.beneficiary.homeType === "ORPHAN_GIRLS"
                        ? "Orphan Girls Home"
                        : sponsorship.beneficiary.homeType === "BLIND_BOYS"
                          ? "Blind Boys Home"
                          : "Old Age Home";
                    const frequencyLabel =
                      sponsorship.frequency === "MONTHLY"
                        ? "Monthly"
                        : sponsorship.frequency === "QUARTERLY"
                          ? "Quarterly"
                          : sponsorship.frequency === "YEARLY"
                            ? "Yearly"
                            : sponsorship.frequency === "ONE_TIME"
                              ? "One-Time"
                              : sponsorship.frequency;

                    const sponsorshipMessage = `Hello! I wanted to connect with you about the sponsorship of ${sponsorship.beneficiary.fullName} at ${homeLabel}. Thank you for your continued support!`;

                    const handleCopyMessage = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(sponsorshipMessage);
                      toast({
                        title: "Copied",
                        description: "Sponsorship message copied to clipboard",
                      });
                    };

                    const handleWhatsAppClick = async (e: React.MouseEvent) => {
                      e.stopPropagation();
                      const phone = donor?.whatsappPhone || donor?.primaryPhone;
                      if (phone && donor?.id) {
                        try {
                          const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
                            method: "POST",
                            body: JSON.stringify({ donorId: donor.id, toE164: phone, message: sponsorshipMessage }),
                          });
                          if (res.ok) {
                            toast({ title: "WhatsApp Sent", description: "Sponsorship message sent" });
                          } else {
                            toast({ title: "WhatsApp Failed", variant: "destructive" });
                          }
                        } catch {
                          toast({ title: "Error sending WhatsApp", variant: "destructive" });
                        }
                      } else {
                        toast({
                          title: "No Phone",
                          description: "This donor doesn't have a phone number",
                          variant: "destructive",
                        });
                      }
                    };

                    const statusLabel =
                      sponsorship.status ||
                      (sponsorship.isActive ? "ACTIVE" : "STOPPED");

                    return (
                      <Card
                        key={sponsorship.id}
                        data-testid={`card-donor-sponsorship-${sponsorship.id}`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <Avatar
                              className="h-12 w-12 cursor-pointer"
                              onClick={() =>
                                router.push(
                                  `/dashboard/beneficiaries/${sponsorship.beneficiaryId}`,
                                )
                              }
                            >
                              <AvatarImage
                                src={
                                  sponsorship.beneficiary.photoUrl || undefined
                                }
                                alt={sponsorship.beneficiary.fullName}
                              />
                              <AvatarFallback>
                                {sponsorship.beneficiary.fullName
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className="font-medium truncate cursor-pointer"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/beneficiaries/${sponsorship.beneficiaryId}`,
                                    )
                                  }
                                >
                                  {sponsorship.beneficiary.fullName}
                                </p>
                                <Badge
                                  variant={getSponsorStatusBadgeVariant(
                                    statusLabel,
                                  )}
                                  className="flex-shrink-0"
                                  data-testid={`badge-donor-sponsorship-status-${sponsorship.id}`}
                                >
                                  {statusLabel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-mono">
                                {sponsorship.beneficiary.code}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    sponsorship.beneficiary.homeType ===
                                    "ORPHAN_GIRLS"
                                      ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                                      : sponsorship.beneficiary.homeType ===
                                          "BLIND_BOYS"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  }
                                >
                                  {sponsorship.beneficiary.homeType ===
                                  "ORPHAN_GIRLS"
                                    ? "Orphan Girls"
                                    : sponsorship.beneficiary.homeType ===
                                        "BLIND_BOYS"
                                      ? "Blind Boys"
                                      : "Old Age"}
                                </Badge>
                                <Badge variant="secondary">
                                  {sponsorship.sponsorshipType}
                                </Badge>
                                <Badge variant="outline">
                                  {frequencyLabel}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Amount
                                  </p>
                                  {sponsorship.amount ? (
                                    <p
                                      className="font-semibold"
                                      data-testid={`text-donor-sponsorship-amount-${sponsorship.id}`}
                                    >
                                      {sponsorship.currency === "INR"
                                        ? "\u20B9"
                                        : "$"}
                                      {sponsorship.amount.toLocaleString()}
                                      <span className="text-xs font-normal text-muted-foreground">
                                        /{frequencyLabel.toLowerCase()}
                                      </span>
                                    </p>
                                  ) : sponsorship.inKindItem ? (
                                    <p className="text-sm">
                                      {sponsorship.inKindItem}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      -
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Start Date
                                  </p>
                                  <p
                                    className="text-sm"
                                    data-testid={`text-donor-sponsorship-start-${sponsorship.id}`}
                                  >
                                    {sponsorship.startDate
                                      ? new Date(
                                          sponsorship.startDate,
                                        ).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : sponsorship.createdAt
                                        ? new Date(
                                            sponsorship.createdAt,
                                          ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })
                                        : "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    End Date
                                  </p>
                                  <p
                                    className="text-sm"
                                    data-testid={`text-donor-sponsorship-end-${sponsorship.id}`}
                                  >
                                    {sponsorship.endDate
                                      ? new Date(
                                          sponsorship.endDate,
                                        ).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "Ongoing"}
                                  </p>
                                </div>
                              </div>

                              {sponsorship.beneficiary.updates &&
                                sponsorship.beneficiary.updates.length > 0 && (
                                  <div className="mt-3 border-t pt-3 space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Latest Updates
                                    </p>
                                    {sponsorship.beneficiary.updates.map(
                                      (update) => (
                                        <div
                                          key={update.id}
                                          className="flex items-start gap-2 text-sm"
                                          data-testid={`text-update-${update.id}`}
                                        >
                                          <Badge
                                            variant="outline"
                                            className="text-xs flex-shrink-0 mt-0.5"
                                          >
                                            {update.updateType}
                                          </Badge>
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm truncate">
                                              {update.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                              {update.content}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {new Date(
                                                update.createdAt,
                                              ).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {canEditSponsorship && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenSponsorStatusChange(
                                            sponsorship,
                                          );
                                        }}
                                        data-testid={`button-change-status-donor-sponsorship-${sponsorship.id}`}
                                      >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Status
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Change sponsorship status
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {canEditSponsorship && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewSponsorHistory(sponsorship);
                                        }}
                                        data-testid={`button-history-donor-sponsorship-${sponsorship.id}`}
                                      >
                                        <History className="h-4 w-4 mr-1" />
                                        History
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      View change history
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleWhatsAppClick}
                                      data-testid={`button-whatsapp-sponsorship-${sponsorship.id}`}
                                    >
                                      <SiWhatsapp className="h-4 w-4 text-green-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Send WhatsApp message
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCopyMessage}
                                      data-testid={`button-copy-sponsorship-${sponsorship.id}`}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Copy message to clipboard
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(
                                          `/dashboard/beneficiaries/${sponsorship.beneficiaryId}`,
                                        );
                                      }}
                                      data-testid={`button-view-beneficiary-${sponsorship.id}`}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    View beneficiary profile
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Engagement Timeline</CardTitle>
              </div>
              <CardDescription>
                Complete history of all interactions with this donor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Input
                    type="date"
                    value={timelineStartDate}
                    onChange={(e) => setTimelineStartDate(e.target.value)}
                    className="w-[140px]"
                    data-testid="input-timeline-start-date"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={timelineEndDate}
                    onChange={(e) => setTimelineEndDate(e.target.value)}
                    className="w-[140px]"
                    data-testid="input-timeline-end-date"
                  />
                  {(timelineStartDate || timelineEndDate) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setTimelineStartDate("");
                        setTimelineEndDate("");
                        fetchTimeline(1, timelineTypeFilter, "", "");
                      }}
                      data-testid="button-clear-dates"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    fetchTimeline(
                      1,
                      timelineTypeFilter,
                      timelineStartDate,
                      timelineEndDate,
                    )
                  }
                  data-testid="button-apply-timeline-filter"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>

              <div
                className="flex flex-wrap gap-2"
                data-testid="timeline-type-filters"
              >
                {[
                  {
                    key: "DONATION",
                    label: "Donations",
                    icon: IndianRupee,
                    color:
                      "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
                  },
                  {
                    key: "VISIT",
                    label: "Visits",
                    icon: Eye,
                    color:
                      "bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300",
                  },
                  {
                    key: "COMMUNICATION",
                    label: "Messages",
                    icon: MessageSquare,
                    color:
                      "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                  },
                  {
                    key: "BIRTHDAY_WISH",
                    label: "Wishes",
                    icon: Cake,
                    color:
                      "bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300",
                  },
                  {
                    key: "PLEDGE",
                    label: "Pledges",
                    icon: Gift,
                    color:
                      "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300",
                  },
                  {
                    key: "FOLLOW_UP",
                    label: "Follow-ups",
                    icon: CalendarClock,
                    color:
                      "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
                  },
                  {
                    key: "SPONSORSHIP",
                    label: "Sponsorships",
                    icon: Handshake,
                    color:
                      "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300",
                  },
                ].map(({ key, label, icon: Icon, color }) => {
                  const isActive = timelineTypeFilter.includes(key);
                  const count = timelineTypeCounts[key] || 0;
                  return (
                    <Badge
                      key={key}
                      variant={isActive ? "default" : "outline"}
                      className={`cursor-pointer toggle-elevate ${isActive ? "toggle-elevated" : ""} ${!isActive ? color : ""}`}
                      onClick={() => {
                        const newFilter = isActive
                          ? timelineTypeFilter.filter((t) => t !== key)
                          : [...timelineTypeFilter, key];
                        setTimelineTypeFilter(newFilter);
                        fetchTimeline(
                          1,
                          newFilter,
                          timelineStartDate,
                          timelineEndDate,
                        );
                      }}
                      data-testid={`badge-filter-${key.toLowerCase()}`}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {label}
                      {count > 0 && (
                        <span className="ml-1 opacity-70">({count})</span>
                      )}
                    </Badge>
                  );
                })}
                {timelineTypeFilter.length > 0 && (
                  <Badge
                    variant="outline"
                    className="cursor-pointer text-destructive"
                    onClick={() => {
                      setTimelineTypeFilter([]);
                      fetchTimeline(1, [], timelineStartDate, timelineEndDate);
                    }}
                    data-testid="badge-clear-filters"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Badge>
                )}
              </div>

              {timelineLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No activities found</p>
                  <p className="text-sm mt-1">
                    {timelineTypeFilter.length > 0 ||
                    timelineStartDate ||
                    timelineEndDate
                      ? "Try adjusting your filters"
                      : "No interactions have been recorded yet"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    Showing {timelineItems.length} of {timelineTotal} activities
                  </div>
                  <div className="relative">
                    <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-1">
                      {timelineItems.map((item) => {
                        const config = {
                          DONATION: {
                            icon: IndianRupee,
                            bg: "bg-green-100 dark:bg-green-900",
                            text: "text-green-600 dark:text-green-400",
                          },
                          VISIT: {
                            icon: Eye,
                            bg: "bg-teal-100 dark:bg-teal-900",
                            text: "text-teal-600 dark:text-teal-400",
                          },
                          COMMUNICATION: {
                            icon: MessageSquare,
                            bg: "bg-blue-100 dark:bg-blue-900",
                            text: "text-blue-600 dark:text-blue-400",
                          },
                          BIRTHDAY_WISH: {
                            icon: Cake,
                            bg: "bg-pink-100 dark:bg-pink-900",
                            text: "text-pink-600 dark:text-pink-400",
                          },
                          PLEDGE: {
                            icon: Gift,
                            bg: "bg-amber-100 dark:bg-amber-900",
                            text: "text-amber-600 dark:text-amber-400",
                          },
                          FOLLOW_UP: {
                            icon: CalendarClock,
                            bg: "bg-purple-100 dark:bg-purple-900",
                            text: "text-purple-600 dark:text-purple-400",
                          },
                          SPONSORSHIP: {
                            icon: Handshake,
                            bg: "bg-indigo-100 dark:bg-indigo-900",
                            text: "text-indigo-600 dark:text-indigo-400",
                          },
                        }[item.type] || {
                          icon: Clock,
                          bg: "bg-muted",
                          text: "text-muted-foreground",
                        };
                        const IconComp = config.icon;

                        return (
                          <div
                            key={item.id}
                            className="relative flex items-start gap-4 py-3 pl-0"
                            data-testid={`timeline-item-${item.id}`}
                          >
                            <div
                              className={`relative z-10 p-2 rounded-full ${config.bg} shrink-0`}
                            >
                              <IconComp className={`h-4 w-4 ${config.text}`} />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-0.5 break-words">
                                    {item.description}
                                  </p>
                                  {item.metadata?.channel && (
                                    <Badge
                                      variant="secondary"
                                      className="mt-1 text-xs"
                                    >
                                      {item.metadata.channel === "WHATSAPP" ? (
                                        <>
                                          <SiWhatsapp className="h-3 w-3 mr-1" />
                                          {item.metadata.channel}
                                        </>
                                      ) : item.metadata.channel === "EMAIL" ? (
                                        <>
                                          <Mail className="h-3 w-3 mr-1" />
                                          {item.metadata.channel}
                                        </>
                                      ) : (
                                        item.metadata.channel
                                      )}
                                    </Badge>
                                  )}
                                  {item.metadata?.assignedTo && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      Assigned to {item.metadata.assignedTo}
                                    </span>
                                  )}
                                  {item.metadata?.beneficiaryName && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      for {item.metadata.beneficiaryName}
                                    </span>
                                  )}
                                  {item.metadata?.completedNote && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                      Completion: {item.metadata.completedNote}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(item.date)}
                                  </span>
                                  {item.status && (
                                    <Badge
                                      variant={
                                        item.status === "SENT" ||
                                        item.status === "ACTIVE" ||
                                        item.status === "RECEIPTED" ||
                                        item.status === "COMPLETED" ||
                                        item.status === "FULFILLED"
                                          ? "default"
                                          : item.status === "FAILED" ||
                                              item.status === "CANCELLED" ||
                                              item.status === "INACTIVE"
                                            ? "destructive"
                                            : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {item.status}
                                    </Badge>
                                  )}
                                  {item.amount != null && item.amount > 0 && (
                                    <span className="text-sm font-medium">
                                      {item.currency || "INR"}{" "}
                                      {item.amount.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {timelineTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={timelinePage <= 1}
                        onClick={() =>
                          fetchTimeline(
                            timelinePage - 1,
                            timelineTypeFilter,
                            timelineStartDate,
                            timelineEndDate,
                          )
                        }
                        data-testid="button-timeline-prev"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {timelinePage} of {timelineTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={timelinePage >= timelineTotalPages}
                        onClick={() =>
                          fetchTimeline(
                            timelinePage + 1,
                            timelineTypeFilter,
                            timelineStartDate,
                            timelineEndDate,
                          )
                        }
                        data-testid="button-timeline-next"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>Donations</CardTitle>
                <CardDescription>All donations from this donor</CardDescription>
              </div>
              {isAdmin && (
                <Button
                  onClick={() => setShowDonationModal(true)}
                  data-testid="button-add-donation"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Donation
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {donationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : donations.length ? (
                <div className="space-y-3">
                  {donations.map((donation) => {
                    const thankYouTemplate = templates.find(
                      (t) => t.type === "THANK_YOU",
                    );
                    const donationMessage = thankYouTemplate
                      ? resolvePlaceholders(
                          thankYouTemplate.whatsappMessage,
                          donation,
                        )
                      : `Dear ${getDonorName()}, thank you for your generous donation of ${formatCurrency(donation.donationAmount)} on ${formatDate(donation.donationDate)}!`;

                    return (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between p-4 border rounded-lg gap-3"
                        data-testid={`donation-item-${donation.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {formatCurrency(
                                donation.donationAmount,
                                donation.currency,
                              )}
                            </p>
                            {donation.receiptNumber && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <Receipt className="h-3 w-3" />
                                {donation.receiptNumber}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {donation.donationType} via {donation.donationMode}
                          </p>
                          {donation.remarks && (
                            <p className="text-sm text-muted-foreground truncate">
                              {donation.remarks}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm">
                              {formatDate(donation.donationDate)}
                            </p>
                          </div>
                          {canSendWhatsApp && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const e164Phone = getDonorE164Phone();
                                      if (!e164Phone || !donor?.id) {
                                        toast({ title: "No Phone", description: "This donor has no valid phone number", variant: "destructive" });
                                        return;
                                      }
                                      try {
                                        const donorName = getDonorName();
                                        const res = await fetchWithAuth("/api/communications/whatsapp/send-by-key", {
                                          method: "POST",
                                          body: JSON.stringify({
                                            templateKey: "DONATION_THANK_YOU",
                                            donorId: donor.id,
                                            toE164: e164Phone,
                                            variables: {
                                              "1": donorName,
                                              "2": donation.donationType || "General",
                                              "3": `${donation.currency || "INR"} ${donation.donationAmount}`,
                                            },
                                          }),
                                        });
                                        if (res.ok) {
                                          toast({ title: "WhatsApp Sent", description: "Thank-you message sent via WhatsApp" });
                                          fetchCommunicationLogs();
                                        } else {
                                          const err = await res.json();
                                          toast({ title: "WhatsApp Failed", description: err.message || "Failed to send", variant: "destructive" });
                                        }
                                      } catch {
                                        toast({ title: "Error", description: "Failed to send WhatsApp", variant: "destructive" });
                                      }
                                    }}
                                    disabled={!hasWhatsAppNumber}
                                    data-testid={`button-whatsapp-donation-${donation.id}`}
                                  >
                                    <SiWhatsapp className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hasWhatsAppNumber
                                  ? "Send Thank You via WhatsApp (Twilio)"
                                  : "No phone number available"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {canSendEmail && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      openEmailComposer(null, donation)
                                    }
                                    disabled={!hasEmail}
                                    data-testid={`button-email-donation-${donation.id}`}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hasEmail
                                  ? "Send Thank You via Email"
                                  : "No email address available"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {canSendEmail && donation.receiptNumber && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleResendReceipt(donation.id)
                                    }
                                    disabled={
                                      !hasEmail ||
                                      resendingReceiptId === donation.id
                                    }
                                    data-testid={`button-resend-receipt-${donation.id}`}
                                  >
                                    {resendingReceiptId === donation.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4" />
                                    )}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hasEmail
                                  ? "Re-send Receipt via Email"
                                  : "No email address available"}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IndianRupee className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No donations recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pledges">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>Pledges</CardTitle>
                <CardDescription>
                  Promised donations from this donor
                </CardDescription>
              </div>
              {canEdit && (
                <Button
                  onClick={() => openPledgeModal()}
                  data-testid="button-add-pledge"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pledge
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {pledgesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pledges.length > 0 ? (
                <div className="space-y-3">
                  {pledges.map((pledge) => (
                    <div
                      key={pledge.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                      data-testid={`pledge-item-${pledge.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">
                            {pledge.pledgeType === "MONEY" && pledge.amount
                              ? formatCurrency(
                                  pledge.amount.toString(),
                                  pledge.currency,
                                )
                              : pledge.quantity ||
                                getPledgeTypeLabel(pledge.pledgeType)}
                          </p>
                          <Badge
                            variant={
                              getPledgeStatusColor(pledge.status) as
                                | "default"
                                | "secondary"
                                | "destructive"
                                | "outline"
                            }
                          >
                            {pledge.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pledge.pledgeTypeLabel ||
                            getPledgeTypeLabel(pledge.pledgeType)}
                          {pledge.notes && ` - ${pledge.notes}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expected: {formatDate(pledge.expectedFulfillmentDate)}
                          {pledge.createdBy &&
                            ` | Added by ${pledge.createdBy.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(pledge.status === "PENDING" ||
                          pledge.status === "POSTPONED") &&
                          canEdit && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleFulfillPledge(pledge.id)}
                                disabled={!!pledgeActionLoading}
                                data-testid={`button-fulfill-pledge-${pledge.id}`}
                              >
                                {pledgeActionLoading === pledge.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 mr-1" />
                                )}
                                Fulfill
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePostponePledge(pledge.id)}
                                disabled={!!pledgeActionLoading}
                                data-testid={`button-postpone-pledge-${pledge.id}`}
                              >
                                <CalendarClock className="h-4 w-4 mr-1" />
                                Postpone
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelPledge(pledge.id)}
                                disabled={!!pledgeActionLoading}
                                data-testid={`button-cancel-pledge-${pledge.id}`}
                              >
                                Cancel
                              </Button>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handlePledgeWhatsApp(pledge.id)
                                    }
                                    data-testid={`button-pledge-whatsapp-${pledge.id}`}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Copy WhatsApp Reminder
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePledgeEmail(pledge.id)}
                                    disabled={
                                      pledgeActionLoading ===
                                      `email-${pledge.id}`
                                    }
                                    data-testid={`button-pledge-email-${pledge.id}`}
                                  >
                                    {pledgeActionLoading ===
                                    `email-${pledge.id}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Mail className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Send Email Reminder
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        {pledge.status === "FULFILLED" &&
                          pledge.fulfilledDonation && (
                            <Badge variant="outline" className="text-green-600">
                              <Receipt className="h-3 w-3 mr-1" />
                              {pledge.fulfilledDonation.receiptNumber}
                            </Badge>
                          )}
                        {canEdit &&
                          (pledge.status === "PENDING" ||
                            pledge.status === "POSTPONED") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPledgeModal(pledge)}
                              data-testid={`button-edit-pledge-${pledge.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No pledges recorded</p>
                  {canEdit && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => openPledgeModal()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Pledge
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special-days">
          <div className="space-y-4">
            {upcomingOccasions.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    Upcoming in Next 30 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {upcomingOccasions.map((occasion) => (
                      <Badge
                        key={occasion.id}
                        variant="secondary"
                        className="bg-amber-100 dark:bg-amber-900/30"
                      >
                        {getOccasionTypeLabel(occasion.type)} -{" "}
                        {occasion.daysUntil === 0
                          ? "Today!"
                          : `${occasion.daysUntil} days`}
                        {occasion.relatedPersonName &&
                          ` (${occasion.relatedPersonName})`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle>Special Days</CardTitle>
                  <CardDescription>
                    Birthdays, anniversaries, and other important dates
                  </CardDescription>
                </div>
                {canEditFamilyAndSpecialDays && (
                  <Button
                    onClick={openAddSpecialOccasionModal}
                    data-testid="button-add-special-day"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Special Day
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {specialOccasionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : specialOccasions.length ? (
                  <div className="space-y-3">
                    {specialOccasions.map((occasion) => (
                      <div
                        key={occasion.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`special-occasion-item-${occasion.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-full">
                            <Heart className="h-4 w-4 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {getOccasionTypeLabel(occasion.type)}
                            </p>
                            {occasion.relatedPersonName && (
                              <p className="text-sm text-muted-foreground">
                                {occasion.relatedPersonName}
                              </p>
                            )}
                            {occasion.notes && (
                              <p className="text-sm text-muted-foreground">
                                {occasion.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            <p className="text-sm">
                              {formatMonthDay(occasion.month, occasion.day)}
                            </p>
                          </div>
                          {canEditFamilyAndSpecialDays && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  openEditSpecialOccasionModal(occasion)
                                }
                                data-testid={`button-edit-special-occasion-${occasion.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteSpecialOccasion(occasion.id)
                                }
                                disabled={
                                  deletingSpecialOccasionId === occasion.id
                                }
                                data-testid={`button-delete-special-occasion-${occasion.id}`}
                              >
                                {deletingSpecialOccasionId === occasion.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No special days recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="family">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>Family Members</CardTitle>
                <CardDescription>
                  Spouse, children, and other family members
                </CardDescription>
              </div>
              {canEditFamilyAndSpecialDays && (
                <Button
                  onClick={openAddFamilyMemberModal}
                  data-testid="button-add-family-member"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Family Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {familyMembersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : familyMembers.length ? (
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`family-member-item-${member.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {member.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <Badge variant="outline">
                            {getRelationTypeLabel(member.relationType)}
                          </Badge>
                          <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                            {member.birthMonth && member.birthDay && (
                              <span>
                                Birthday:{" "}
                                {formatMonthDay(
                                  member.birthMonth,
                                  member.birthDay,
                                )}
                              </span>
                            )}
                            {member.phone && <span>Phone: {member.phone}</span>}
                            {member.email && <span>Email: {member.email}</span>}
                          </div>
                          {member.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {member.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {canEditFamilyAndSpecialDays && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditFamilyMemberModal(member)}
                            data-testid={`button-edit-family-member-${member.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFamilyMember(member.id)}
                            disabled={deletingFamilyMemberId === member.id}
                            data-testid={`button-delete-family-member-${member.id}`}
                          >
                            {deletingFamilyMemberId === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No family members recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-primary" />
                <CardTitle>Communication Templates</CardTitle>
              </div>
              <CardDescription>
                Copy personalized messages to send via WhatsApp or Email. No
                messages are sent automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No templates available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {donations.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 border mb-4">
                      <p className="text-sm font-medium mb-2">
                        Latest Donation Details (used for placeholders):
                      </p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <Badge variant="outline">
                          Amount: {formatCurrency(donations[0].donationAmount)}
                        </Badge>
                        <Badge variant="outline">
                          Date: {formatDate(donations[0].donationDate)}
                        </Badge>
                        {donations[0].receiptNumber && (
                          <Badge variant="outline">
                            Receipt: {donations[0].receiptNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template) => {
                      const latestDonation = donations[0];
                      const whatsappResolved = resolvePlaceholders(
                        template.whatsappMessage,
                        latestDonation,
                      );
                      const emailSubjectResolved = resolvePlaceholders(
                        template.emailSubject,
                        latestDonation,
                      );
                      const emailBodyResolved = resolvePlaceholders(
                        template.emailBody,
                        latestDonation,
                      );

                      return (
                        <Card
                          key={template.id}
                          className="border"
                          data-testid={`comm-template-${template.type.toLowerCase()}`}
                        >
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {template.name}
                            </CardTitle>
                            {template.description && (
                              <CardDescription className="text-xs">
                                {template.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                                <MessageSquare className="h-3 w-3" />
                                WhatsApp Message
                              </Label>
                              <div className="bg-muted/50 rounded p-2 text-xs max-h-24 overflow-y-auto whitespace-pre-wrap border">
                                {whatsappResolved}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() =>
                                    copyToClipboard(
                                      whatsappResolved,
                                      `wa-${template.id}`,
                                    )
                                  }
                                  data-testid={`button-copy-whatsapp-${template.type.toLowerCase()}`}
                                >
                                  {copiedField === `wa-${template.id}` ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" /> Copy
                                    </>
                                  )}
                                </Button>
                                {canSendWhatsApp && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex-1">
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="w-full bg-green-600 hover:bg-green-700"
                                          onClick={() => {
                                            const typeMap: Record<
                                              string,
                                              string
                                            > = {
                                              THANK_YOU: "THANK_YOU",
                                              GENTLE_FOLLOWUP: "FOLLOW_UP",
                                              MONTHLY_REMINDER: "FOLLOW_UP",
                                              FESTIVAL_GREETING: "GREETING",
                                              RECEIPT_RESEND: "RECEIPT",
                                              BIRTHDAY_ANNIVERSARY: "GREETING",
                                            };
                                            openWhatsApp(
                                              whatsappResolved,
                                              template.id,
                                              latestDonation?.id,
                                              typeMap[template.type] ||
                                                "GENERAL",
                                            );
                                          }}
                                          disabled={!hasWhatsAppNumber}
                                          data-testid={`button-send-whatsapp-${template.type.toLowerCase()}`}
                                        >
                                          <SiWhatsapp className="h-3 w-3 mr-1" />
                                          Send
                                          <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {!hasWhatsAppNumber && (
                                      <TooltipContent>
                                        <p>
                                          No phone number available for this
                                          donor
                                        </p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                                <Mail className="h-3 w-3" />
                                Email
                              </Label>
                              <div className="space-y-1">
                                <div className="bg-muted/50 rounded p-2 text-xs border">
                                  <span className="text-muted-foreground">
                                    Subject:{" "}
                                  </span>
                                  {emailSubjectResolved}
                                </div>
                                <div className="bg-muted/50 rounded p-2 text-xs max-h-20 overflow-y-auto whitespace-pre-wrap border">
                                  {emailBodyResolved}
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() =>
                                    copyToClipboard(
                                      emailSubjectResolved,
                                      `subj-${template.id}`,
                                    )
                                  }
                                  data-testid={`button-copy-subject-${template.type.toLowerCase()}`}
                                >
                                  {copiedField === `subj-${template.id}` ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" /> Subject
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() =>
                                    copyToClipboard(
                                      emailBodyResolved,
                                      `body-${template.id}`,
                                    )
                                  }
                                  data-testid={`button-copy-body-${template.type.toLowerCase()}`}
                                >
                                  {copiedField === `body-${template.id}` ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" /> Body
                                    </>
                                  )}
                                </Button>
                                {canSendEmail && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="flex-1">
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="w-full"
                                          onClick={() =>
                                            openEmailComposer(
                                              template,
                                              latestDonation,
                                            )
                                          }
                                          disabled={!hasEmail}
                                          data-testid={`button-send-email-${template.type.toLowerCase()}`}
                                        >
                                          <Mail className="h-3 w-3 mr-1" />
                                          Send
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    {!hasEmail && (
                                      <TooltipContent>
                                        <p>
                                          No email address available for this
                                          donor
                                        </p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canViewLogs && (
          <TabsContent value="comm-log">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle>Communication Log</CardTitle>
                </div>
                <CardDescription>
                  History of all email and WhatsApp communications with this
                  donor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : communicationLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No communication history yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      className="w-full text-sm"
                      data-testid="table-comm-log"
                    >
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium">
                            Date/Time
                          </th>
                          <th className="text-left py-2 px-2 font-medium">
                            Channel
                          </th>
                          <th className="text-left py-2 px-2 font-medium">
                            Type
                          </th>
                          <th className="text-left py-2 px-2 font-medium">
                            Status
                          </th>
                          <th className="text-left py-2 px-2 font-medium">
                            Sent By
                          </th>
                          <th className="text-left py-2 px-2 font-medium">
                            Details
                          </th>
                          {canDeleteLogs && (
                            <th className="text-left py-2 px-2 font-medium">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {communicationLogs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-b hover:bg-muted/50"
                            data-testid={`log-row-${log.id}`}
                          >
                            <td className="py-2 px-2">
                              <div className="flex flex-col">
                                <span>{formatDate(log.createdAt)}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <Badge
                                variant={
                                  log.channel === "EMAIL"
                                    ? "secondary"
                                    : "default"
                                }
                                className={
                                  log.channel === "WHATSAPP"
                                    ? "bg-green-600"
                                    : ""
                                }
                              >
                                {log.channel === "EMAIL" ? (
                                  <Mail className="h-3 w-3 mr-1" />
                                ) : (
                                  <SiWhatsapp className="h-3 w-3 mr-1" />
                                )}
                                {log.channel}
                              </Badge>
                            </td>
                            <td className="py-2 px-2">
                              <span className="capitalize">
                                {log.type.replace(/_/g, " ").toLowerCase()}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <Badge
                                variant={
                                  log.status === "SENT"
                                    ? "default"
                                    : log.status === "FAILED"
                                      ? "destructive"
                                      : log.status === "TRIGGERED"
                                        ? "outline"
                                        : "secondary"
                                }
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="py-2 px-2">
                              {log.sentBy?.name || "System"}
                              {log.sentBy?.role && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({log.sentBy.role})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <div className="max-w-[200px]">
                                {log.subject && (
                                  <div
                                    className="text-xs truncate"
                                    title={log.subject}
                                  >
                                    <span className="font-medium">
                                      Subject:
                                    </span>{" "}
                                    {log.subject}
                                  </div>
                                )}
                                {log.recipient && (
                                  <div
                                    className="text-xs text-muted-foreground truncate"
                                    title={log.recipient}
                                  >
                                    To: {log.recipient}
                                  </div>
                                )}
                                {log.errorMessage && (
                                  <div
                                    className="text-xs text-destructive truncate"
                                    title={log.errorMessage}
                                  >
                                    Error: {log.errorMessage}
                                  </div>
                                )}
                              </div>
                            </td>
                            {canDeleteLogs && (
                              <td className="py-2 px-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteLog(log.id)}
                                  data-testid={`button-delete-log-${log.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showDonationModal} onOpenChange={setShowDonationModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Donation</DialogTitle>
            <DialogDescription>
              Record a new donation for {getDonorName()}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDonation}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="donationAmount">Amount (INR) *</Label>
                <Input
                  id="donationAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={donationForm.donationAmount}
                  onChange={(e) =>
                    setDonationForm({
                      ...donationForm,
                      donationAmount: e.target.value,
                    })
                  }
                  data-testid="input-donation-amount"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="donationDate">Date *</Label>
                <Input
                  id="donationDate"
                  type="date"
                  value={donationForm.donationDate}
                  onChange={(e) =>
                    setDonationForm({
                      ...donationForm,
                      donationDate: e.target.value,
                    })
                  }
                  data-testid="input-donation-date"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designatedHome">Designated Home</Label>
                <Select
                  value={donationForm.designatedHome}
                  onValueChange={(value) =>
                    setDonationForm({ ...donationForm, designatedHome: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select home" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="GIRLS_HOME">Girls Home</SelectItem>
                    <SelectItem value="BLIND_BOYS_HOME">
                      Blind Boys Home
                    </SelectItem>
                    <SelectItem value="OLD_AGE_HOME">Old Age Home</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="donationMode">Payment Mode</Label>
                <Select
                  value={donationForm.donationMode}
                  onValueChange={(value) =>
                    setDonationForm({ ...donationForm, donationMode: value })
                  }
                >
                  <SelectTrigger data-testid="select-donation-mode">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="GPAY">Google Pay</SelectItem>
                    <SelectItem value="PHONEPE">PhonePe</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="donationType">Purpose / Category</Label>
                <Select
                  value={donationForm.donationType}
                  onValueChange={(value) =>
                    setDonationForm({ ...donationForm, donationType: value })
                  }
                >
                  <SelectTrigger data-testid="select-donation-type">
                    <SelectValue placeholder="Select donation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash Donation</SelectItem>
                    <SelectItem value="GROCERY">Grocery</SelectItem>
                    <SelectItem value="MEDICINES">Medicines</SelectItem>
                    <SelectItem value="PREPARED_FOOD">Prepared Food</SelectItem>
                    <SelectItem value="USED_ITEMS">Used Items</SelectItem>
                    <SelectItem value="KIND">In Kind</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Notes</Label>
                <Textarea
                  id="remarks"
                  placeholder="Optional notes about this donation"
                  value={donationForm.remarks}
                  onChange={(e) =>
                    setDonationForm({
                      ...donationForm,
                      remarks: e.target.value,
                    })
                  }
                  data-testid="input-donation-remarks"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDonationModal(false)}
                disabled={submittingDonation}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingDonation}
                data-testid="button-submit-donation"
              >
                {submittingDonation ? "Saving..." : "Save Donation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Send an email to {getDonorName()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="toEmail">To *</Label>
              <Input
                id="toEmail"
                type="email"
                placeholder="Recipient email"
                value={emailForm.toEmail}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, toEmail: e.target.value })
                }
                data-testid="input-email-to"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Subject *</Label>
              <Input
                id="emailSubject"
                placeholder="Email subject"
                value={emailForm.subject}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, subject: e.target.value })
                }
                data-testid="input-email-subject"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailBody">Message *</Label>
              <Textarea
                id="emailBody"
                placeholder="Email body"
                rows={6}
                value={emailForm.body}
                onChange={(e) =>
                  setEmailForm({ ...emailForm, body: e.target.value })
                }
                data-testid="input-email-body"
                required
              />
            </div>
            {selectedDonationForEmail?.receiptNumber && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={emailForm.attachReceipt ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setEmailForm({
                      ...emailForm,
                      attachReceipt: !emailForm.attachReceipt,
                    })
                  }
                  data-testid="button-toggle-receipt"
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  {emailForm.attachReceipt
                    ? "Receipt Attached"
                    : "Attach Receipt PDF"}
                </Button>
                {emailForm.attachReceipt && (
                  <Badge variant="secondary">
                    {selectedDonationForEmail.receiptNumber}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEmailModal(false)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              data-testid="button-send-email"
            >
              {sendingEmail ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPostDonationPrompt}
        onOpenChange={(open) => {
          if (!open) {
            setShowPostDonationPrompt(false);
            setNewlyCreatedDonation(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Donation Saved Successfully
            </DialogTitle>
            <DialogDescription>
              Thank-you notifications have been sent automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {newlyCreatedDonation?.communicationResults && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Email:</span>
                  <Badge
                    variant={
                      newlyCreatedDonation.communicationResults.emailStatus === "sent"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                    data-testid="badge-post-donation-email-status"
                  >
                    {newlyCreatedDonation.communicationResults.emailStatus === "sent"
                      ? "Sent"
                      : newlyCreatedDonation.communicationResults.emailStatus === "skipped_no_email"
                      ? "Skipped (no email)"
                      : newlyCreatedDonation.communicationResults.emailStatus === "skipped_disabled"
                      ? "Disabled"
                      : newlyCreatedDonation.communicationResults.emailStatus || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <SiWhatsapp className="h-4 w-4 text-green-600" />
                  <span>WhatsApp:</span>
                  <Badge
                    variant={
                      newlyCreatedDonation.communicationResults.whatsAppStatus === "queued"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                    data-testid="badge-post-donation-whatsapp-status"
                  >
                    {newlyCreatedDonation.communicationResults.whatsAppStatus === "queued"
                      ? "Queued"
                      : newlyCreatedDonation.communicationResults.whatsAppStatus === "skipped_no_phone"
                      ? "Skipped (no phone)"
                      : newlyCreatedDonation.communicationResults.whatsAppStatus === "skipped_not_configured"
                      ? "Not configured"
                      : newlyCreatedDonation.communicationResults.whatsAppStatus || "N/A"}
                  </Badge>
                </div>
              </>
            )}
            {newlyCreatedDonation?.receiptNumber && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Check className="h-4 w-4" />
                Receipt #{newlyCreatedDonation.receiptNumber} generated
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowPostDonationPrompt(false);
                setNewlyCreatedDonation(null);
              }}
              data-testid="button-post-donation-close"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showFamilyMemberModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowFamilyMemberModal(false);
            resetFamilyMemberForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFamilyMember ? "Edit Family Member" : "Add Family Member"}
            </DialogTitle>
            <DialogDescription>
              {editingFamilyMember
                ? "Update family member details"
                : "Add a new family member to this donor's profile"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveFamilyMember}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fm-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="fm-name"
                  value={familyMemberForm.name}
                  onChange={(e) =>
                    setFamilyMemberForm({
                      ...familyMemberForm,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                  data-testid="input-family-member-name"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fm-relation" className="text-right">
                  Relation *
                </Label>
                <Select
                  value={familyMemberForm.relationType}
                  onValueChange={(value) =>
                    setFamilyMemberForm({
                      ...familyMemberForm,
                      relationType: value,
                    })
                  }
                >
                  <SelectTrigger
                    className="col-span-3"
                    data-testid="select-family-member-relation"
                  >
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPOUSE">Spouse</SelectItem>
                    <SelectItem value="CHILD">Child</SelectItem>
                    <SelectItem value="FATHER">Father</SelectItem>
                    <SelectItem value="MOTHER">Mother</SelectItem>
                    <SelectItem value="SIBLING">Sibling</SelectItem>
                    <SelectItem value="IN_LAW">In-law</SelectItem>
                    <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Birthday (Day & Month)</Label>
                <div className="col-span-3 flex gap-2">
                  <Select
                    value={familyMemberForm.birthDay}
                    onValueChange={(value) =>
                      setFamilyMemberForm({
                        ...familyMemberForm,
                        birthDay: value,
                      })
                    }
                  >
                    <SelectTrigger
                      className="w-[100px]"
                      data-testid="select-family-member-day"
                    >
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (day) => (
                          <SelectItem key={day} value={String(day)}>
                            {day}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    value={familyMemberForm.birthMonth}
                    onValueChange={(value) =>
                      setFamilyMemberForm({
                        ...familyMemberForm,
                        birthMonth: value,
                      })
                    }
                  >
                    <SelectTrigger
                      className="flex-1"
                      data-testid="select-family-member-month"
                    >
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="col-span-4 text-right text-xs text-muted-foreground">
                  Year is intentionally not collected.
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fm-phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="fm-phone"
                  type="tel"
                  value={familyMemberForm.phone}
                  onChange={(e) =>
                    setFamilyMemberForm({
                      ...familyMemberForm,
                      phone: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Optional"
                  data-testid="input-family-member-phone"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fm-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="fm-email"
                  type="email"
                  value={familyMemberForm.email}
                  onChange={(e) =>
                    setFamilyMemberForm({
                      ...familyMemberForm,
                      email: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Optional"
                  data-testid="input-family-member-email"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fm-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="fm-notes"
                  value={familyMemberForm.notes}
                  onChange={(e) =>
                    setFamilyMemberForm({
                      ...familyMemberForm,
                      notes: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Optional notes"
                  data-testid="input-family-member-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFamilyMemberModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingFamilyMember}
                data-testid="button-save-family-member"
              >
                {savingFamilyMember ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : editingFamilyMember ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSpecialOccasionModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowSpecialOccasionModal(false);
            resetSpecialOccasionForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSpecialOccasion ? "Edit Special Day" : "Add Special Day"}
            </DialogTitle>
            <DialogDescription>
              {editingSpecialOccasion
                ? "Update special day details"
                : "Add a new special day to remember"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSpecialOccasion}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="so-type" className="text-right">
                  Type *
                </Label>
                <Select
                  value={specialOccasionForm.type}
                  onValueChange={(value) =>
                    setSpecialOccasionForm({
                      ...specialOccasionForm,
                      type: value,
                    })
                  }
                >
                  <SelectTrigger
                    className="col-span-3"
                    data-testid="select-special-occasion-type"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOB_SELF">Birthday (Self)</SelectItem>
                    <SelectItem value="DOB_SPOUSE">
                      Birthday (Spouse)
                    </SelectItem>
                    <SelectItem value="DOB_CHILD">Birthday (Child)</SelectItem>
                    <SelectItem value="ANNIVERSARY">
                      Wedding Anniversary
                    </SelectItem>
                    <SelectItem value="DEATH_ANNIVERSARY">
                      Memorial Day (Loved One)
                    </SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Day & Month *</Label>
                <div className="col-span-3 flex gap-2">
                  <Select
                    value={specialOccasionForm.day}
                    onValueChange={(value) =>
                      setSpecialOccasionForm({
                        ...specialOccasionForm,
                        day: value,
                      })
                    }
                  >
                    <SelectTrigger
                      className="w-[100px]"
                      data-testid="select-special-occasion-day"
                    >
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <SelectItem key={d} value={String(d)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={specialOccasionForm.month}
                    onValueChange={(value) =>
                      setSpecialOccasionForm({
                        ...specialOccasionForm,
                        month: value,
                      })
                    }
                  >
                    <SelectTrigger
                      className="flex-1"
                      data-testid="select-special-occasion-month"
                    >
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="col-span-4 text-right text-xs text-muted-foreground">
                  Year is intentionally not collected.
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="so-person" className="text-right">
                  Person Name
                </Label>
                <Input
                  id="so-person"
                  value={specialOccasionForm.relatedPersonName}
                  onChange={(e) =>
                    setSpecialOccasionForm({
                      ...specialOccasionForm,
                      relatedPersonName: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Optional (e.g., child's name)"
                  data-testid="input-special-occasion-person"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="so-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="so-notes"
                  value={specialOccasionForm.notes}
                  onChange={(e) =>
                    setSpecialOccasionForm({
                      ...specialOccasionForm,
                      notes: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Optional notes"
                  data-testid="input-special-occasion-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSpecialOccasionModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingSpecialOccasion}
                data-testid="button-save-special-occasion"
              >
                {savingSpecialOccasion ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : editingSpecialOccasion ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPledgeModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowPledgeModal(false);
            resetPledgeForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPledge ? "Edit Pledge" : "Add Pledge"}
            </DialogTitle>
            <DialogDescription>
              {editingPledge
                ? "Update pledge details"
                : "Record a new promise from this donor"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePledge}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledge-type" className="text-right">
                  Type *
                </Label>
                <Select
                  value={pledgeForm.pledgeType}
                  onValueChange={(value) =>
                    setPledgeForm({ ...pledgeForm, pledgeType: value })
                  }
                >
                  <SelectTrigger
                    className="col-span-3"
                    data-testid="select-pledge-type"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONEY">Money</SelectItem>
                    <SelectItem value="RICE">Rice</SelectItem>
                    <SelectItem value="GROCERIES">Groceries</SelectItem>
                    <SelectItem value="MEDICINES">Medicines</SelectItem>
                    <SelectItem value="MEAL_SPONSOR">Meal Sponsor</SelectItem>
                    <SelectItem value="VISIT">Visit</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pledgeForm.pledgeType === "MONEY" ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pledge-amount" className="text-right">
                    Amount *
                  </Label>
                  <Input
                    id="pledge-amount"
                    type="number"
                    value={pledgeForm.amount}
                    onChange={(e) =>
                      setPledgeForm({ ...pledgeForm, amount: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Enter amount"
                    data-testid="input-pledge-amount"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pledge-quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="pledge-quantity"
                    value={pledgeForm.quantity}
                    onChange={(e) =>
                      setPledgeForm({ ...pledgeForm, quantity: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="e.g., 10 kg, 1 event"
                    data-testid="input-pledge-quantity"
                  />
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledge-date" className="text-right">
                  Expected Date *
                </Label>
                <Input
                  id="pledge-date"
                  type="date"
                  value={pledgeForm.expectedFulfillmentDate}
                  onChange={(e) =>
                    setPledgeForm({
                      ...pledgeForm,
                      expectedFulfillmentDate: e.target.value,
                    })
                  }
                  className="col-span-3"
                  data-testid="input-pledge-date"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledge-notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="pledge-notes"
                  value={pledgeForm.notes}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, notes: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Optional notes about this pledge"
                  data-testid="input-pledge-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPledgeModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingPledge}
                data-testid="button-save-pledge"
              >
                {savingPledge ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : editingPledge ? (
                  "Update"
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showFulfillModal} onOpenChange={setShowFulfillModal}>
        <DialogContent data-testid="dialog-fulfill-pledge">
          <DialogHeader>
            <DialogTitle>Fulfill Pledge</DialogTitle>
            <DialogDescription>
              Mark this pledge as fulfilled and optionally create a donation
              record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="fulfill-auto-donation">
                Auto-create donation & receipt
              </Label>
              <Switch
                id="fulfill-auto-donation"
                checked={fulfillForm.autoCreateDonation}
                onCheckedChange={(checked) =>
                  setFulfillForm({
                    ...fulfillForm,
                    autoCreateDonation: checked,
                  })
                }
                data-testid="switch-fulfill-auto-donation"
              />
            </div>
            {fulfillForm.autoCreateDonation && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fulfill-amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="fulfill-amount"
                    type="number"
                    value={fulfillForm.donationAmount}
                    onChange={(e) =>
                      setFulfillForm({
                        ...fulfillForm,
                        donationAmount: e.target.value,
                      })
                    }
                    className="col-span-3"
                    placeholder="Donation amount"
                    data-testid="input-fulfill-amount"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fulfill-date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="fulfill-date"
                    type="date"
                    value={fulfillForm.donationDate}
                    onChange={(e) =>
                      setFulfillForm({
                        ...fulfillForm,
                        donationDate: e.target.value,
                      })
                    }
                    className="col-span-3"
                    data-testid="input-fulfill-date"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fulfill-mode" className="text-right">
                    Payment Mode
                  </Label>
                  <Select
                    value={fulfillForm.donationMode}
                    onValueChange={(value) =>
                      setFulfillForm({ ...fulfillForm, donationMode: value })
                    }
                  >
                    <SelectTrigger
                      className="col-span-3"
                      data-testid="select-fulfill-mode"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fulfill-remarks" className="text-right">
                    Remarks
                  </Label>
                  <Textarea
                    id="fulfill-remarks"
                    value={fulfillForm.remarks}
                    onChange={(e) =>
                      setFulfillForm({
                        ...fulfillForm,
                        remarks: e.target.value,
                      })
                    }
                    className="col-span-3"
                    placeholder="Optional remarks"
                    data-testid="input-fulfill-remarks"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFulfillModal(false)}
              data-testid="button-fulfill-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFulfillConfirm}
              disabled={!!pledgeActionLoading}
              data-testid="button-fulfill-confirm"
            >
              {pledgeActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Fulfilling...
                </>
              ) : (
                "Confirm Fulfill"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPostponeModal} onOpenChange={setShowPostponeModal}>
        <DialogContent data-testid="dialog-postpone-pledge">
          <DialogHeader>
            <DialogTitle>Postpone Pledge</DialogTitle>
            <DialogDescription>
              Set a new expected fulfillment date for this pledge.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postpone-date" className="text-right">
                New Date *
              </Label>
              <Input
                id="postpone-date"
                type="date"
                value={postponeForm.newDate}
                onChange={(e) =>
                  setPostponeForm({ ...postponeForm, newDate: e.target.value })
                }
                className="col-span-3"
                data-testid="input-postpone-date"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postpone-notes" className="text-right">
                Reason
              </Label>
              <Textarea
                id="postpone-notes"
                value={postponeForm.notes}
                onChange={(e) =>
                  setPostponeForm({ ...postponeForm, notes: e.target.value })
                }
                className="col-span-3"
                placeholder="Reason for postponing (optional)"
                data-testid="input-postpone-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPostponeModal(false)}
              data-testid="button-postpone-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostponeConfirm}
              disabled={!!pledgeActionLoading || !postponeForm.newDate}
              data-testid="button-postpone-confirm"
            >
              {pledgeActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Postponing...
                </>
              ) : (
                "Confirm Postpone"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent data-testid="dialog-cancel-pledge">
          <DialogHeader>
            <DialogTitle>Cancel Pledge</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this pledge? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cancel-reason" className="text-right">
                Reason *
              </Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="col-span-3"
                placeholder="Why is this pledge being cancelled?"
                data-testid="input-cancel-reason"
              />
            </div>
            <p className="text-sm text-destructive">
              This action cannot be undone. The pledge will be permanently
              marked as cancelled.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              data-testid="button-cancel-dismiss"
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={!!pledgeActionLoading || !cancelReason.trim()}
              data-testid="button-cancel-confirm"
            >
              {pledgeActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSponsorStatusDialog}
        onOpenChange={setShowSponsorStatusDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Sponsorship Status</DialogTitle>
            <DialogDescription>
              {sponsorStatusTarget && (
                <>
                  Update sponsorship status for{" "}
                  {sponsorStatusTarget.beneficiary.fullName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={sponsorStatusData.status}
                onValueChange={(v) =>
                  setSponsorStatusData((prev) => ({ ...prev, status: v }))
                }
              >
                <SelectTrigger data-testid="select-donor-sponsorship-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="STOPPED">Stopped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Reason for status change..."
                value={sponsorStatusData.note}
                onChange={(e) =>
                  setSponsorStatusData((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
                data-testid="input-donor-sponsorship-status-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSponsorStatusDialog(false)}
              data-testid="button-cancel-donor-sponsorship-status"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSponsorStatusChange}
              disabled={sponsorStatusLoading || !sponsorStatusData.status}
              data-testid="button-confirm-donor-sponsorship-status"
            >
              {sponsorStatusLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSponsorHistoryDialog}
        onOpenChange={setShowSponsorHistoryDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Sponsorship History
            </DialogTitle>
            <DialogDescription>
              {sponsorHistoryTarget && (
                <>
                  Change history for sponsorship of{" "}
                  {sponsorHistoryTarget.beneficiary.fullName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {sponsorHistoryLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sponsorHistoryEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No changes recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {sponsorHistoryEntries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="border rounded-md p-3 space-y-1"
                    data-testid={`donor-history-entry-${entry.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getSponsorStatusBadgeVariant(
                            entry.oldStatus,
                          )}
                          className="text-xs"
                        >
                          {entry.oldStatus}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          &rarr;
                        </span>
                        <Badge
                          variant={getSponsorStatusBadgeVariant(
                            entry.newStatus,
                          )}
                          className="text-xs"
                        >
                          {entry.newStatus}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.changedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {entry.oldAmount !== entry.newAmount &&
                      entry.newAmount !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          Amount: {entry.currency === "INR" ? "\u20B9" : "$"}
                          {(entry.oldAmount || 0).toLocaleString()} &rarr;{" "}
                          {entry.currency === "INR" ? "\u20B9" : "$"}
                          {entry.newAmount.toLocaleString()}
                        </p>
                      )}
                    {entry.note && <p className="text-sm">{entry.note}</p>}
                    {entry.changedBy && (
                      <p className="text-xs text-muted-foreground">
                        By: {entry.changedBy.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
