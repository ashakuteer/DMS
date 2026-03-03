"use client";

import { API_URL } from "@/lib/api-config";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Cake,
  CalendarClock,
  Mail,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
  Gift,
  Check,
  IndianRupee,
  HeartHandshake,
  HandCoins,
  Copy,
  BellOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";

interface DonorInfo {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
  whatsappPhone?: string;
  personalEmail?: string;
  officialEmail?: string;
  healthScore?: number;
  healthStatus?: string;
}

interface SpecialDayItem {
  id: string;
  donorId: string;
  donorName: string;
  donorCode: string;
  type: string;
  relatedPersonName?: string;
  month: number;
  day: number;
  daysUntil?: number;
  donor: DonorInfo;
}

interface FollowUpItem {
  id: string;
  donorId: string;
  donorName: string;
  donorCode: string;
  title: string;
  dueDate: string;
  daysOverdue?: number;
  donor: DonorInfo;
}

interface AtRiskItem {
  id: string;
  donorId: string;
  donorName: string;
  donorCode: string;
  healthScore: number;
  healthStatus: string;
  donor: DonorInfo;
}

interface ReminderItem {
  id: string;
  type: string;
  donorId: string;
  donorName: string;
  donorCode: string;
  title: string;
  dueDate: string;
  status: string;
  pledgeId?: string;
  pledgeType?: string;
  pledgeAmount?: number;
  pledgeQuantity?: string;
  daysOverdue: number;
  daysUntil: number;
  offsetDays?: number;
  donor: DonorInfo;
}

interface PledgeItem {
  id: string;
  donorId: string;
  donorName: string;
  donorCode: string;
  pledgeType: string;
  amount?: number;
  quantity?: string;
  currency: string;
  expectedFulfillmentDate: string;
  notes?: string;
  daysOverdue: number;
  daysUntil: number;
  donor: DonorInfo;
}

interface SponsorshipDueItem {
  id: string;
  sponsorshipId: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  beneficiaryId: string;
  beneficiaryCode: string;
  beneficiaryName: string;
  homeType: string;
  amount?: number;
  currency: string;
  frequency: string;
  sponsorshipType?: string;
  dueDay: number;
  daysUntil: number;
  isOverdue: boolean;
  status?: string;
  protectPrivacy?: boolean;
  donor: DonorInfo;
  beneficiary: {
    id: string;
    code: string;
    fullName: string;
    homeType: string;
    photoUrl?: string;
  };
}

interface SponsorBirthdayItem {
  donorId: string;
  donorCode: string;
  donorName: string;
  firstName: string;
  lastName: string | null;
  dobDay: number;
  dobMonth: number;
  daysUntil: number;
  isToday: boolean;
  hasEmail: boolean;
  hasWhatsApp: boolean;
  personalEmail: string | null;
  officialEmail: string | null;
  whatsappPhone: string | null;
  beneficiaries: {
    id: string;
    name: string;
    homeType: string;
    privacyProtected: boolean;
  }[];
  whatsappText: string;
  emailSubject: string;
  emailHtml: string;
  imageUrl: string | null;
}

interface BeneficiaryBirthdayItem {
  beneficiaryId: string;
  beneficiaryCode: string;
  beneficiaryName: string;
  homeType: string;
  dobDay: number;
  dobMonth: number;
  daysUntil: number;
  isToday: boolean;
  photoUrl: string | null;
  latestUpdate: string | null;
  sponsors: {
    donorId: string;
    donorCode: string;
    donorName: string;
    hasEmail: boolean;
    hasWhatsApp: boolean;
  }[];
}

interface DailyActionsData {
  todaySpecialDays: {
    birthdays: SpecialDayItem[];
    anniversaries: SpecialDayItem[];
    memorials: SpecialDayItem[];
    other: SpecialDayItem[];
  };
  upcomingSpecialDays: {
    next7Days: SpecialDayItem[];
    next15Days: SpecialDayItem[];
  };
  reminders: {
    today: ReminderItem[];
    overdue: ReminderItem[];
    upcoming7: ReminderItem[];
    upcoming15: ReminderItem[];
  };
  pledges: {
    overdue: PledgeItem[];
    dueToday: PledgeItem[];
    upcoming7: PledgeItem[];
  };
  followUps: {
    dueToday: FollowUpItem[];
    overdue: FollowUpItem[];
  };
  atRiskDonors: AtRiskItem[];
  sponsorshipsDue: SponsorshipDueItem[];
  stats: {
    todayTotal: number;
    upcoming7Total: number;
    upcoming15Total: number;
    overdueTotal: number;
    pledgesDue: number;
    followUpsDueToday: number;
    overdueFollowUps: number;
    atRiskCount: number;
    sponsorshipsDueCount: number;
  };
}

const typeLabels: Record<string, string> = {
  DOB_SELF: "Birthday",
  DOB_SPOUSE: "Spouse Birthday",
  DOB_CHILD: "Child Birthday",
  ANNIVERSARY: "Anniversary",
  DEATH_ANNIVERSARY: "Memorial",
  OTHER: "Special Day",
};

const pledgeTypeLabels: Record<string, string> = {
  MONEY: "Money",
  RICE: "Rice",
  GROCERIES: "Groceries",
  MEDICINES: "Medicines",
  MEAL_SPONSOR: "Meal Sponsor",
  VISIT: "Visit",
  OTHER: "Other",
};

const formatCurrency = (amount: number, currency: string = "INR") =>
  currency === "INR" ? `Rs. ${amount.toLocaleString("en-IN")}` : `${currency} ${amount.toLocaleString()}`;

const formatDate = (month: number, day: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month - 1]} ${day}`;
};

export default function DailyActionsPage() {
  const [data, setData] = useState<DailyActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sponsorBirthdays, setSponsorBirthdays] = useState<SponsorBirthdayItem[]>([]);
  const [sponsorBirthdaysLoading, setSponsorBirthdaysLoading] = useState(true);
  const [beneficiaryBirthdays, setBeneficiaryBirthdays] = useState<BeneficiaryBirthdayItem[]>([]);
  const [beneficiaryBirthdaysLoading, setBeneficiaryBirthdaysLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    birthdays: true,
    sponsorships: true,
    pledges: true,
    atRisk: true,
    followUps: true,
  });
  const [markPaidItem, setMarkPaidItem] = useState<SponsorshipDueItem | null>(null);
  const [markPaidMode, setMarkPaidMode] = useState("CASH");
  const [markPaidNotes, setMarkPaidNotes] = useState("");
  const [showPledgeFulfillModal, setShowPledgeFulfillModal] = useState(false);
  const [fulfillPledgeTarget, setFulfillPledgeTarget] = useState<PledgeItem | null>(null);
  const [pledgeFulfillForm, setPledgeFulfillForm] = useState({
    autoCreateDonation: true,
    donationAmount: "",
    donationDate: new Date().toISOString().split("T")[0],
    donationMode: "CASH",
    remarks: "",
  });
  const [showPledgePostponeModal, setShowPledgePostponeModal] = useState(false);
  const [postponePledgeTarget, setPostponePledgeTarget] = useState<PledgeItem | null>(null);
  const [pledgePostponeForm, setPledgePostponeForm] = useState({ newDate: "", notes: "" });
  const [showPledgeCancelModal, setShowPledgeCancelModal] = useState(false);
  const [cancelPledgeTarget, setCancelPledgeTarget] = useState<PledgeItem | null>(null);
  const [pledgeCancelReason, setPledgeCancelReason] = useState("");
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<{ donorId: string; donorName: string; actionType: string; description: string } | null>(null);
  const [snoozeDays, setSnoozeDays] = useState(7);
  const { toast } = useToast();
  const user = authStorage.getUser();
  if (user && !canAccessModule(user?.role, 'dailyActions')) return <AccessDenied />;
  const canSendEmail = user?.role === "ADMIN" || user?.role === "STAFF";
  const canSendWhatsApp = user?.role === "ADMIN" || user?.role === "STAFF" || user?.role === "TELECALLER";
  const canMarkDone = user?.role === "ADMIN" || user?.role === "STAFF";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/dashboard/daily-actions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching daily actions:", error);
      toast({ title: "Error", description: "Failed to load daily actions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSponsorBirthdays = useCallback(async () => {
    setSponsorBirthdaysLoading(true);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/upcoming?range=next7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setSponsorBirthdays(result);
      }
    } catch (error) {
      console.error("Error fetching sponsor birthdays:", error);
    } finally {
      setSponsorBirthdaysLoading(false);
    }
  }, []);

  const fetchBeneficiaryBirthdays = useCallback(async () => {
    setBeneficiaryBirthdaysLoading(true);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/upcoming-beneficiaries?range=next7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setBeneficiaryBirthdays(result);
      }
    } catch (error) {
      console.error("Error fetching beneficiary birthdays:", error);
    } finally {
      setBeneficiaryBirthdaysLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSponsorBirthdays();
    fetchBeneficiaryBirthdays();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const copyWhatsApp = async (donor: DonorInfo, message: string) => {
    const phone = donor.whatsappPhone || donor.primaryPhone;
    if (!phone) {
      toast({ title: "No phone number", description: "This donor has no phone number on file", variant: "destructive" });
      return;
    }
    try {
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
        method: "POST",
        body: JSON.stringify({ donorId: donor.id, toE164: phone, message }),
      });
      if (res.ok) {
        toast({ title: "WhatsApp Sent", description: "Message sent via WhatsApp" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "WhatsApp Failed", description: err.message || "Could not send", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send WhatsApp", variant: "destructive" });
    }
    logWhatsApp(donor.id, message);
  };

  const logWhatsApp = async (donorId: string, message: string) => {
    try {
      const token = authStorage.getAccessToken();
      await fetch(`${API_URL}/api/communication-logs/whatsapp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ donorId, type: "GREETING", messagePreview: message.substring(0, 200) }),
      });
    } catch (error) {
      console.error("Error logging WhatsApp:", error);
    }
  };

  const handleMarkDone = async (donorId: string, actionType: string, description: string) => {
    const loadingKey = `done-${donorId}-${actionType}`;
    setActionLoading(loadingKey);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/dashboard/daily-actions/mark-done`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ donorId, actionType, description }),
      });
      if (res.ok) {
        toast({ title: "Done", description: "Action completed and logged to donor timeline" });
        fetchData();
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark as done", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const openSnoozeDialog = (donorId: string, donorName: string, actionType: string, description: string) => {
    setSnoozeTarget({ donorId, donorName, actionType, description });
    setSnoozeDays(7);
    setShowSnoozeDialog(true);
  };

  const handleSnoozeConfirm = async () => {
    if (!snoozeTarget) return;
    setActionLoading(`snooze-${snoozeTarget.donorId}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/dashboard/daily-actions/snooze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...snoozeTarget, days: snoozeDays }),
      });
      if (res.ok) {
        toast({ title: "Snoozed", description: `Action snoozed for ${snoozeDays} days` });
        setShowSnoozeDialog(false);
        fetchData();
      } else {
        throw new Error("Failed");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to snooze", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReminderMarkDone = async (reminderId: string) => {
    setActionLoading(reminderId);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/${reminderId}/done`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Done", description: "Reminder marked as completed" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark done", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReminderSnooze = async (reminderId: string, days: number) => {
    setActionLoading(reminderId);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/${reminderId}/snooze`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        toast({ title: "Snoozed", description: `Reminder snoozed for ${days} days` });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to snooze", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReminderSendEmail = async (reminder: ReminderItem) => {
    setActionLoading(`email-${reminder.id}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/${reminder.id}/send-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        toast({ title: "Email Sent", description: result.message });
        fetchData();
      } else {
        throw new Error(result.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSponsorshipMarkPaid = (item: SponsorshipDueItem) => {
    setMarkPaidItem(item);
    setMarkPaidMode("CASH");
    setMarkPaidNotes("");
  };

  const handleSponsorshipMarkPaidConfirm = async () => {
    if (!markPaidItem) return;
    const loadingKey = `mark-paid-${markPaidItem.id}`;
    setActionLoading(loadingKey);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/sponsorships/${markPaidItem.sponsorshipId}/mark-paid`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMode: markPaidMode, notes: markPaidNotes || undefined }),
      });
      if (res.ok) {
        toast({ title: "Paid", description: "Sponsorship payment recorded" });
        setMarkPaidItem(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to record payment", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSponsorshipSkip = async (item: SponsorshipDueItem) => {
    setActionLoading(`skip-${item.id}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/sponsorships/${item.sponsorshipId}/skip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Skipped", description: "Month skipped for this sponsorship" });
        fetchData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to skip", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSponsorshipQueueEmail = async (item: SponsorshipDueItem) => {
    setActionLoading(`sp-email-${item.id}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/sponsorships/${item.sponsorshipId}/queue-reminder`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Email Queued", description: result.message || "Reminder queued" });
      } else {
        throw new Error(result.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to queue email", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleFulfillPledge = (pledgeId: string) => {
    const pledge = [...(data?.pledges?.overdue || []), ...(data?.pledges?.dueToday || []), ...(data?.pledges?.upcoming7 || [])].find(p => p.id === pledgeId);
    if (!pledge) return;
    setFulfillPledgeTarget(pledge);
    setPledgeFulfillForm({
      autoCreateDonation: true,
      donationAmount: pledge.amount?.toString() || "",
      donationDate: new Date().toISOString().split("T")[0],
      donationMode: "CASH",
      remarks: "",
    });
    setShowPledgeFulfillModal(true);
  };

  const handlePledgeFulfillConfirm = async () => {
    if (!fulfillPledgeTarget) return;
    setActionLoading(fulfillPledgeTarget.id);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/pledges/${fulfillPledgeTarget.id}/mark-fulfilled`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          autoCreateDonation: pledgeFulfillForm.autoCreateDonation,
          donationAmount: pledgeFulfillForm.donationAmount ? parseFloat(pledgeFulfillForm.donationAmount) : undefined,
          donationDate: pledgeFulfillForm.donationDate,
          donationMode: pledgeFulfillForm.donationMode,
          remarks: pledgeFulfillForm.remarks || undefined,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Fulfilled",
          description: result.createdDonation
            ? `Donation created with receipt ${result.createdDonation.receiptNumber}`
            : "Pledge marked as fulfilled"
        });
        setShowPledgeFulfillModal(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fulfill pledge", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostponePledge = (pledgeId: string) => {
    const pledge = [...(data?.pledges?.overdue || []), ...(data?.pledges?.dueToday || []), ...(data?.pledges?.upcoming7 || [])].find(p => p.id === pledgeId);
    if (!pledge) return;
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setPostponePledgeTarget(pledge);
    setPledgePostponeForm({ newDate: nextMonth.toISOString().split("T")[0], notes: "" });
    setShowPledgePostponeModal(true);
  };

  const handlePledgePostponeConfirm = async () => {
    if (!postponePledgeTarget || !pledgePostponeForm.newDate) return;
    setActionLoading(postponePledgeTarget.id);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/pledges/${postponePledgeTarget.id}/postpone`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ newDate: pledgePostponeForm.newDate, notes: pledgePostponeForm.notes || undefined }),
      });
      if (res.ok) {
        toast({ title: "Postponed", description: `Pledge postponed to ${new Date(pledgePostponeForm.newDate).toLocaleDateString("en-IN")}` });
        setShowPledgePostponeModal(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to postpone", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelPledge = (pledgeId: string) => {
    const pledge = [...(data?.pledges?.overdue || []), ...(data?.pledges?.dueToday || []), ...(data?.pledges?.upcoming7 || [])].find(p => p.id === pledgeId);
    if (!pledge) return;
    setCancelPledgeTarget(pledge);
    setPledgeCancelReason("");
    setShowPledgeCancelModal(true);
  };

  const handlePledgeCancelConfirm = async () => {
    if (!cancelPledgeTarget || !pledgeCancelReason.trim()) {
      toast({ title: "Error", description: "Cancellation reason is required", variant: "destructive" });
      return;
    }
    setActionLoading(cancelPledgeTarget.id);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/pledges/${cancelPledgeTarget.id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: pledgeCancelReason }),
      });
      if (res.ok) {
        toast({ title: "Cancelled", description: "Pledge has been cancelled" });
        setShowPledgeCancelModal(false);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel pledge", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePledgeWhatsApp = async (pledge: PledgeItem) => {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/pledges/${pledge.id}/whatsapp-text`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { text } = await res.json();
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Pledge reminder copied to clipboard" });
        await fetch(`${API_URL}/api/pledges/${pledge.id}/log-whatsapp`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy reminder", variant: "destructive" });
    }
  };

  const handlePledgeEmail = async (pledge: PledgeItem) => {
    setActionLoading(`pledge-email-${pledge.id}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/pledges/${pledge.id}/send-reminder-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        toast({ title: "Email Queued", description: result.message });
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSponsorBirthdayWhatsApp = async (item: SponsorBirthdayItem) => {
    const phone = item.whatsappPhone;
    if (!phone) return;
    try {
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
        method: "POST",
        body: JSON.stringify({ donorId: item.donorId || "", toE164: phone, message: item.whatsappText, type: "SPECIAL_DAY_WISH" }),
      });
      if (res.ok) {
        toast({ title: "WhatsApp Sent", description: "Birthday wish sent via WhatsApp" });
      } else {
        toast({ title: "WhatsApp Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error sending WhatsApp", variant: "destructive" });
    }
  };

  const handleSponsorBirthdayCopyWhatsApp = (item: SponsorBirthdayItem) => {
    navigator.clipboard.writeText(item.whatsappText);
    toast({ title: "Copied", description: "Birthday WhatsApp message copied" });
  };

  const handleSponsorBirthdayEmail = async (item: SponsorBirthdayItem) => {
    setActionLoading(`bday-email-${item.donorId}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/queue-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ donorId: item.donorId }),
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Email Queued", description: result.message || "Birthday email queued" });
      } else {
        throw new Error(result.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to queue email", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBeneficiaryBirthdayEmail = async (item: BeneficiaryBirthdayItem) => {
    setActionLoading(`ben-bday-email-${item.beneficiaryId}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/send-beneficiary-wish/${item.beneficiaryId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Emails Queued", description: result.message || "Birthday emails queued to all sponsors" });
      } else {
        throw new Error(result.message || "Failed");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const ActionButtons = ({
    donor,
    actionType,
    description,
    showMarkDone = true,
    showSnooze = true,
    onWhatsApp,
    onEmail,
    emailDisabled,
    emailLoading,
  }: {
    donor: DonorInfo;
    actionType: string;
    description: string;
    showMarkDone?: boolean;
    showSnooze?: boolean;
    onWhatsApp?: () => void;
    onEmail?: () => void;
    emailDisabled?: boolean;
    emailLoading?: boolean;
  }) => {
    const donorName = [donor.firstName, donor.lastName].filter(Boolean).join(' ');
    const defaultMessage = `Dear ${donorName}, Thank you for your continued support. - Asha Kuteer Foundation`;
    const markDoneKey = `done-${donor.id}-${actionType}`;

    return (
      <div className="flex items-center gap-1 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/dashboard/donors/${donor.id}`}>
              <Button size="icon" variant="ghost" data-testid={`button-profile-${donor.id}-${actionType}`}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>Open Profile</TooltipContent>
        </Tooltip>
        {canSendWhatsApp && (donor.whatsappPhone || donor.primaryPhone) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onWhatsApp || (() => copyWhatsApp(donor, defaultMessage))}
                data-testid={`button-whatsapp-${donor.id}-${actionType}`}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy WhatsApp</TooltipContent>
          </Tooltip>
        )}
        {canSendEmail && (donor.personalEmail || donor.officialEmail) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={onEmail}
                disabled={emailDisabled || emailLoading}
                data-testid={`button-email-${donor.id}-${actionType}`}
              >
                {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send Email</TooltipContent>
          </Tooltip>
        )}
        {canMarkDone && showMarkDone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleMarkDone(donor.id, actionType, description)}
                disabled={actionLoading === markDoneKey}
                data-testid={`button-done-${donor.id}-${actionType}`}
              >
                {actionLoading === markDoneKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark Done</TooltipContent>
          </Tooltip>
        )}
        {canMarkDone && showSnooze && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openSnoozeDialog(donor.id, donorName, actionType, description)}
                data-testid={`button-snooze-${donor.id}-${actionType}`}
              >
                <BellOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  const SectionHeader = ({ title, icon: Icon, count, section, badgeVariant = "secondary" }: {
    title: string;
    icon: any;
    count: number;
    section: string;
    badgeVariant?: "secondary" | "destructive" | "default" | "outline";
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full p-4 text-left"
      data-testid={`button-toggle-${section}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <Badge variant={badgeVariant}>{count}</Badge>
      </div>
      {expandedSections[section] ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Failed to load daily actions</p>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const allBirthdays = [
    ...data.todaySpecialDays.birthdays.map(b => ({ ...b, isToday: true as const, source: 'donor' as const })),
    ...(data.upcomingSpecialDays.next7Days.filter(s => s.type === 'DOB_SELF' || s.type === 'DOB_SPOUSE' || s.type === 'DOB_CHILD').map(b => ({ ...b, isToday: false as const, source: 'donor' as const }))),
    ...data.todaySpecialDays.anniversaries.map(b => ({ ...b, isToday: true as const, source: 'donor' as const })),
    ...(data.upcomingSpecialDays.next7Days.filter(s => s.type === 'ANNIVERSARY').map(b => ({ ...b, isToday: false as const, source: 'donor' as const }))),
  ];
  const allSponsorBirthdays = sponsorBirthdays;
  const allBeneficiaryBirthdays = beneficiaryBirthdays;
  const birthdayCount = allBirthdays.length + allSponsorBirthdays.length + allBeneficiaryBirthdays.length;

  const allPledges = [...(data.pledges.overdue || []), ...(data.pledges.dueToday || []), ...(data.pledges.upcoming7 || [])];
  const pledgeCount = allPledges.length;

  const allSponsorshipsDue = data.sponsorshipsDue || [];
  const sponsorshipCount = allSponsorshipsDue.length;

  const allFollowUps = [...(data.followUps.overdue || []), ...(data.followUps.dueToday || [])];
  const allReminders = [...(data.reminders.overdue || []), ...(data.reminders.today || [])];
  const pendingFollowUpsCount = allFollowUps.length + allReminders.length;

  const atRiskCount = data.atRiskDonors.length;

  const totalActions = birthdayCount + pledgeCount + sponsorshipCount + pendingFollowUpsCount + atRiskCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Daily Action Inbox</h1>
          <p className="text-muted-foreground">Your daily command center for donor engagement</p>
        </div>
        <Button variant="outline" onClick={() => { fetchData(); fetchSponsorBirthdays(); fetchBeneficiaryBirthdays(); }} data-testid="button-refresh">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-actions">{totalActions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Cake className="h-3 w-3" /> Birthdays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-birthday-count">{birthdayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><HandCoins className="h-3 w-3" /> Sponsorships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-sponsorship-count">{sponsorshipCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Gift className="h-3 w-3" /> Pledges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="text-pledge-count">{pledgeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-atrisk-count">{atRiskCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-followup-count">{pendingFollowUpsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Birthdays */}
      <Card>
        <SectionHeader title="Birthdays" icon={Cake} count={birthdayCount} section="birthdays" />
        {expandedSections.birthdays && (
          <CardContent className="pt-0">
            {birthdayCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No upcoming birthdays or anniversaries</div>
            ) : (
              <div className="space-y-4">
                {allBirthdays.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Donor Special Days</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Donor</TableHead>
                            <TableHead>Occasion</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allBirthdays.map((item) => {
                            const label = typeLabels[item.type] || item.type;
                            return (
                              <TableRow key={item.id} className="hover-elevate" data-testid={`row-birthday-${item.id}`}>
                                <TableCell>
                                  <div className="font-medium">{item.donorName}</div>
                                  <div className="text-xs text-muted-foreground">{item.donorCode}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{label}</Badge>
                                  {item.relatedPersonName && <div className="text-xs text-muted-foreground mt-1">{item.relatedPersonName}</div>}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{formatDate(item.month, item.day)}</TableCell>
                                <TableCell>
                                  {item.isToday ? (
                                    <Badge variant="default">Today</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">{item.daysUntil}d away</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <ActionButtons
                                    donor={item.donor}
                                    actionType="Birthday"
                                    description={`${label} wishes sent to ${item.donorName}`}
                                    onWhatsApp={() => {
                                      const donorName = [item.donor.firstName, item.donor.lastName].filter(Boolean).join(' ');
                                      const msg = label.includes('Birthday')
                                        ? `Dear ${donorName}, Wishing you a wonderful birthday! May this special day bring you joy. With warm wishes from Asha Kuteer Foundation.`
                                        : `Dear ${donorName}, Wishing you a very Happy Anniversary! With warm wishes from Asha Kuteer Foundation.`;
                                      copyWhatsApp(item.donor, msg);
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                {allSponsorBirthdays.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Sponsor Birthdays (with Beneficiary Info)</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Donor</TableHead>
                            <TableHead>Birthday</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sponsorships</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allSponsorBirthdays.map((item) => (
                            <TableRow key={item.donorId} className="hover-elevate" data-testid={`row-sponsor-bday-${item.donorId}`}>
                              <TableCell>
                                <div className="font-medium">{item.donorName}</div>
                                <div className="text-xs text-muted-foreground">{item.donorCode}</div>
                              </TableCell>
                              <TableCell>{formatDate(item.dobMonth, item.dobDay)}</TableCell>
                              <TableCell>
                                {item.isToday ? (
                                  <Badge variant="default">Today</Badge>
                                ) : (
                                  <span className="text-muted-foreground">{item.daysUntil}d</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {item.beneficiaries.length > 0 ? (
                                  <Badge variant="outline">{item.beneficiaries.length}</Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">None</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Link href={`/dashboard/donors/${item.donorId}`}>
                                        <Button size="icon" variant="ghost" data-testid={`button-bday-profile-${item.donorId}`}>
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>Open Profile</TooltipContent>
                                  </Tooltip>
                                  {canSendWhatsApp && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" onClick={() => handleSponsorBirthdayCopyWhatsApp(item)} data-testid={`button-bday-copy-wa-${item.donorId}`}>
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy WhatsApp</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {canSendWhatsApp && item.hasWhatsApp && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" onClick={() => handleSponsorBirthdayWhatsApp(item)} data-testid={`button-bday-wa-${item.donorId}`}>
                                          <SiWhatsapp className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Open WhatsApp</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {canSendEmail && item.hasEmail && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleSponsorBirthdayEmail(item)}
                                          disabled={actionLoading === `bday-email-${item.donorId}`}
                                          data-testid={`button-bday-email-${item.donorId}`}
                                        >
                                          {actionLoading === `bday-email-${item.donorId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Queue Birthday Email</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                {allBeneficiaryBirthdays.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Beneficiary Birthdays</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Beneficiary</TableHead>
                            <TableHead>Home</TableHead>
                            <TableHead>Birthday</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sponsors</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allBeneficiaryBirthdays.map((item) => (
                            <TableRow key={item.beneficiaryId} className="hover-elevate" data-testid={`row-ben-bday-${item.beneficiaryId}`}>
                              <TableCell>
                                <div className="font-medium">{item.beneficiaryName}</div>
                                <div className="text-xs text-muted-foreground">{item.beneficiaryCode}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.homeType.replace(/_/g, ' ')}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{formatDate(item.dobMonth, item.dobDay)}</TableCell>
                              <TableCell>
                                {item.isToday ? (
                                  <Badge variant="default">Today</Badge>
                                ) : (
                                  <span className="text-muted-foreground">{item.daysUntil}d away</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {item.sponsors.length > 0 ? (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline">{item.sponsors.length} sponsor{item.sponsors.length > 1 ? 's' : ''}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs space-y-1">
                                        {item.sponsors.map(s => <div key={s.donorId}>{s.donorName} ({s.donorCode})</div>)}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No sponsors</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Link href={`/dashboard/beneficiaries/${item.beneficiaryId}`}>
                                        <Button size="icon" variant="ghost" data-testid={`button-ben-profile-${item.beneficiaryId}`}>
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                      </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>View Profile</TooltipContent>
                                  </Tooltip>
                                  {canSendEmail && item.sponsors.length > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleBeneficiaryBirthdayEmail(item)}
                                          disabled={actionLoading === `ben-bday-email-${item.beneficiaryId}`}
                                          data-testid={`button-ben-bday-email-${item.beneficiaryId}`}
                                        >
                                          {actionLoading === `ben-bday-email-${item.beneficiaryId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Email All Sponsors</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 2: Sponsorships Due */}
      <Card>
        <SectionHeader title="Sponsorships Due" icon={HandCoins} count={sponsorshipCount} section="sponsorships" badgeVariant={allSponsorshipsDue.some(s => s.isOverdue) ? "destructive" : "secondary"} />
        {expandedSections.sponsorships && (
          <CardContent className="pt-0">
            {sponsorshipCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No sponsorships due this week</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Beneficiary</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSponsorshipsDue.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`hover-elevate ${item.isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                        data-testid={`row-sponsorship-${item.id}`}
                      >
                        <TableCell>
                          <div className="font-medium">{item.donorName}</div>
                          <div className="text-xs text-muted-foreground">{item.donorCode}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{item.beneficiaryName}</div>
                          <div className="text-xs text-muted-foreground">{item.homeType.replace(/_/g, ' ')}</div>
                        </TableCell>
                        <TableCell>
                          {item.amount ? formatCurrency(item.amount, item.currency) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {item.isOverdue ? (
                            <Badge variant="destructive">{Math.abs(item.daysUntil)}d overdue</Badge>
                          ) : item.daysUntil === 0 ? (
                            <Badge variant="default">Due Today</Badge>
                          ) : (
                            <span className="text-muted-foreground">{item.daysUntil}d</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/dashboard/donors/${item.donorId}`}>
                                  <Button size="icon" variant="ghost" data-testid={`button-sp-profile-${item.id}`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Open Profile</TooltipContent>
                            </Tooltip>
                            {canMarkDone && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSponsorshipMarkPaid(item)}
                                    disabled={!!actionLoading}
                                    data-testid={`button-sp-markpaid-${item.id}`}
                                  >
                                    <IndianRupee className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mark Paid</TooltipContent>
                              </Tooltip>
                            )}
                            {canSendEmail && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSponsorshipQueueEmail(item)}
                                    disabled={actionLoading === `sp-email-${item.id}`}
                                    data-testid={`button-sp-email-${item.id}`}
                                  >
                                    {actionLoading === `sp-email-${item.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Queue Email Reminder</TooltipContent>
                              </Tooltip>
                            )}
                            {canMarkDone && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleSponsorshipSkip(item)}
                                    disabled={actionLoading === `skip-${item.id}`}
                                    data-testid={`button-sp-skip-${item.id}`}
                                  >
                                    <CalendarClock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Skip Month</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 3: Overdue Pledges */}
      <Card>
        <SectionHeader title="Overdue Pledges" icon={Gift} count={pledgeCount} section="pledges" badgeVariant={data.pledges.overdue.length > 0 ? "destructive" : "secondary"} />
        {expandedSections.pledges && (
          <CardContent className="pt-0">
            {pledgeCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No pledges requiring attention</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Pledge</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPledges.map((pledge) => {
                      const isOverdue = pledge.daysOverdue > 0;
                      return (
                        <TableRow
                          key={pledge.id}
                          className={`hover-elevate ${isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                          data-testid={`row-pledge-${pledge.id}`}
                        >
                          <TableCell>
                            <div className="font-medium">{pledge.donorName}</div>
                            <div className="text-xs text-muted-foreground">{pledge.donorCode}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary">{pledgeTypeLabels[pledge.pledgeType] || pledge.pledgeType}</Badge>
                              {pledge.amount ? (
                                <span className="font-medium">{formatCurrency(pledge.amount, pledge.currency)}</span>
                              ) : pledge.quantity ? (
                                <span className="text-sm text-muted-foreground">{pledge.quantity}</span>
                              ) : null}
                            </div>
                            {pledge.notes && <div className="text-xs text-muted-foreground mt-1">{pledge.notes}</div>}
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive">{pledge.daysOverdue}d overdue</Badge>
                            ) : pledge.daysUntil === 0 ? (
                              <Badge variant="default">Today</Badge>
                            ) : (
                              <span className="text-muted-foreground">{pledge.daysUntil}d</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/dashboard/donors/${pledge.donorId}`}>
                                    <Button size="icon" variant="ghost" data-testid={`button-pledge-profile-${pledge.id}`}>
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Open Profile</TooltipContent>
                              </Tooltip>
                              {canSendWhatsApp && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => handlePledgeWhatsApp(pledge)} data-testid={`button-pledge-wa-${pledge.id}`}>
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy WhatsApp</TooltipContent>
                                </Tooltip>
                              )}
                              {canSendEmail && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handlePledgeEmail(pledge)}
                                      disabled={actionLoading === `pledge-email-${pledge.id}`}
                                      data-testid={`button-pledge-email-${pledge.id}`}
                                    >
                                      {actionLoading === `pledge-email-${pledge.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Send Email</TooltipContent>
                                </Tooltip>
                              )}
                              {canMarkDone && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleFulfillPledge(pledge.id)}
                                        disabled={!!actionLoading}
                                        data-testid={`button-fulfill-${pledge.id}`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Fulfill</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handlePostponePledge(pledge.id)}
                                        disabled={!!actionLoading}
                                        data-testid={`button-postpone-${pledge.id}`}
                                      >
                                        <CalendarClock className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Postpone</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleCancelPledge(pledge.id)}
                                        disabled={!!actionLoading}
                                        data-testid={`button-cancel-pledge-${pledge.id}`}
                                      >
                                        <AlertCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 4: At-Risk Donors */}
      <Card>
        <SectionHeader title="At-Risk Donors" icon={AlertTriangle} count={atRiskCount} section="atRisk" badgeVariant={atRiskCount > 0 ? "destructive" : "secondary"} />
        {expandedSections.atRisk && (
          <CardContent className="pt-0">
            {atRiskCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No at-risk donors detected</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Health Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.atRiskDonors.map((item) => (
                      <TableRow key={item.id} className="hover-elevate bg-red-50 dark:bg-red-950/20" data-testid={`row-atrisk-${item.id}`}>
                        <TableCell>
                          <div className="font-medium">{item.donorName}</div>
                          <div className="text-xs text-muted-foreground">{item.donorCode}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="font-medium">{item.healthScore}/100</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">At Risk</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionButtons
                            donor={item.donor}
                            actionType="At Risk Follow-up"
                            description={`At-risk donor follow-up for ${item.donorName} (score: ${item.healthScore})`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Section 5: Pending Follow-ups */}
      <Card>
        <SectionHeader title="Pending Follow-ups" icon={Clock} count={pendingFollowUpsCount} section="followUps" badgeVariant={(data.followUps.overdue.length > 0 || data.reminders.overdue.length > 0) ? "destructive" : "secondary"} />
        {expandedSections.followUps && (
          <CardContent className="pt-0">
            {pendingFollowUpsCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No pending follow-ups or reminders</div>
            ) : (
              <div className="space-y-4">
                {allReminders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Reminders</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Donor</TableHead>
                            <TableHead>Reminder</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allReminders.map((reminder) => {
                            const isOverdue = reminder.daysOverdue > 0;
                            const hasEmail = reminder.donor.personalEmail || reminder.donor.officialEmail;
                            const eligibleOffsets = [7, 2, 0];
                            const emailEligible = eligibleOffsets.includes(reminder.offsetDays || -1) && hasEmail;
                            return (
                              <TableRow
                                key={reminder.id}
                                className={`hover-elevate ${isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                                data-testid={`row-reminder-${reminder.id}`}
                              >
                                <TableCell>
                                  <div className="font-medium">{reminder.donorName}</div>
                                  <div className="text-xs text-muted-foreground">{reminder.donorCode}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{reminder.title}</div>
                                  <Badge variant="secondary" className="text-xs mt-1">{reminder.type}</Badge>
                                </TableCell>
                                <TableCell>
                                  {isOverdue ? (
                                    <Badge variant="destructive">{reminder.daysOverdue}d overdue</Badge>
                                  ) : reminder.daysUntil === 0 ? (
                                    <Badge variant="default">Today</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">{reminder.daysUntil}d</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Link href={`/dashboard/donors/${reminder.donorId}`}>
                                          <Button size="icon" variant="ghost" data-testid={`button-rem-profile-${reminder.id}`}>
                                            <ExternalLink className="h-4 w-4" />
                                          </Button>
                                        </Link>
                                      </TooltipTrigger>
                                      <TooltipContent>Open Profile</TooltipContent>
                                    </Tooltip>
                                    {canSendWhatsApp && (reminder.donor.whatsappPhone || reminder.donor.primaryPhone) && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              const donorName = [reminder.donor.firstName, reminder.donor.lastName].filter(Boolean).join(' ');
                                              copyWhatsApp(reminder.donor, `Dear ${donorName}, ${reminder.title}. - Asha Kuteer Foundation`);
                                            }}
                                            data-testid={`button-rem-wa-${reminder.id}`}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copy WhatsApp</TooltipContent>
                                      </Tooltip>
                                    )}
                                    {canSendEmail && emailEligible && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleReminderSendEmail(reminder)}
                                            disabled={actionLoading === `email-${reminder.id}`}
                                            data-testid={`button-rem-email-${reminder.id}`}
                                          >
                                            {actionLoading === `email-${reminder.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Send Email</TooltipContent>
                                      </Tooltip>
                                    )}
                                    {canMarkDone && (
                                      <>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => handleReminderMarkDone(reminder.id)}
                                              disabled={actionLoading === reminder.id}
                                              data-testid={`button-rem-done-${reminder.id}`}
                                            >
                                              {actionLoading === reminder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Mark Done</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              onClick={() => handleReminderSnooze(reminder.id, 7)}
                                              disabled={actionLoading === reminder.id}
                                              data-testid={`button-rem-snooze-${reminder.id}`}
                                            >
                                              <BellOff className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Snooze 7 days</TooltipContent>
                                        </Tooltip>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                {allFollowUps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Follow-up Tasks</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Donor</TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allFollowUps.map((item) => {
                            const isOverdue = (item.daysOverdue || 0) > 0;
                            return (
                              <TableRow
                                key={item.id}
                                className={`hover-elevate ${isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                                data-testid={`row-followup-${item.id}`}
                              >
                                <TableCell>
                                  <div className="font-medium">{item.donorName}</div>
                                  <div className="text-xs text-muted-foreground">{item.donorCode}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{item.title}</div>
                                </TableCell>
                                <TableCell>
                                  {isOverdue ? (
                                    <Badge variant="destructive">{item.daysOverdue}d overdue</Badge>
                                  ) : (
                                    <Badge variant="default">Due Today</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <ActionButtons
                                    donor={item.donor}
                                    actionType="Follow-up"
                                    description={`Follow-up completed: ${item.title}`}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Snooze Dialog */}
      <Dialog open={showSnoozeDialog} onOpenChange={setShowSnoozeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze Action</DialogTitle>
            <DialogDescription>
              {snoozeTarget && `Snooze ${snoozeTarget.actionType} for ${snoozeTarget.donorName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Snooze for</Label>
              <Select value={snoozeDays.toString()} onValueChange={(v) => setSnoozeDays(parseInt(v))}>
                <SelectTrigger data-testid="select-snooze-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnoozeDialog(false)}>Cancel</Button>
            <Button onClick={handleSnoozeConfirm} disabled={!!actionLoading} data-testid="button-confirm-snooze">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
              Snooze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={!!markPaidItem} onOpenChange={(open) => { if (!open) setMarkPaidItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Sponsorship Paid</DialogTitle>
            <DialogDescription>
              {markPaidItem && `Record payment for ${markPaidItem.donorName} - ${markPaidItem.beneficiaryName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={markPaidMode} onValueChange={setMarkPaidMode}>
                <SelectTrigger data-testid="select-payment-mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="ONLINE">Online Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="IN_KIND">In Kind</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="e.g., Receipt #123"
                value={markPaidNotes}
                onChange={(e) => setMarkPaidNotes(e.target.value)}
                data-testid="input-payment-notes"
              />
            </div>
            {markPaidItem && (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{markPaidItem.amount ? formatCurrency(markPaidItem.amount, markPaidItem.currency) : "Not specified"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Home:</span>
                  <span>{markPaidItem.homeType.replace(/_/g, " ")}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidItem(null)} data-testid="button-cancel-markpaid">Cancel</Button>
            <Button
              onClick={handleSponsorshipMarkPaidConfirm}
              disabled={actionLoading?.startsWith("mark-paid-")}
              data-testid="button-confirm-markpaid"
            >
              {actionLoading?.startsWith("mark-paid-") ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fulfill Pledge Dialog */}
      <Dialog open={showPledgeFulfillModal} onOpenChange={setShowPledgeFulfillModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Pledge</DialogTitle>
            <DialogDescription>
              {fulfillPledgeTarget && `${fulfillPledgeTarget.donorName} - ${pledgeTypeLabels[fulfillPledgeTarget.pledgeType] || fulfillPledgeTarget.pledgeType}${fulfillPledgeTarget.amount ? ` (${formatCurrency(fulfillPledgeTarget.amount, fulfillPledgeTarget.currency)})` : ''}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-create-donation">Auto-create donation & receipt</Label>
              <Switch
                id="auto-create-donation"
                checked={pledgeFulfillForm.autoCreateDonation}
                onCheckedChange={(checked) => setPledgeFulfillForm(f => ({ ...f, autoCreateDonation: checked }))}
                data-testid="switch-auto-create-donation"
              />
            </div>
            {pledgeFulfillForm.autoCreateDonation && (
              <>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={pledgeFulfillForm.donationAmount}
                    onChange={(e) => setPledgeFulfillForm(f => ({ ...f, donationAmount: e.target.value }))}
                    placeholder="Enter amount"
                    data-testid="input-fulfill-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={pledgeFulfillForm.donationDate}
                    onChange={(e) => setPledgeFulfillForm(f => ({ ...f, donationDate: e.target.value }))}
                    data-testid="input-fulfill-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={pledgeFulfillForm.donationMode} onValueChange={(v) => setPledgeFulfillForm(f => ({ ...f, donationMode: v }))}>
                    <SelectTrigger data-testid="select-fulfill-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="GPAY">Google Pay</SelectItem>
                      <SelectItem value="PHONEPE">PhonePe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={pledgeFulfillForm.remarks}
                    onChange={(e) => setPledgeFulfillForm(f => ({ ...f, remarks: e.target.value }))}
                    placeholder="Optional remarks"
                    data-testid="textarea-fulfill-remarks"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPledgeFulfillModal(false)}>Cancel</Button>
            <Button onClick={handlePledgeFulfillConfirm} disabled={!!actionLoading} data-testid="button-confirm-fulfill">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Fulfill Pledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Postpone Pledge Dialog */}
      <Dialog open={showPledgePostponeModal} onOpenChange={setShowPledgePostponeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Postpone Pledge</DialogTitle>
            <DialogDescription>
              {postponePledgeTarget && `${postponePledgeTarget.donorName} - ${pledgeTypeLabels[postponePledgeTarget.pledgeType] || postponePledgeTarget.pledgeType}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Expected Date</Label>
              <Input
                type="date"
                value={pledgePostponeForm.newDate}
                onChange={(e) => setPledgePostponeForm(f => ({ ...f, newDate: e.target.value }))}
                data-testid="input-postpone-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={pledgePostponeForm.notes}
                onChange={(e) => setPledgePostponeForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Why is this being postponed?"
                data-testid="textarea-postpone-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPledgePostponeModal(false)}>Cancel</Button>
            <Button onClick={handlePledgePostponeConfirm} disabled={!!actionLoading || !pledgePostponeForm.newDate} data-testid="button-confirm-postpone">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />}
              Postpone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Pledge Dialog */}
      <Dialog open={showPledgeCancelModal} onOpenChange={setShowPledgeCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Pledge</DialogTitle>
            <DialogDescription>
              {cancelPledgeTarget && `${cancelPledgeTarget.donorName} - ${pledgeTypeLabels[cancelPledgeTarget.pledgeType] || cancelPledgeTarget.pledgeType}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for cancellation (required)</Label>
              <Textarea
                value={pledgeCancelReason}
                onChange={(e) => setPledgeCancelReason(e.target.value)}
                placeholder="Enter the reason for cancellation"
                data-testid="textarea-cancel-reason"
              />
            </div>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPledgeCancelModal(false)}>Go Back</Button>
            <Button variant="destructive" onClick={handlePledgeCancelConfirm} disabled={!!actionLoading || !pledgeCancelReason.trim()} data-testid="button-confirm-cancel">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
              Cancel Pledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
