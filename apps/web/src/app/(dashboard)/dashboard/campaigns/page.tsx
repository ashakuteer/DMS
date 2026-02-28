"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Target,
  Loader2,
  IndianRupee,
  Calendar,
  Users,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  Mail,
  TrendingUp,
  Edit,
  Trash2,
  Send,
  Search,
  FileText,
  Heart,
  ImageIcon,
  BarChart3,
  X,
  UserPlus,
  Home,
  MessageCircle,
  History,
  CheckCheck,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  Cell, Legend, Area, AreaChart,
} from "recharts";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  goalAmount: number;
  currency: string;
  status: string;
  homeTypes: string[];
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  totalRaised: number;
  donorCount: number;
  donationCount: number;
  progressPercent: number;
  beneficiaryCount?: number;
  updateCount?: number;
}

interface CampaignDetail extends Campaign {
  donations: Array<{
    id: string;
    donationAmount: string;
    donationDate: string;
    donationType: string;
    donationMode: string | null;
    donor: {
      id: string;
      donorCode: string;
      firstName: string;
      lastName: string | null;
    };
  }>;
  beneficiaries: Array<{
    id: string;
    notes: string | null;
    beneficiary: {
      id: string;
      code: string;
      fullName: string;
      homeType: string;
      photoUrl: string | null;
      status: string;
      protectPrivacy: boolean;
    };
  }>;
  updates: Array<{
    id: string;
    title: string;
    content: string;
    photoUrls: string[];
    createdAt: string;
    createdBy: { id: string; name: string };
    _count?: { dispatches: number };
  }>;
}

interface UpdateDispatch {
  id: string;
  campaignUpdateId: string;
  donorId: string;
  channel: string;
  status: string;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
  donor: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName: string | null;
    personalEmail: string | null;
    officialEmail: string | null;
  };
}

interface TimelineItem {
  type: string;
  date: string;
  donorName: string;
  donorCode?: string;
  amount?: number;
  donationType?: string;
  channel?: string;
  subject?: string;
  id: string;
}

interface DonorOption {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
  personalEmail: string | null;
  officialEmail: string | null;
}

interface CampaignDonor {
  donor: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName: string | null;
    primaryPhone: string | null;
    personalEmail: string | null;
    officialEmail: string | null;
    city: string | null;
  };
  totalAmount: number;
  donationCount: number;
  lastDonation: string;
  firstDonation: string;
}

interface Analytics {
  summary: {
    totalRaised: number;
    goalAmount: number;
    progressPercent: number;
    totalDonations: number;
    uniqueDonors: number;
    avgDonation: number;
    remaining: number;
  };
  monthlyDonations: Array<{ month: string; amount: number; count: number }>;
  cumulativeProgress: Array<{ month: string; cumulative: number }>;
  byType: Array<{ type: string; amount: number; count: number }>;
  byMode: Array<{ mode: string; amount: number; count: number }>;
  byHome: Array<{ home: string; amount: number; count: number }>;
}

interface BeneficiarySearchResult {
  id: string;
  code: string;
  fullName: string;
  homeType: string;
  status: string;
}

const HOME_LABELS: Record<string, string> = {
  ORPHAN_GIRLS: "Orphan Girls Home",
  BLIND_BOYS: "Blind Boys Home",
  OLD_AGE: "Old Age Home",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [whatsappText, setWhatsappText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [donors, setDonors] = useState<DonorOption[]>([]);
  const [donorSearch, setDonorSearch] = useState("");
  const [selectedDonorIds, setSelectedDonorIds] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const [detailTab, setDetailTab] = useState("overview");
  const [campaignDonors, setCampaignDonors] = useState<CampaignDonor[]>([]);
  const [campaignDonorsLoading, setCampaignDonorsLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [showAddBeneficiaryDialog, setShowAddBeneficiaryDialog] = useState(false);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [beneficiaryResults, setBeneficiaryResults] = useState<BeneficiarySearchResult[]>([]);
  const [beneficiarySearchLoading, setBeneficiarySearchLoading] = useState(false);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  const [addingBeneficiaries, setAddingBeneficiaries] = useState(false);

  const [showAddUpdateDialog, setShowAddUpdateDialog] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: "", content: "", photoUrls: "" });
  const [creatingUpdate, setCreatingUpdate] = useState(false);

  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [broadcastUpdateId, setBroadcastUpdateId] = useState<string | null>(null);
  const [broadcastDonorSearch, setBroadcastDonorSearch] = useState("");
  const [broadcastDonors, setBroadcastDonors] = useState<DonorOption[]>([]);
  const [broadcastDonorsLoading, setBroadcastDonorsLoading] = useState(false);
  const [selectedBroadcastDonorIds, setSelectedBroadcastDonorIds] = useState<string[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);

  const [showWhatsAppUpdateDialog, setShowWhatsAppUpdateDialog] = useState(false);
  const [whatsappUpdateText, setWhatsappUpdateText] = useState("");
  const [whatsappUpdateId, setWhatsappUpdateId] = useState<string | null>(null);
  const [copiedUpdate, setCopiedUpdate] = useState(false);

  const [showDispatchHistoryDialog, setShowDispatchHistoryDialog] = useState(false);
  const [dispatchHistory, setDispatchHistory] = useState<UpdateDispatch[]>([]);
  const [dispatchHistoryLoading, setDispatchHistoryLoading] = useState(false);
  const [dispatchHistoryUpdateTitle, setDispatchHistoryUpdateTitle] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goalAmount: "",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
    homeTypes: [] as string[],
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (user && !canAccessModule(user?.role, 'campaigns')) return <AccessDenied />;

  const fetchCampaignDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCampaign(data);
      }
    } catch (error) {
      console.error("Error fetching campaign detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchTimeline = async (id: string) => {
    setTimelineLoading(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${id}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setTimelineLoading(false);
    }
  };

  const fetchWhatsAppAppeal = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/campaigns/${id}/whatsapp-appeal`);
      if (res.ok) {
        const data = await res.json();
        setWhatsappText(data.text);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp appeal:", error);
    }
  };

  const fetchCampaignDonors = async (id: string) => {
    setCampaignDonorsLoading(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${id}/donors`);
      if (res.ok) {
        const data = await res.json();
        setCampaignDonors(data);
      }
    } catch (error) {
      console.error("Error fetching campaign donors:", error);
    } finally {
      setCampaignDonorsLoading(false);
    }
  };

  const fetchAnalytics = async (id: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${id}/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleViewCampaign = (campaign: Campaign) => {
    fetchCampaignDetail(campaign.id);
    fetchTimeline(campaign.id);
    fetchWhatsAppAppeal(campaign.id);
    setDetailTab("overview");
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      toast({ title: "Copied", description: "WhatsApp appeal text copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Campaign name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        homeTypes: formData.homeTypes,
      };
      if (formData.goalAmount) payload.goalAmount = parseFloat(formData.goalAmount);
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.endDate) payload.endDate = formData.endDate;

      const res = await fetchWithAuth("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Campaign created successfully" });
        setShowCreateDialog(false);
        setFormData({ name: "", description: "", goalAmount: "", startDate: "", endDate: "", status: "ACTIVE", homeTypes: [] });
        fetchCampaigns();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to create campaign", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editData || !selectedCampaign) return;
    setUpdating(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}`, {
        method: "PUT",
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Campaign updated" });
        setShowEditDialog(false);
        fetchCampaigns();
        fetchCampaignDetail(selectedCampaign.id);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update campaign", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetchWithAuth(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Campaign deleted" });
        setSelectedCampaign(null);
        fetchCampaigns();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete campaign", variant: "destructive" });
    }
  };

  const searchDonors = async (query: string) => {
    setDonorsLoading(true);
    try {
      const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const donorList = data.donors || data.data || data;
        setDonors(Array.isArray(donorList) ? donorList : []);
      }
    } catch {
      console.error("Error searching donors");
    } finally {
      setDonorsLoading(false);
    }
  };

  const handleOpenEmailDialog = () => {
    setShowEmailDialog(true);
    setSelectedDonorIds([]);
    setDonorSearch("");
    searchDonors("");
  };

  const handleSendEmailAppeal = async () => {
    if (!selectedCampaign || selectedDonorIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one donor", variant: "destructive" });
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/send-email-appeal`, {
        method: "POST",
        body: JSON.stringify({ donorIds: selectedDonorIds }),
      });
      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Emails Queued",
          description: `${result.queued} emails queued, ${result.skipped} skipped (no email)`,
        });
        setShowEmailDialog(false);
        fetchTimeline(selectedCampaign.id);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to send emails", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send email appeals", variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  const toggleDonor = (donorId: string) => {
    setSelectedDonorIds((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const selectAllDonors = () => {
    if (selectedDonorIds.length === donors.length) {
      setSelectedDonorIds([]);
    } else {
      setSelectedDonorIds(donors.map((d) => d.id));
    }
  };

  const searchBeneficiaries = async (query: string) => {
    setBeneficiarySearchLoading(true);
    try {
      const res = await fetchWithAuth(`/api/beneficiaries?search=${encodeURIComponent(query)}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        const list = data.beneficiaries || data.data || data;
        setBeneficiaryResults(Array.isArray(list) ? list : []);
      }
    } catch {
      console.error("Error searching beneficiaries");
    } finally {
      setBeneficiarySearchLoading(false);
    }
  };

  const handleAddBeneficiaries = async () => {
    if (!selectedCampaign || selectedBeneficiaryIds.length === 0) return;
    setAddingBeneficiaries(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/beneficiaries`, {
        method: "POST",
        body: JSON.stringify({ beneficiaryIds: selectedBeneficiaryIds }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Beneficiaries attached to campaign" });
        setShowAddBeneficiaryDialog(false);
        setSelectedBeneficiaryIds([]);
        fetchCampaignDetail(selectedCampaign.id);
      }
    } catch {
      toast({ title: "Error", description: "Failed to add beneficiaries", variant: "destructive" });
    } finally {
      setAddingBeneficiaries(false);
    }
  };

  const handleRemoveBeneficiary = async (beneficiaryId: string) => {
    if (!selectedCampaign) return;
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/beneficiaries/${beneficiaryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Removed", description: "Beneficiary removed from campaign" });
        fetchCampaignDetail(selectedCampaign.id);
      }
    } catch {
      toast({ title: "Error", description: "Failed to remove beneficiary", variant: "destructive" });
    }
  };

  const handleCreateUpdate = async () => {
    if (!selectedCampaign || !updateForm.title.trim() || !updateForm.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }
    setCreatingUpdate(true);
    try {
      const photoUrls = updateForm.photoUrls
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/updates`, {
        method: "POST",
        body: JSON.stringify({
          title: updateForm.title,
          content: updateForm.content,
          photoUrls,
        }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Campaign update posted" });
        setShowAddUpdateDialog(false);
        setUpdateForm({ title: "", content: "", photoUrls: "" });
        fetchCampaignDetail(selectedCampaign.id);
      }
    } catch {
      toast({ title: "Error", description: "Failed to create update", variant: "destructive" });
    } finally {
      setCreatingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    if (!selectedCampaign) return;
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/updates/${updateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Deleted", description: "Campaign update deleted" });
        fetchCampaignDetail(selectedCampaign.id);
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete update", variant: "destructive" });
    }
  };

  const searchBroadcastDonors = async (query: string) => {
    setBroadcastDonorsLoading(true);
    try {
      const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const donorList = data.donors || data.data || data;
        setBroadcastDonors(Array.isArray(donorList) ? donorList : []);
      }
    } catch {
      console.error("Error searching donors");
    } finally {
      setBroadcastDonorsLoading(false);
    }
  };

  const handleOpenBroadcastDialog = (updateId: string) => {
    setBroadcastUpdateId(updateId);
    setShowBroadcastDialog(true);
    setSelectedBroadcastDonorIds([]);
    setBroadcastDonorSearch("");
    searchBroadcastDonors("");
  };

  const handleBroadcastUpdate = async () => {
    if (!selectedCampaign || !broadcastUpdateId || selectedBroadcastDonorIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one donor", variant: "destructive" });
      return;
    }
    setBroadcasting(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/updates/${broadcastUpdateId}/broadcast`, {
        method: "POST",
        body: JSON.stringify({ donorIds: selectedBroadcastDonorIds }),
      });
      if (res.ok) {
        const result = await res.json();
        toast({
          title: "Broadcast Sent",
          description: `${result.queued} emails queued, ${result.skipped} skipped (no email)`,
        });
        setShowBroadcastDialog(false);
        fetchCampaignDetail(selectedCampaign.id);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to broadcast", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to broadcast update", variant: "destructive" });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleOpenWhatsAppUpdate = async (updateId: string) => {
    if (!selectedCampaign) return;
    setWhatsappUpdateId(updateId);
    setShowWhatsAppUpdateDialog(true);
    setWhatsappUpdateText("Loading...");
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/updates/${updateId}/whatsapp-text`);
      if (res.ok) {
        const data = await res.json();
        setWhatsappUpdateText(data.text);
      }
    } catch {
      setWhatsappUpdateText("Failed to generate WhatsApp text");
    }
  };

  const handleCopyUpdateWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappUpdateText);
      setCopiedUpdate(true);
      toast({ title: "Copied", description: "WhatsApp update text copied to clipboard" });
      setTimeout(() => setCopiedUpdate(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  };

  const handleOpenDispatchHistory = async (updateId: string, updateTitle: string) => {
    if (!selectedCampaign) return;
    setShowDispatchHistoryDialog(true);
    setDispatchHistoryUpdateTitle(updateTitle);
    setDispatchHistoryLoading(true);
    try {
      const res = await fetchWithAuth(`/api/campaigns/${selectedCampaign.id}/updates/${updateId}/dispatches`);
      if (res.ok) {
        const data = await res.json();
        setDispatchHistory(data);
      }
    } catch {
      console.error("Error fetching dispatch history");
    } finally {
      setDispatchHistoryLoading(false);
    }
  };

  const toggleBroadcastDonor = (donorId: string) => {
    setSelectedBroadcastDonorIds((prev) =>
      prev.includes(donorId) ? prev.filter((id) => id !== donorId) : [...prev, donorId]
    );
  };

  const selectAllBroadcastDonors = () => {
    if (selectedBroadcastDonorIds.length === broadcastDonors.length) {
      setSelectedBroadcastDonorIds([]);
    } else {
      setSelectedBroadcastDonorIds(broadcastDonors.map((d) => d.id));
    }
  };

  const toggleHomeType = (homeType: string, target: any, setter: (v: any) => void) => {
    const current = target.homeTypes || [];
    const updated = current.includes(homeType)
      ? current.filter((h: string) => h !== homeType)
      : [...current, homeType];
    setter({ ...target, homeTypes: updated });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      DRAFT: "bg-muted text-muted-foreground",
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      PAUSED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <Badge className={variants[status] || ""} data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  const activeCampaigns = campaigns.filter((c) => ["ACTIVE", "DRAFT"].includes(c.status));
  const closedCampaigns = campaigns.filter((c) => ["COMPLETED", "CANCELLED", "PAUSED"].includes(c.status));

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString("en-IN")}`;
  };

  if (selectedCampaign) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCampaign(null)} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate" data-testid="text-campaign-name">{selectedCampaign.name}</h1>
            <p className="text-muted-foreground text-sm">{selectedCampaign.description || "No description"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(selectedCampaign.status)}
            {selectedCampaign.homeTypes && selectedCampaign.homeTypes.length > 0 && (
              selectedCampaign.homeTypes.map((ht) => (
                <Badge key={ht} variant="outline" className="text-xs" data-testid={`badge-home-${ht}`}>
                  <Home className="h-3 w-3 mr-1" />
                  {HOME_LABELS[ht] || ht}
                </Badge>
              ))
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditData({
                  name: selectedCampaign.name,
                  description: selectedCampaign.description || "",
                  goalAmount: selectedCampaign.goalAmount || "",
                  startDate: selectedCampaign.startDate ? selectedCampaign.startDate.split("T")[0] : "",
                  endDate: selectedCampaign.endDate ? selectedCampaign.endDate.split("T")[0] : "",
                  status: selectedCampaign.status,
                  homeTypes: selectedCampaign.homeTypes || [],
                });
                setShowEditDialog(true);
              }}
              data-testid="button-edit-campaign"
            >
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
            {user?.role === "ADMIN" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => handleDelete(selectedCampaign.id)}
                data-testid="button-delete-campaign"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
                  <IndianRupee className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Raised</p>
                  <p className="text-xl font-bold" data-testid="text-total-raised">{formatCurrency(selectedCampaign.totalRaised)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goal</p>
                  <p className="text-xl font-bold" data-testid="text-goal-amount">{selectedCampaign.goalAmount ? formatCurrency(selectedCampaign.goalAmount) : "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Donors</p>
                  <p className="text-xl font-bold" data-testid="text-donor-count">{selectedCampaign.donorCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-xl font-bold" data-testid="text-progress">{selectedCampaign.progressPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedCampaign.goalAmount > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium">Fundraising Progress</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(selectedCampaign.totalRaised)} / {formatCurrency(selectedCampaign.goalAmount)}
                </span>
              </div>
              <Progress value={selectedCampaign.progressPercent} className="h-3" data-testid="progress-bar" />
            </CardContent>
          </Card>
        )}

        <Tabs value={detailTab} onValueChange={(v) => {
          setDetailTab(v);
          if (v === "donors" && selectedCampaign) fetchCampaignDonors(selectedCampaign.id);
          if (v === "performance" && selectedCampaign) fetchAnalytics(selectedCampaign.id);
        }}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="beneficiaries" data-testid="tab-beneficiaries">
              Beneficiaries ({selectedCampaign.beneficiaries?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="updates" data-testid="tab-updates">
              Updates ({selectedCampaign.updates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="donors" data-testid="tab-donors">
              Donors ({selectedCampaign.donorCount})
            </TabsTrigger>
            <TabsTrigger value="performance" data-testid="tab-performance">
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {selectedCampaign.startDate && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Start: {format(new Date(selectedCampaign.startDate), "dd MMM yyyy")}
                </span>
                {selectedCampaign.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> End: {format(new Date(selectedCampaign.endDate), "dd MMM yyyy")}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                    <span>Appeal Actions</span>
                  </CardTitle>
                  <CardDescription>Send campaign appeals to donors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">WhatsApp Appeal</Label>
                    <div className="rounded-md border p-3 text-sm whitespace-pre-wrap bg-muted/50 max-h-40 overflow-y-auto" data-testid="text-whatsapp-appeal">
                      {whatsappText || "Loading..."}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleCopyWhatsApp}
                      data-testid="button-copy-whatsapp"
                    >
                      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {copied ? "Copied" : "Copy WhatsApp Text"}
                    </Button>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Email Appeal</Label>
                    <p className="text-sm text-muted-foreground mb-2">Send a fundraising appeal email to selected donors</p>
                    <Button variant="outline" size="sm" onClick={handleOpenEmailDialog} data-testid="button-send-email-appeal">
                      <Mail className="h-4 w-4 mr-1" /> Send Email Appeal
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Timeline</CardTitle>
                  <CardDescription>Donations and messages for this campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  {timelineLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {timeline.map((item, idx) => (
                        <div key={`${item.id}-${idx}`} className="flex items-start gap-3 text-sm">
                          <div className={`p-1.5 rounded-full mt-0.5 ${item.type === "DONATION" ? "bg-green-100 dark:bg-green-900" : "bg-blue-100 dark:bg-blue-900"}`}>
                            {item.type === "DONATION" ? (
                              <IndianRupee className="h-3 w-3 text-green-600 dark:text-green-400" />
                            ) : (
                              <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.type === "DONATION"
                                ? `${item.donorName} donated ${formatCurrency(item.amount || 0)}`
                                : `${item.channel} sent to ${item.donorName}`}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {format(new Date(item.date), "dd MMM yyyy, hh:mm a")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Linked Donations ({selectedCampaign.donations?.length || 0})</CardTitle>
                <CardDescription>Donations received for this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedCampaign.donations || selectedCampaign.donations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-donations">No donations linked to this campaign yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCampaign.donations.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{d.donor.firstName} {d.donor.lastName || ""}</p>
                                <p className="text-xs text-muted-foreground">{d.donor.donorCode}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(Number(d.donationAmount))}</TableCell>
                            <TableCell>{d.donationType}</TableCell>
                            <TableCell>{format(new Date(d.donationDate), "dd MMM yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beneficiaries" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-lg font-semibold">Attached Beneficiaries</h3>
              <Button
                size="sm"
                onClick={() => {
                  setShowAddBeneficiaryDialog(true);
                  setBeneficiarySearch("");
                  setBeneficiaryResults([]);
                  setSelectedBeneficiaryIds([]);
                  searchBeneficiaries("");
                }}
                data-testid="button-add-beneficiary"
              >
                <UserPlus className="h-4 w-4 mr-1" /> Add Beneficiaries
              </Button>
            </div>

            {!selectedCampaign.beneficiaries || selectedCampaign.beneficiaries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No beneficiaries attached to this campaign</p>
                  <p className="text-sm text-muted-foreground mt-1">Add beneficiaries to show who this campaign supports</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedCampaign.beneficiaries.map((cb) => (
                  <Card key={cb.id} data-testid={`card-beneficiary-${cb.beneficiary.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {cb.beneficiary.photoUrl && !cb.beneficiary.protectPrivacy ? (
                              <img src={cb.beneficiary.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <Heart className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{cb.beneficiary.fullName}</p>
                            <p className="text-xs text-muted-foreground">{cb.beneficiary.code}</p>
                            <Badge variant="outline" className="text-xs mt-1">{HOME_LABELS[cb.beneficiary.homeType] || cb.beneficiary.homeType}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive flex-shrink-0"
                          onClick={() => handleRemoveBeneficiary(cb.beneficiary.id)}
                          data-testid={`button-remove-beneficiary-${cb.beneficiary.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {cb.notes && <p className="text-sm text-muted-foreground mt-2">{cb.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="updates" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-lg font-semibold">Campaign Updates</h3>
              <Button
                size="sm"
                onClick={() => {
                  setShowAddUpdateDialog(true);
                  setUpdateForm({ title: "", content: "", photoUrls: "" });
                }}
                data-testid="button-add-update"
              >
                <Plus className="h-4 w-4 mr-1" /> Post Update
              </Button>
            </div>

            {!selectedCampaign.updates || selectedCampaign.updates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No updates posted yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Share progress and photos for this campaign</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {selectedCampaign.updates.map((upd) => (
                  <Card key={upd.id} data-testid={`card-update-${upd.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{upd.title}</CardTitle>
                          <CardDescription>
                            By {upd.createdBy.name} on {format(new Date(upd.createdAt), "dd MMM yyyy, hh:mm a")}
                            {upd._count && upd._count.dispatches > 0 && (
                              <span className="ml-2 text-xs">
                                <CheckCheck className="h-3 w-3 inline mr-0.5" />
                                Sent to {upd._count.dispatches} donors
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {(user?.role === "ADMIN" || user?.role === "STAFF") && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenBroadcastDialog(upd.id)}
                                    data-testid={`button-broadcast-update-${upd.id}`}
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Email Broadcast</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenWhatsAppUpdate(upd.id)}
                                    data-testid={`button-whatsapp-update-${upd.id}`}
                                  >
                                    <SiWhatsapp className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>WhatsApp Text</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenDispatchHistory(upd.id, upd.title)}
                                    data-testid={`button-dispatch-history-${upd.id}`}
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Send History</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          {user?.role === "ADMIN" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteUpdate(upd.id)}
                              data-testid={`button-delete-update-${upd.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{upd.content}</p>
                      {upd.photoUrls && upd.photoUrls.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {upd.photoUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={url}
                                alt={`Update photo ${i + 1}`}
                                className="w-24 h-24 rounded-md object-cover border"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="donors" className="space-y-4 mt-4">
            <h3 className="text-lg font-semibold">Campaign Donors</h3>
            {campaignDonorsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : campaignDonors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No donors have contributed to this campaign yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table data-testid="table-campaign-donors">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donor</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Donations</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Last Donation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignDonors.map((cd) => (
                          <TableRow key={cd.donor.id} data-testid={`row-donor-${cd.donor.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{cd.donor.firstName} {cd.donor.lastName || ""}</p>
                                <p className="text-xs text-muted-foreground">{cd.donor.donorCode}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {cd.donor.primaryPhone && <p>{cd.donor.primaryPhone}</p>}
                                {(cd.donor.personalEmail || cd.donor.officialEmail) && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{cd.donor.personalEmail || cd.donor.officialEmail}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{cd.donor.city || "-"}</TableCell>
                            <TableCell className="text-sm">{cd.donationCount}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(cd.totalAmount)}</TableCell>
                            <TableCell className="text-sm">{format(new Date(cd.lastDonation), "dd MMM yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-4">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !analytics ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No analytics data available</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Donations</p>
                      <p className="text-2xl font-bold" data-testid="text-analytics-total-donations">{analytics.summary.totalDonations}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Unique Donors</p>
                      <p className="text-2xl font-bold" data-testid="text-analytics-unique-donors">{analytics.summary.uniqueDonors}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Average Donation</p>
                      <p className="text-2xl font-bold" data-testid="text-analytics-avg-donation">{formatCurrency(analytics.summary.avgDonation)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold" data-testid="text-analytics-remaining">{formatCurrency(analytics.summary.remaining)}</p>
                    </CardContent>
                  </Card>
                </div>

                {analytics.monthlyDonations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Donations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64" data-testid="chart-monthly-donations">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.monthlyDonations}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <RTooltip formatter={(val: number) => formatCurrency(val)} />
                            <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analytics.cumulativeProgress.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cumulative Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64" data-testid="chart-cumulative-progress">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.cumulativeProgress}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <RTooltip formatter={(val: number) => formatCurrency(val)} />
                            <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analytics.byType.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>By Donation Type</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64" data-testid="chart-by-type">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.byType}
                                dataKey="amount"
                                nameKey="type"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                              >
                                {analytics.byType.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <RTooltip formatter={(val: number) => formatCurrency(val)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {analytics.byMode.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>By Payment Mode</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64" data-testid="chart-by-mode">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.byMode} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                              <YAxis dataKey="mode" type="category" tick={{ fontSize: 11 }} width={80} className="fill-muted-foreground" />
                              <RTooltip formatter={(val: number) => formatCurrency(val)} />
                              <Bar dataKey="amount" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {analytics.byHome.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>By Home</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48" data-testid="chart-by-home">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.byHome}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="home" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                            <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                            <RTooltip formatter={(val: number) => formatCurrency(val)} />
                            <Bar dataKey="amount" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
            </DialogHeader>
            {editData && (
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} data-testid="input-edit-name" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} data-testid="input-edit-description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Goal Amount</Label>
                    <Input type="number" value={editData.goalAmount} onChange={(e) => setEditData({ ...editData, goalAmount: e.target.value })} data-testid="input-edit-goal" />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editData.status} onValueChange={(v) => setEditData({ ...editData, status: v })}>
                      <SelectTrigger data-testid="select-edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={editData.startDate} onChange={(e) => setEditData({ ...editData, startDate: e.target.value })} data-testid="input-edit-start-date" />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={editData.endDate} onChange={(e) => setEditData({ ...editData, endDate: e.target.value })} data-testid="input-edit-end-date" />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Associated Homes</Label>
                  <div className="flex gap-2 flex-wrap">
                    {["ORPHAN_GIRLS", "BLIND_BOYS", "OLD_AGE"].map((ht) => (
                      <label key={ht} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={(editData.homeTypes || []).includes(ht)}
                          onCheckedChange={() => toggleHomeType(ht, editData, setEditData)}
                        />
                        <span className="text-sm">{HOME_LABELS[ht]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={updating} data-testid="button-save-edit">
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Send Email Appeal</DialogTitle>
              <DialogDescription>Select donors to receive the campaign appeal email</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search donors..."
                    value={donorSearch}
                    onChange={(e) => {
                      setDonorSearch(e.target.value);
                      searchDonors(e.target.value);
                    }}
                    className="pl-9"
                    data-testid="input-donor-search"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAllDonors} data-testid="button-select-all-donors">
                  {selectedDonorIds.length === donors.length && donors.length > 0 ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{selectedDonorIds.length} donor(s) selected</p>
              <div className="flex-1 overflow-y-auto border rounded-md">
                {donorsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : donors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No donors found</p>
                ) : (
                  <div className="divide-y">
                    {donors.map((donor) => (
                      <label
                        key={donor.id}
                        className="flex items-center gap-3 p-3 cursor-pointer hover-elevate"
                        data-testid={`donor-row-${donor.id}`}
                      >
                        <Checkbox
                          checked={selectedDonorIds.includes(donor.id)}
                          onCheckedChange={() => toggleDonor(donor.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{donor.firstName} {donor.lastName || ""}</p>
                          <p className="text-xs text-muted-foreground">{donor.donorCode} {donor.personalEmail || donor.officialEmail ? `- ${donor.personalEmail || donor.officialEmail}` : "- No email"}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
              <Button onClick={handleSendEmailAppeal} disabled={sendingEmail || selectedDonorIds.length === 0} data-testid="button-confirm-send-email">
                {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Send to {selectedDonorIds.length} Donor(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddBeneficiaryDialog} onOpenChange={setShowAddBeneficiaryDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Beneficiaries to Campaign</DialogTitle>
              <DialogDescription>Search and select beneficiaries to attach to this campaign</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search beneficiaries by name or code..."
                  value={beneficiarySearch}
                  onChange={(e) => {
                    setBeneficiarySearch(e.target.value);
                    searchBeneficiaries(e.target.value);
                  }}
                  className="pl-9"
                  data-testid="input-beneficiary-search"
                />
              </div>
              <p className="text-sm text-muted-foreground">{selectedBeneficiaryIds.length} beneficiary(ies) selected</p>
              <div className="flex-1 overflow-y-auto border rounded-md">
                {beneficiarySearchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : beneficiaryResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No beneficiaries found</p>
                ) : (
                  <div className="divide-y">
                    {beneficiaryResults.map((b) => {
                      const alreadyAttached = selectedCampaign?.beneficiaries?.some((cb) => cb.beneficiary.id === b.id);
                      return (
                        <label
                          key={b.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover-elevate ${alreadyAttached ? 'opacity-50' : ''}`}
                          data-testid={`beneficiary-row-${b.id}`}
                        >
                          <Checkbox
                            checked={selectedBeneficiaryIds.includes(b.id) || !!alreadyAttached}
                            onCheckedChange={() => {
                              if (alreadyAttached) return;
                              setSelectedBeneficiaryIds((prev) =>
                                prev.includes(b.id) ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                              );
                            }}
                            disabled={!!alreadyAttached}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{b.fullName}</p>
                            <p className="text-xs text-muted-foreground">{b.code} - {HOME_LABELS[b.homeType] || b.homeType}</p>
                          </div>
                          {alreadyAttached && <Badge variant="outline" className="text-xs">Already added</Badge>}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBeneficiaryDialog(false)}>Cancel</Button>
              <Button onClick={handleAddBeneficiaries} disabled={addingBeneficiaries || selectedBeneficiaryIds.length === 0} data-testid="button-confirm-add-beneficiaries">
                {addingBeneficiaries ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
                Add {selectedBeneficiaryIds.length} Beneficiary(ies)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddUpdateDialog} onOpenChange={setShowAddUpdateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post Campaign Update</DialogTitle>
              <DialogDescription>Share progress, news, or photos about this campaign</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  placeholder="Update title"
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                  data-testid="input-update-title"
                />
              </div>
              <div>
                <Label>Content *</Label>
                <Textarea
                  placeholder="Write your update here..."
                  value={updateForm.content}
                  onChange={(e) => setUpdateForm({ ...updateForm, content: e.target.value })}
                  rows={4}
                  data-testid="input-update-content"
                />
              </div>
              <div>
                <Label>Photo URLs (one per line)</Label>
                <Textarea
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                  value={updateForm.photoUrls}
                  onChange={(e) => setUpdateForm({ ...updateForm, photoUrls: e.target.value })}
                  rows={3}
                  data-testid="input-update-photos"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter image URLs, one per line</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUpdateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateUpdate} disabled={creatingUpdate} data-testid="button-submit-update">
                {creatingUpdate ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Post Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Broadcast Update</DialogTitle>
              <DialogDescription>Select donors to send this campaign update via email</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search donors by name, email, code..."
                    value={broadcastDonorSearch}
                    onChange={(e) => {
                      setBroadcastDonorSearch(e.target.value);
                      searchBroadcastDonors(e.target.value);
                    }}
                    className="pl-9"
                    data-testid="input-broadcast-donor-search"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAllBroadcastDonors} data-testid="button-select-all-broadcast">
                  {selectedBroadcastDonorIds.length === broadcastDonors.length && broadcastDonors.length > 0 ? "Deselect All" : "Select All"}
                </Button>
              </div>
              {selectedBroadcastDonorIds.length > 0 && (
                <p className="text-sm text-muted-foreground">{selectedBroadcastDonorIds.length} donor(s) selected</p>
              )}
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {broadcastDonorsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : broadcastDonors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No donors found</p>
                ) : (
                  broadcastDonors.map((donor) => (
                    <div
                      key={donor.id}
                      className="flex items-center gap-3 p-3 border-b last:border-b-0 hover-elevate cursor-pointer"
                      onClick={() => toggleBroadcastDonor(donor.id)}
                      data-testid={`broadcast-donor-${donor.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBroadcastDonorIds.includes(donor.id)}
                        onChange={() => toggleBroadcastDonor(donor.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {donor.firstName} {donor.lastName || ""}
                          <span className="text-muted-foreground ml-1">({donor.donorCode})</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {donor.personalEmail || donor.officialEmail || "No email"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>Cancel</Button>
              <Button
                onClick={handleBroadcastUpdate}
                disabled={broadcasting || selectedBroadcastDonorIds.length === 0}
                data-testid="button-send-broadcast"
              >
                {broadcasting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Send to {selectedBroadcastDonorIds.length} Donor(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showWhatsAppUpdateDialog} onOpenChange={setShowWhatsAppUpdateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>WhatsApp Update Text</DialogTitle>
              <DialogDescription>Copy this formatted text and share it via WhatsApp</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted rounded-md p-4 max-h-72 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans">{whatsappUpdateText}</pre>
              </div>
              <div className="flex items-center gap-2">
                <Button className="flex-1" onClick={handleCopyUpdateWhatsApp} data-testid="button-copy-whatsapp-update">
                  {copiedUpdate ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copiedUpdate ? "Copied" : "Copy to Clipboard"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const encoded = encodeURIComponent(whatsappUpdateText);
                    window.open(`https://wa.me/?text=${encoded}`, "_blank");
                  }}
                  data-testid="button-open-whatsapp-update"
                >
                  <SiWhatsapp className="h-4 w-4 mr-1" /> Open WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDispatchHistoryDialog} onOpenChange={setShowDispatchHistoryDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send History</DialogTitle>
              <DialogDescription>Broadcast history for: {dispatchHistoryUpdateTitle}</DialogDescription>
            </DialogHeader>
            <div>
              {dispatchHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : dispatchHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No broadcast history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Send this update to donors via email to see history here</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3 font-medium">Donor</th>
                        <th className="text-left p-3 font-medium">Channel</th>
                        <th className="text-left p-3 font-medium">Status</th>
                        <th className="text-left p-3 font-medium">Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchHistory.map((d) => (
                        <tr key={d.id} className="border-b last:border-b-0" data-testid={`dispatch-row-${d.id}`}>
                          <td className="p-3">
                            <p className="font-medium">{d.donor.firstName} {d.donor.lastName || ""}</p>
                            <p className="text-xs text-muted-foreground">{d.donor.donorCode}</p>
                          </td>
                          <td className="p-3">
                            <Badge className={d.channel === "EMAIL" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}>
                              {d.channel === "EMAIL" ? <Mail className="h-3 w-3 mr-1" /> : <MessageCircle className="h-3 w-3 mr-1" />}
                              {d.channel}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={
                              d.status === "SENT" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : d.status === "QUEUED" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : d.status === "FAILED" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-muted text-muted-foreground"
                            }>
                              {d.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {d.sentAt ? format(new Date(d.sentAt), "dd MMM yyyy, hh:mm a") : d.createdAt ? format(new Date(d.createdAt), "dd MMM yyyy, hh:mm a") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Fundraising Campaigns</h1>
          <p className="text-muted-foreground">Manage your fundraising campaigns and track progress</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={fetchCampaigns} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-campaign">
            <Plus className="h-4 w-4 mr-1" /> New Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold" data-testid="text-active-count">{activeCampaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                <IndianRupee className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-bold" data-testid="text-total-raised-all">
                  {formatCurrency(campaigns.reduce((sum, c) => sum + c.totalRaised, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Donors</p>
                <p className="text-2xl font-bold" data-testid="text-total-donors-all">
                  {campaigns.reduce((sum, c) => sum + c.donorCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">
            Active ({activeCampaigns.length})
          </TabsTrigger>
          <TabsTrigger value="closed" data-testid="tab-closed">
            Closed ({closedCampaigns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activeCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No active campaigns</p>
                <p className="text-muted-foreground mb-4">Create your first fundraising campaign to get started</p>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-campaign">
                  <Plus className="h-4 w-4 mr-1" /> Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {activeCampaigns.map((campaign) => (
                <Card key={campaign.id} className="cursor-pointer hover-elevate" onClick={() => handleViewCampaign(campaign)} data-testid={`card-campaign-${campaign.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    {campaign.description && (
                      <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {campaign.goalAmount > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{campaign.progressPercent}%</span>
                        </div>
                        <Progress value={campaign.progressPercent} className="h-2" />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Raised</span>
                      <span className="font-medium">{formatCurrency(campaign.totalRaised)}</span>
                    </div>
                    {campaign.goalAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Goal</span>
                        <span className="font-medium">{formatCurrency(campaign.goalAmount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Donors</span>
                      <span className="font-medium">{campaign.donorCount}</span>
                    </div>
                    {campaign.homeTypes && campaign.homeTypes.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {campaign.homeTypes.map((ht) => (
                          <Badge key={ht} variant="outline" className="text-xs">
                            {HOME_LABELS[ht] || ht}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {campaign.startDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(campaign.startDate), "dd MMM yyyy")}
                        {campaign.endDate && ` - ${format(new Date(campaign.endDate), "dd MMM yyyy")}`}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : closedCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No closed campaigns</p>
                <p className="text-muted-foreground">Completed and cancelled campaigns will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Raised</TableHead>
                    <TableHead>Donors</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedCampaigns.map((campaign) => (
                    <TableRow key={campaign.id} className="cursor-pointer" onClick={() => handleViewCampaign(campaign)} data-testid={`row-campaign-${campaign.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          {campaign.description && <p className="text-xs text-muted-foreground line-clamp-1">{campaign.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>{campaign.goalAmount > 0 ? formatCurrency(campaign.goalAmount) : "-"}</TableCell>
                      <TableCell>{formatCurrency(campaign.totalRaised)}</TableCell>
                      <TableCell>{campaign.donorCount}</TableCell>
                      <TableCell className="text-sm">
                        {campaign.startDate ? format(new Date(campaign.startDate), "dd MMM yy") : "-"}
                        {campaign.endDate ? ` - ${format(new Date(campaign.endDate), "dd MMM yy")}` : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewCampaign(campaign); }} data-testid={`button-view-${campaign.id}`}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Set up a new fundraising campaign</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="Campaign name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-campaign-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the campaign purpose..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-campaign-description"
              />
            </div>
            <div>
              <Label>Goal Amount</Label>
              <Input
                type="number"
                placeholder="500000"
                value={formData.goalAmount}
                onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                data-testid="input-goal-amount"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Associated Homes</Label>
              <div className="flex gap-3 flex-wrap">
                {["ORPHAN_GIRLS", "BLIND_BOYS", "OLD_AGE"].map((ht) => (
                  <label key={ht} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.homeTypes.includes(ht)}
                      onCheckedChange={() => toggleHomeType(ht, formData, setFormData)}
                    />
                    <span className="text-sm">{HOME_LABELS[ht]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating} data-testid="button-submit-campaign">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
