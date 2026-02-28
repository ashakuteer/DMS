"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { 
  ArrowLeft,
  Loader2,
  HandHeart,
  Heart,
  Edit,
  Camera,
  User,
  Users,
  Calendar,
  Clock,
  Home,
  Book,
  Star,
  MessageSquare,
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  Send,
  Mail,
  Lock,
  Eye,
  Activity,
  Ruler,
  GraduationCap,
  FileText,
  AlertTriangle,
  Shield,
  Download,
  TrendingUp,
  Stethoscope,
  Scale,
  Paperclip,
  Check,
  X,
  Link,
  History,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Beneficiary {
  id: string;
  code: string;
  fullName: string;
  homeType: 'ORPHAN_GIRLS' | 'BLIND_BOYS' | 'OLD_AGE';
  gender?: string;
  dobDay?: number;
  dobMonth?: number;
  dobYear?: number;
  approxAge?: number;
  joinDate?: string;
  educationClassOrRole?: string;
  schoolOrCollege?: string;
  healthNotes?: string;
  currentHealthStatus?: string;
  background?: string;
  hobbies?: string;
  dreamCareer?: string;
  favouriteSubject?: string;
  favouriteGame?: string;
  favouriteActivityAtHome?: string;
  bestFriend?: string;
  sourceOfPrideOrHappiness?: string;
  funFact?: string;
  additionalNotes?: string;
  heightCmAtJoin?: number;
  weightKgAtJoin?: number;
  protectPrivacy: boolean;
  photoUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  activeSponsorsCount: number;
  updatesCount: number;
  sponsorships: Sponsorship[];
  updates: BeneficiaryUpdate[];
  timelineEvents: TimelineEvent[];
  documents?: BeneficiaryDocument[];
  createdBy: { id: string; name: string };
}

interface SponsorshipHistoryEntry {
  id: string;
  oldStatus: string;
  newStatus: string;
  oldAmount?: number;
  newAmount?: number;
  note?: string;
  changedAt: string;
  changedBy?: { id: string; name: string };
}

interface Sponsorship {
  id: string;
  donorId: string;
  sponsorshipType: string;
  amount?: number;
  currency: string;
  inKindItem?: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  donor: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName?: string;
    primaryPhone?: string;
    personalEmail?: string;
  };
}

interface BeneficiaryUpdate {
  id: string;
  title: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  createdBy: { id: string; name: string };
}

interface TimelineEvent {
  id: string;
  eventType: string;
  eventDate: string;
  description: string;
  createdAt: string;
}

interface DonorSearchResult {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
}

interface BeneficiaryMetric {
  id: string;
  beneficiaryId: string;
  recordedOn: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  notes?: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

interface ProgressCard {
  id: string;
  beneficiaryId: string;
  academicYear: string;
  term: string;
  classGrade: string;
  school?: string;
  overallPercentage?: number;
  remarks?: string;
  fileDocumentId?: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  fileDocument?: { id: string; title: string; storagePath: string; mimeType: string };
}

interface HealthEvent {
  id: string;
  beneficiaryId: string;
  eventDate: string;
  title: string;
  description: string;
  severity: string;
  requiresDonorUpdate: boolean;
  shareWithDonor: boolean;
  documentId?: string;
  document?: { id: string; title: string; storagePath: string; mimeType: string; sizeBytes: number };
  createdAt: string;
  createdBy: { id: string; name: string };
}

interface HealthTimelineItem {
  id: string;
  type: 'METRIC' | 'EVENT';
  date: string;
  title: string;
  summary: string;
  healthStatus?: string;
  heightCm?: number;
  weightKg?: number;
  severity?: string;
  shareWithDonor?: boolean;
  document?: { id: string; title: string; storagePath: string; mimeType: string; sizeBytes: number };
  notes?: string;
  createdBy: { id: string; name: string };
  createdAt: string;
}

interface EducationTimelineItem {
  id: string;
  type: 'PROGRESS_CARD' | 'TIMELINE_EVENT';
  date: string;
  title: string;
  summary: string;
  academicYear?: string;
  term?: string;
  classGrade?: string;
  school?: string;
  overallPercentage?: number;
  remarks?: string;
  eventType?: string;
  fileDocument?: { id: string; title: string; storagePath: string; mimeType: string };
  createdBy: { id: string; name: string };
  createdAt: string;
}

interface BeneficiaryDocument {
  id: string;
  ownerType: string;
  ownerId: string;
  docType: string;
  title: string;
  description?: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  isSensitive: boolean;
  shareWithDonor: boolean;
  createdAt: string;
  createdBy: { id: string; name: string };
}

const SPONSORSHIP_TYPES = [
  { value: "FULL", label: "Full Sponsorship" },
  { value: "PARTIAL", label: "Partial Sponsorship" },
  { value: "EDUCATION", label: "Education" },
  { value: "MEDICAL", label: "Medical" },
  { value: "FOOD", label: "Food" },
  { value: "GROCERIES", label: "Groceries" },
  { value: "MONTHLY_SUPPORT", label: "Monthly Support" },
  { value: "ONE_TIME", label: "One-Time" },
];

const FREQUENCIES = [
  { value: "ONE_TIME", label: "One-Time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "ADHOC", label: "Ad-Hoc" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getHomeTypeBadgeColor(homeType: string) {
  switch (homeType) {
    case 'ORPHAN_GIRLS':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
    case 'BLIND_BOYS':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'OLD_AGE':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getHomeTypeLabel(homeType: string) {
  switch (homeType) {
    case 'ORPHAN_GIRLS': return 'Orphan Girls Home';
    case 'BLIND_BOYS': return 'Visually Challenged Boys Home';
    case 'OLD_AGE': return 'Old Age Home';
    default: return homeType;
  }
}

function formatAge(dobDay?: number, dobMonth?: number, dobYear?: number, approxAge?: number): string {
  if (approxAge) return `~${approxAge} years old`;
  if (dobMonth) {
    const month = MONTHS[dobMonth - 1];
    if (dobDay && dobYear) return `Born on ${month} ${dobDay}, ${dobYear}`;
    if (dobDay) return `Born on ${month} ${dobDay}`;
    if (dobYear) return `Born in ${month} ${dobYear}`;
    return `Born in ${month}`;
  }
  if (dobYear) return `Born in ${dobYear}`;
  return 'Age unknown';
}

function formatAmount(amount?: number, currency: string = 'INR'): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BeneficiaryProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const beneficiaryId = params.id as string;

  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

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
  const [loadingSponsorData, setLoadingSponsorData] = useState(false);
  const [sendingToSponsors, setSendingToSponsors] = useState(false);

  const [metrics, setMetrics] = useState<BeneficiaryMetric[]>([]);
  const [progressCards, setProgressCards] = useState<ProgressCard[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [documents, setDocuments] = useState<BeneficiaryDocument[]>([]);

  const [showAddMetricDialog, setShowAddMetricDialog] = useState(false);
  const [showAddHealthEventDialog, setShowAddHealthEventDialog] = useState(false);
  const [showAddProgressCardDialog, setShowAddProgressCardDialog] = useState(false);
  const [showUploadDocumentDialog, setShowUploadDocumentDialog] = useState(false);

  const [addMetricLoading, setAddMetricLoading] = useState(false);
  const [addHealthEventLoading, setAddHealthEventLoading] = useState(false);
  const [addProgressCardLoading, setAddProgressCardLoading] = useState(false);
  const [uploadDocumentLoading, setUploadDocumentLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [progressCardsLoading, setProgressCardsLoading] = useState(false);
  const [healthEventsLoading, setHealthEventsLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showLinkPhotoDialog, setShowLinkPhotoDialog] = useState(false);
  const [linkPhotoUrl, setLinkPhotoUrl] = useState("");

  const [newMetric, setNewMetric] = useState({
    recordedOn: format(new Date(), "yyyy-MM-dd"),
    heightCm: "",
    weightKg: "",
    healthStatus: "NORMAL",
    notes: "",
  });

  const [healthTimeline, setHealthTimeline] = useState<HealthTimelineItem[]>([]);
  const [healthTimelineLoading, setHealthTimelineLoading] = useState(false);
  const [educationTimeline, setEducationTimeline] = useState<EducationTimelineItem[]>([]);
  const [educationTimelineLoading, setEducationTimelineLoading] = useState(false);
  const [educationExporting, setEducationExporting] = useState(false);
  const [healthEventFile, setHealthEventFile] = useState<File | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [newProgressCard, setNewProgressCard] = useState({
    academicYear: "",
    term: "TERM_1",
    classGrade: "",
    school: "",
    overallPercentage: "",
    remarks: "",
  });

  const [newHealthEvent, setNewHealthEvent] = useState({
    eventDate: format(new Date(), "yyyy-MM-dd"),
    title: "",
    description: "",
    severity: "LOW",
    requiresDonorUpdate: false,
    shareWithDonor: false,
  });

  const [newDocument, setNewDocument] = useState({
    title: "",
    docType: "OTHER",
    description: "",
    isSensitive: false,
    shareWithDonor: false,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [progressCardFile, setProgressCardFile] = useState<File | null>(null);

  const fetchBeneficiary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch beneficiary");
      }
      const data = await response.json();
      console.log('[Beneficiary Profile]', data.code, { photoUrl: data.photoUrl, photoPath: data.photoPath });
      if (!data.photoUrl) {
        console.log(`[Beneficiary Profile] photoUrl not saved for ${data.code} (${data.id})`);
      }
      setBeneficiary(data);
    } catch (error) {
      console.error("Failed to fetch beneficiary:", error);
      toast({
        title: "Error",
        description: "Failed to load beneficiary profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [beneficiaryId, toast]);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  }, [beneficiaryId]);

  const fetchProgressCards = useCallback(async () => {
    setProgressCardsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/progress-cards`);
      if (response.ok) {
        const data = await response.json();
        setProgressCards(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch progress cards:", error);
    } finally {
      setProgressCardsLoading(false);
    }
  }, [beneficiaryId]);

  const fetchHealthEvents = useCallback(async () => {
    setHealthEventsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/health-events`);
      if (response.ok) {
        const data = await response.json();
        setHealthEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch health events:", error);
    } finally {
      setHealthEventsLoading(false);
    }
  }, [beneficiaryId]);

  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setDocumentsLoading(false);
    }
  }, [beneficiaryId]);

  const fetchHealthTimeline = useCallback(async () => {
    setHealthTimelineLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/health-timeline`);
      if (response.ok) {
        const data = await response.json();
        setHealthTimeline(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch health timeline:", error);
    } finally {
      setHealthTimelineLoading(false);
    }
  }, [beneficiaryId]);

  const fetchEducationTimeline = useCallback(async () => {
    setEducationTimelineLoading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/education-timeline`);
      if (response.ok) {
        const data = await response.json();
        setEducationTimeline(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch education timeline:", error);
    } finally {
      setEducationTimelineLoading(false);
    }
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
    if (!query || query.length < 2) {
      setDonorSearchResults([]);
      return;
    }

    setDonorSearchLoading(true);
    try {
      const response = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setDonorSearchResults(data.items || []);
      }
    } catch (error) {
      console.error("Failed to search donors:", error);
    } finally {
      setDonorSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (donorSearch) searchDonors(donorSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [donorSearch, searchDonors]);

  const handleAddSponsor = async () => {
    if (!selectedDonor) {
      toast({
        title: "Error",
        description: "Please select a donor",
        variant: "destructive",
      });
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add sponsor");
      }

      toast({
        title: "Success",
        description: "Sponsor linked successfully",
      });

      setShowAddSponsorDialog(false);
      setSelectedDonor(null);
      setDonorSearch("");
      setNewSponsorship({
        sponsorshipType: "FULL",
        amount: "",
        inKindItem: "",
        frequency: "ADHOC",
        startDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      fetchBeneficiary();
    } catch (error: any) {
      console.error("Failed to add sponsor:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add sponsor",
        variant: "destructive",
      });
    } finally {
      setAddSponsorLoading(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    setAddUpdateLoading(true);
    try {
      const payload = {
        ...newUpdate,
        documentIds: selectedAttachmentIds.length > 0 ? selectedAttachmentIds : undefined,
      };
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add update");
      }

      toast({
        title: "Success",
        description: "Update added successfully",
      });

      setShowAddUpdateDialog(false);
      setNewUpdate({ title: "", content: "", updateType: "GENERAL", isPrivate: false });
      setSelectedAttachmentIds([]);
      fetchBeneficiary();
    } catch (error) {
      console.error("Failed to add update:", error);
      toast({
        title: "Error",
        description: "Failed to add update",
        variant: "destructive",
      });
    } finally {
      setAddUpdateLoading(false);
    }
  };

  const handleOpenSendToSponsors = async (updateId: string) => {
    setSelectedUpdateId(updateId);
    setShowSendToSponsorsDialog(true);
    setLoadingSponsorData(true);
    
    try {
      const response = await fetchWithAuth(`/api/beneficiary-updates/${updateId}/sponsors`);
      if (response.ok) {
        const data = await response.json();
        setSponsorDispatchData(data);
      } else {
        throw new Error("Failed to load sponsor data");
      }
    } catch (error) {
      console.error("Failed to load sponsor data:", error);
      toast({
        title: "Error",
        description: "Failed to load sponsor information",
        variant: "destructive",
      });
    } finally {
      setLoadingSponsorData(false);
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
      
      if (!response.ok) {
        throw new Error("Failed to send update to sponsors");
      }
      
      const result = await response.json();
      toast({
        title: "Success",
        description: `Update sent to ${result.dispatchCount || 0} sponsor(s) via ${channel}`,
      });
      
      setShowSendToSponsorsDialog(false);
      setSponsorDispatchData(null);
    } catch (error) {
      console.error("Failed to send to sponsors:", error);
      toast({
        title: "Error",
        description: "Failed to send update to sponsors",
        variant: "destructive",
      });
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
        body: JSON.stringify({
          status: statusChangeData.status,
          notes: statusChangeData.note || undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      toast({ title: "Success", description: "Sponsorship status updated" });
      setShowStatusChangeDialog(false);
      fetchBeneficiary();
    } catch (error) {
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
      const data = await response.json();
      setHistoryEntries(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load history", variant: "destructive" });
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "ACTIVE": return "default";
      case "PAUSED": return "outline";
      case "COMPLETED": return "secondary";
      case "STOPPED": return "destructive";
      default: return "outline";
    }
  };

  const handleDeleteSponsorship = async (sponsorshipId: string) => {
    try {
      const response = await fetchWithAuth(`/api/sponsorships/${sponsorshipId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove sponsorship");
      }

      toast({
        title: "Success",
        description: "Sponsorship removed",
      });
      fetchBeneficiary();
    } catch (error) {
      console.error("Failed to remove sponsorship:", error);
      toast({
        title: "Error",
        description: "Failed to remove sponsorship",
        variant: "destructive",
      });
    }
  };

  const handleAddMetric = async () => {
    setAddMetricLoading(true);
    try {
      const payload: any = {};
      if (newMetric.recordedOn) payload.recordedOn = newMetric.recordedOn;
      if (newMetric.heightCm) payload.heightCm = parseFloat(newMetric.heightCm);
      if (newMetric.weightKg) payload.weightKg = parseFloat(newMetric.weightKg);
      payload.healthStatus = newMetric.healthStatus || "NORMAL";
      if (newMetric.notes) payload.notes = newMetric.notes;

      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add measurement");
      }

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

        const uploadResponse = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadedDoc = await uploadResponse.json();
          fileDocumentId = uploadedDoc.id;
        }
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

        const uploadResponse = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadedDoc = await uploadResponse.json();
          documentId = uploadedDoc.id;
        }
      }

      const payload = { ...newHealthEvent, documentId };
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/health-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to add health event");
      }

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

      if (!response.ok) {
        throw new Error("Failed to notify sponsors");
      }

      toast({ title: "Success", description: "Sponsors notified successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to notify sponsors", variant: "destructive" });
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

      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiaryId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload document");
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
      window.open(storagePath, "_blank");
    } catch (error) {
      window.open(storagePath, "_blank");
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "LOW": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "HIGH": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "CRITICAL": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NORMAL": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "SICK": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "HOSPITALIZED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "UNDER_TREATMENT": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthStatusLabel = (status: string) => {
    switch (status) {
      case "NORMAL": return "Normal";
      case "SICK": return "Sick";
      case "HOSPITALIZED": return "Hospitalized";
      case "UNDER_TREATMENT": return "Under Treatment";
      default: return status;
    }
  };

  const getTermLabel = (term: string) => {
    switch (term) {
      case "TERM_1": return "Term 1";
      case "TERM_2": return "Term 2";
      case "TERM_3": return "Term 3";
      case "ANNUAL": return "Annual";
      default: return term;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const growthChartData = useMemo(() => {
    const data: { date: string; dateLabel: string; heightCm?: number; weightKg?: number }[] = [];
    if (beneficiary && (beneficiary.heightCmAtJoin || beneficiary.weightKgAtJoin)) {
      const joinDate = beneficiary.joinDate ? new Date(beneficiary.joinDate) : beneficiary.createdAt ? new Date(beneficiary.createdAt) : null;
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

  const handleShareProgressCard = async (card: ProgressCard) => {
    try {
      const updatePayload = {
        title: `Academic Progress - ${card.academicYear} ${getTermLabel(card.term)}`,
        content: `${beneficiary!.fullName} has received their ${getTermLabel(card.term)} progress card for ${card.academicYear}.\n\nClass: ${card.classGrade}${card.school ? `\nSchool: ${card.school}` : ""}${card.overallPercentage != null ? `\nOverall Score: ${card.overallPercentage}%` : ""}${card.remarks ? `\nRemarks: ${card.remarks}` : ""}`,
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

      handleOpenSendToSponsors(createdUpdate.id);
      fetchBeneficiary();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to share progress card", variant: "destructive" });
    }
  };

  const generateWhatsAppMessage = (sponsorship: Sponsorship) => {
    if (!beneficiary) return "";
    const donorName = `${sponsorship.donor.firstName} ${sponsorship.donor.lastName || ""}`.trim();
    const message = `Dear ${donorName},\n\nThank you for your continued support for ${beneficiary.fullName} at Asha Kuteer Foundation.\n\nYour sponsorship means the world to them and helps us provide care, education, and a loving home.\n\nWith gratitude,\nAsha Kuteer Foundation`;
    return encodeURIComponent(message);
  };

  const copyMessage = (sponsorship: Sponsorship) => {
    const message = decodeURIComponent(generateWhatsAppMessage(sponsorship));
    navigator.clipboard.writeText(message);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !beneficiary) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
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
      formData.append('photo', file);
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiary.id}/photo`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.message || `Upload failed (${response.status})`;
        console.error('Photo upload failed:', { status: response.status, error: errorData });
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setBeneficiary(prev => prev ? { ...prev, photoUrl: data.photoUrl } : prev);
      toast({ title: "Success", description: "Photo uploaded successfully" });
    } catch (error: any) {
      const msg = error?.message || "Failed to upload photo. Please try again.";
      console.error('Photo upload error:', error);
      toast({ title: "Photo upload failed", description: msg, variant: "destructive" });
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handlePhotoRemove = async () => {
    if (!beneficiary) return;
    setPhotoUploading(true);
    try {
      const response = await fetchWithAuth(`/api/beneficiaries/${beneficiary.id}/photo`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      setBeneficiary(prev => prev ? { ...prev, photoUrl: undefined } : prev);
      toast({ title: "Success", description: "Photo removed" });
    } catch (error) {
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: linkPhotoUrl.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Failed to link photo');
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

  const user = authStorage.getUser();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';
  if (user && !canAccessModule(user?.role, 'beneficiaries')) return <AccessDenied />;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <HandHeart className="h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium">Beneficiary not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push("/dashboard/beneficiaries")} className="mb-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Beneficiaries
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0 relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={beneficiary.photoUrl || undefined} alt={beneficiary.fullName} />
                <AvatarFallback className="text-2xl">
                  {beneficiary.fullName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {canEdit && (
                <>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="photo-upload"
                    onChange={handlePhotoUpload}
                    data-testid="input-photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    data-testid="button-upload-photo"
                  >
                    {photoUploading ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </label>
                  {beneficiary.photoUrl && (
                    <button
                      onClick={handlePhotoRemove}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 invisible group-hover:visible"
                      disabled={photoUploading}
                      data-testid="button-remove-photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </>
              )}
              {isAdmin && !beneficiary.photoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => setShowLinkPhotoDialog(true)}
                  data-testid="button-link-existing-photo"
                >
                  <Link className="h-3 w-3 mr-1" />
                  Link Photo
                </Button>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-bold" data-testid="text-beneficiary-name">
                    {beneficiary.fullName}
                  </h1>
                  <p className="text-muted-foreground font-mono" data-testid="text-beneficiary-code">
                    {beneficiary.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getHomeTypeBadgeColor(beneficiary.homeType)}>
                    {getHomeTypeLabel(beneficiary.homeType)}
                  </Badge>
                  <Badge variant={beneficiary.status === "ACTIVE" ? "default" : "secondary"}>
                    {beneficiary.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatAge(beneficiary.dobDay, beneficiary.dobMonth, beneficiary.dobYear, beneficiary.approxAge)}
                </span>
                {beneficiary.gender && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {beneficiary.gender}
                  </span>
                )}
                {beneficiary.currentHealthStatus && (
                  <Badge className={getHealthStatusBadgeClass(beneficiary.currentHealthStatus)} data-testid="badge-current-health-status">
                    <Stethoscope className="h-3 w-3 mr-1" />
                    {getHealthStatusLabel(beneficiary.currentHealthStatus)}
                  </Badge>
                )}
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-pink-500" />
                  {beneficiary.activeSponsorsCount} Sponsors
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {beneficiary.updatesCount} Updates
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 w-full max-w-2xl h-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="sponsors" data-testid="tab-sponsors">Sponsors</TabsTrigger>
          <TabsTrigger value="updates" data-testid="tab-updates">Updates</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
          <TabsTrigger value="health" data-testid="tab-health">
            <Activity className="h-4 w-4 mr-1" />
            Health & Growth
          </TabsTrigger>
          <TabsTrigger value="academics" data-testid="tab-academics">
            <GraduationCap className="h-4 w-4 mr-1" />
            Academics
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText className="h-4 w-4 mr-1" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  Education & Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {beneficiary.educationClassOrRole && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Class / Role</Label>
                    <p>{beneficiary.educationClassOrRole}</p>
                  </div>
                )}
                {beneficiary.schoolOrCollege && (
                  <div>
                    <Label className="text-xs text-muted-foreground">School / College</Label>
                    <p>{beneficiary.schoolOrCollege}</p>
                  </div>
                )}
                {beneficiary.background && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Background</Label>
                    <p className="text-sm">{beneficiary.background}</p>
                  </div>
                )}
                {beneficiary.currentHealthStatus && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Current Health Status</Label>
                    <Badge className={`mt-1 ${getHealthStatusBadgeClass(beneficiary.currentHealthStatus)}`}>
                      {getHealthStatusLabel(beneficiary.currentHealthStatus)}
                    </Badge>
                  </div>
                )}
                {beneficiary.healthNotes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Health Notes</Label>
                    <p className="text-sm">{beneficiary.healthNotes}</p>
                  </div>
                )}
                {!beneficiary.educationClassOrRole && !beneficiary.schoolOrCollege && !beneficiary.background && !beneficiary.healthNotes && !beneficiary.currentHealthStatus && (
                  <p className="text-muted-foreground text-sm">No education information available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Interests & Aspirations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {beneficiary.dreamCareer && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Dream Career</Label>
                    <p>{beneficiary.dreamCareer}</p>
                  </div>
                )}
                {beneficiary.hobbies && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Hobbies</Label>
                    <p>{beneficiary.hobbies}</p>
                  </div>
                )}
                {beneficiary.favouriteSubject && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Favourite Subject</Label>
                    <p>{beneficiary.favouriteSubject}</p>
                  </div>
                )}
                {beneficiary.favouriteGame && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Favourite Game</Label>
                    <p>{beneficiary.favouriteGame}</p>
                  </div>
                )}
                {beneficiary.funFact && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Fun Fact</Label>
                    <p className="text-sm">{beneficiary.funFact}</p>
                  </div>
                )}
                {!beneficiary.dreamCareer && !beneficiary.hobbies && !beneficiary.favouriteSubject && !beneficiary.favouriteGame && !beneficiary.funFact && (
                  <p className="text-muted-foreground text-sm">No interests information available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {(beneficiary.heightCmAtJoin || beneficiary.weightKgAtJoin) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Initial Measurements (at Join)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6">
                  {beneficiary.heightCmAtJoin && (
                    <div data-testid="text-height-at-join">
                      <Label className="text-xs text-muted-foreground">Height</Label>
                      <p className="text-lg font-semibold">{beneficiary.heightCmAtJoin} cm</p>
                    </div>
                  )}
                  {beneficiary.weightKgAtJoin && (
                    <div data-testid="text-weight-at-join">
                      <Label className="text-xs text-muted-foreground">Weight</Label>
                      <p className="text-lg font-semibold">{beneficiary.weightKgAtJoin} kg</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {beneficiary.additionalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{beneficiary.additionalNotes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sponsors" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-semibold" data-testid="text-sponsors-count">Sponsors ({beneficiary.sponsorships.length})</h3>
            {canEdit && (
              <Button onClick={() => setShowAddSponsorDialog(true)} data-testid="button-add-sponsor">
                <Plus className="h-4 w-4 mr-2" />
                Link Sponsor
              </Button>
            )}
          </div>

          {beneficiary.sponsorships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <Heart className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No sponsors yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {beneficiary.sponsorships.map((sponsorship) => (
                <Card key={sponsorship.id} data-testid={`card-sponsorship-${sponsorship.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {sponsorship.donor.firstName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {sponsorship.donor.firstName} {sponsorship.donor.lastName || ""}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {sponsorship.donor.donorCode}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(sponsorship.status)} data-testid={`badge-status-${sponsorship.id}`}>
                          {sponsorship.status || "ACTIVE"}
                        </Badge>
                        <Badge variant="outline">{sponsorship.sponsorshipType}</Badge>
                        <Badge variant="outline">{sponsorship.frequency}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      {sponsorship.amount ? (
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="font-semibold text-lg" data-testid={`text-amount-${sponsorship.id}`}>
                            {formatAmount(sponsorship.amount, sponsorship.currency)}
                            <span className="text-xs font-normal text-muted-foreground ml-1">/{sponsorship.frequency?.toLowerCase()}</span>
                          </p>
                        </div>
                      ) : sponsorship.inKindItem ? (
                        <div>
                          <p className="text-xs text-muted-foreground">In-Kind</p>
                          <p className="font-medium" data-testid={`text-inkind-${sponsorship.id}`}>{sponsorship.inKindItem}</p>
                        </div>
                      ) : (
                        <div />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="text-sm" data-testid={`text-start-date-${sponsorship.id}`}>
                          {sponsorship.startDate ? format(new Date(sponsorship.startDate), "dd MMM yyyy") : format(new Date(sponsorship.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="text-sm" data-testid={`text-end-date-${sponsorship.id}`}>
                          {sponsorship.endDate ? format(new Date(sponsorship.endDate), "dd MMM yyyy") : "Ongoing"}
                        </p>
                      </div>
                    </div>

                    {sponsorship.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{sponsorship.notes}</p>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStatusChange(sponsorship)}
                          data-testid={`button-change-status-${sponsorship.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Change Status
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewHistory(sponsorship)}
                          data-testid={`button-view-history-${sponsorship.id}`}
                        >
                          <History className="h-4 w-4 mr-1" />
                          History
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/donors/${sponsorship.donorId}`)}
                        data-testid={`button-view-donor-${sponsorship.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Donor Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyMessage(sponsorship)}
                        data-testid={`button-copy-message-${sponsorship.id}`}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Message
                      </Button>
                      {sponsorship.donor.primaryPhone && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          data-testid={`button-whatsapp-${sponsorship.id}`}
                        >
                          <a
                            href={`https://wa.me/${sponsorship.donor.primaryPhone.replace(/\D/g, "")}?text=${generateWhatsAppMessage(sponsorship)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <SiWhatsapp className="h-4 w-4 mr-1" />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSponsorship(sponsorship.id)}
                          className="ml-auto text-destructive"
                          data-testid={`button-delete-sponsorship-${sponsorship.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Updates ({beneficiary.updates.length})</h3>
            <Button onClick={() => setShowAddUpdateDialog(true)} data-testid="button-add-update">
              <Plus className="h-4 w-4 mr-2" />
              Add Update
            </Button>
          </div>

          {beneficiary.updates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No updates yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {beneficiary.updates.map((update: any) => (
                <Card key={update.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{update.title}</CardTitle>
                          {update.isPrivate && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {update.updateType && update.updateType !== "GENERAL" && (
                            <Badge variant="outline" className="text-xs">
                              {update.updateType.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          <CardDescription>
                            By {update.createdBy?.name || 'Unknown'} on {format(new Date(update.createdAt), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                      </div>
                      {beneficiary.sponsorships.length > 0 && !update.isPrivate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenSendToSponsors(update.id)}
                          data-testid={`button-send-update-${update.id}`}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send to Sponsors
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                    {update.attachments && update.attachments.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Attachments ({update.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {update.attachments.map((att: any) => (
                            <Button
                              key={att.id}
                              variant="outline"
                              size="sm"
                              onClick={() => att.document?.storagePath && window.open(att.document.storagePath, '_blank')}
                              data-testid={`attachment-${att.id}`}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {att.document?.title || 'Document'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <h3 className="text-lg font-semibold">Timeline</h3>

          {beneficiary.timelineEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <Clock className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No timeline events yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {beneficiary.timelineEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{event.eventType}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.eventDate), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="mt-1">{event.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Tracking
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowAddMetricDialog(true)} data-testid="button-add-metric">
                <Plus className="h-4 w-4 mr-2" />
                Add Measurement
              </Button>
              <Button variant="outline" onClick={() => setShowAddHealthEventDialog(true)} data-testid="button-add-health-event">
                <Plus className="h-4 w-4 mr-2" />
                Add Health Event
              </Button>
              <Button variant="outline" onClick={handleExportHealthPdf} disabled={exportingPdf} data-testid="button-export-health-pdf">
                {exportingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export PDF
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth Measurements
            </h4>

            {metricsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : metrics.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Ruler className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No measurements recorded yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics
                  .sort((a, b) => new Date(b.recordedOn).getTime() - new Date(a.recordedOn).getTime())
                  .map((metric) => (
                    <Card key={metric.id} data-testid={`card-metric-${metric.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {format(new Date(metric.recordedOn), "MMM d, yyyy")}
                          </span>
                          <Badge className={getHealthStatusBadgeClass(metric.healthStatus || "NORMAL")} data-testid={`badge-health-status-${metric.id}`}>
                            {getHealthStatusLabel(metric.healthStatus || "NORMAL")}
                          </Badge>
                        </div>
                        <div className="flex gap-4">
                          {metric.heightCm != null && (
                            <div className="flex items-center gap-1">
                              <Ruler className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{metric.heightCm} cm</span>
                            </div>
                          )}
                          {metric.weightKg != null && (
                            <div className="flex items-center gap-1">
                              <Scale className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{metric.weightKg} kg</span>
                            </div>
                          )}
                        </div>
                        {metric.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{metric.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>

          {growthChartData.length >= 2 && (
            <Card data-testid="chart-growth">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Growth Chart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="height" orientation="left" label={{ value: 'Height (cm)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                    <YAxis yAxisId="weight" orientation="right" label={{ value: 'Weight (kg)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="height" type="monotone" dataKey="heightCm" stroke="#4f46e5" strokeWidth={2} name="Height (cm)" dot={{ r: 4 }} connectNulls />
                    <Line yAxisId="weight" type="monotone" dataKey="weightKg" stroke="#e11d48" strokeWidth={2} name="Weight (kg)" dot={{ r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h4 className="text-base font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Health Events
            </h4>

            {healthEventsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : healthEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Stethoscope className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No health events recorded</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {healthEvents.map((event) => (
                  <Card key={event.id} data-testid={`card-health-event-${event.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{event.title}</span>
                            <Badge className={getSeverityBadgeClass(event.severity)}>
                              {event.severity}
                            </Badge>
                            {event.shareWithDonor && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Shared with Donors
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.eventDate), "MMM d, yyyy")}
                          </p>
                          <p className="text-sm mt-1">{event.description}</p>
                          {event.document && (
                            <div className="flex items-center gap-1 mt-2">
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{event.document.title}</span>
                            </div>
                          )}
                        </div>
                        {event.shareWithDonor && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleNotifySponsors(event.id)}
                              data-testid={`button-notify-sponsors-${event.id}`}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const text = `Health Update - ${beneficiary!.fullName}\n\n${event.title}\n\n${event.description}\n\nDate: ${format(new Date(event.eventDate), "MMM d, yyyy")}\nSeverity: ${event.severity}\n\nPlease reach out if you have any questions.`;
                                navigator.clipboard.writeText(text);
                                toast({ title: "Copied", description: "WhatsApp message copied to clipboard" });
                              }}
                              data-testid={`button-whatsapp-health-${event.id}`}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Health Timeline
            </h4>

            {healthTimelineLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : healthTimeline.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Clock className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No health records yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-4">
                  {healthTimeline.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="relative pl-10" data-testid={`timeline-item-${item.type.toLowerCase()}-${item.id}`}>
                      <div className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-background ${item.type === 'METRIC' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                      <Card>
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.type === 'METRIC' ? (
                                  <Ruler className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Stethoscope className="h-4 w-4 text-amber-500" />
                                )}
                                <span className="font-medium text-sm">{item.title}</span>
                                {item.type === 'METRIC' && item.healthStatus && (
                                  <Badge className={getHealthStatusBadgeClass(item.healthStatus)}>
                                    {getHealthStatusLabel(item.healthStatus)}
                                  </Badge>
                                )}
                                {item.type === 'EVENT' && item.severity && (
                                  <Badge className={getSeverityBadgeClass(item.severity)}>
                                    {item.severity}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(item.date), "MMM d, yyyy")} · {item.createdBy.name}
                              </p>
                              <p className="text-sm">{item.summary}</p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground italic">{item.notes}</p>
                              )}
                              {item.document && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Paperclip className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">{item.document.title}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="academics" className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Progress Cards
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleExportEducationPdf}
                disabled={educationExporting}
                data-testid="button-export-education-pdf"
              >
                {educationExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
              <Button onClick={() => setShowAddProgressCardDialog(true)} data-testid="button-add-progress-card">
                <Plus className="h-4 w-4 mr-2" />
                Add Progress Card
              </Button>
            </div>
          </div>

          {progressCardsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : progressCards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <GraduationCap className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No progress cards yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressCards.map((card) => (
                <Card key={card.id} data-testid={`card-progress-${card.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{card.academicYear}</CardTitle>
                      <Badge variant="outline">{getTermLabel(card.term)}</Badge>
                    </div>
                    <CardDescription>
                      {card.classGrade}{card.school ? ` - ${card.school}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {card.overallPercentage != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Overall:</span>
                        <span className="font-semibold text-lg">{card.overallPercentage}%</span>
                      </div>
                    )}
                    {card.remarks && (
                      <p className="text-sm text-muted-foreground">{card.remarks}</p>
                    )}
                    {card.fileDocument && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(card.fileDocument!.storagePath, '_blank')}
                        data-testid={`button-download-report-${card.id}`}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        View Report Card
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Added by {card.createdBy?.name || "Unknown"} on {format(new Date(card.createdAt), "MMM d, yyyy")}
                    </p>
                    {beneficiary.sponsorships.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShareProgressCard(card)}
                        data-testid={`button-share-progress-${card.id}`}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Share with Sponsors
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Education Timeline
            </h3>
            {educationTimelineLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : educationTimeline.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-40">
                  <Book className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground">No education timeline events yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                {educationTimeline.map((item) => (
                  <div key={item.id} className="relative pl-10 pb-6" data-testid={`education-timeline-${item.id}`}>
                    <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                      item.type === 'PROGRESS_CARD'
                        ? 'bg-primary border-primary'
                        : 'bg-muted border-muted-foreground'
                    }`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{item.title}</span>
                        <Badge variant={item.type === 'PROGRESS_CARD' ? 'default' : 'secondary'} className="text-xs">
                          {item.type === 'PROGRESS_CARD' ? 'Report Card' : 'Event'}
                        </Badge>
                        {item.overallPercentage != null && (
                          <Badge variant="outline" className="text-xs">{item.overallPercentage}%</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.summary}</p>
                      {item.classGrade && (
                        <p className="text-xs text-muted-foreground">
                          {item.classGrade}{item.school ? ` - ${item.school}` : ""}
                        </p>
                      )}
                      {item.fileDocument && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.fileDocument!.storagePath, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          View Document
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.date), "MMM d, yyyy")} by {item.createdBy?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </h3>
            <Button onClick={() => setShowUploadDocumentDialog(true)} data-testid="button-upload-document">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>

          {documentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <FileText className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {doc.isSensitive ? (
                          <Lock className="h-5 w-5 text-destructive flex-shrink-0" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <Badge variant="outline" className="text-xs">{doc.docType.replace(/_/g, " ")}</Badge>
                            <span className="text-xs text-muted-foreground">{formatFileSize(doc.sizeBytes)}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(doc.createdAt), "MMM d, yyyy")}
                            </span>
                            {doc.isSensitive && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Sensitive
                              </Badge>
                            )}
                          </div>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(doc.id, doc.storagePath)}
                        data-testid={`button-view-document-${doc.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showAddSponsorDialog} onOpenChange={setShowAddSponsorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Link Sponsor
            </DialogTitle>
            <DialogDescription>
              Connect a donor as a sponsor for {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Donor *</Label>
              {selectedDonor ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium">{selectedDonor.firstName} {selectedDonor.lastName || ""}</p>
                    <p className="text-xs text-muted-foreground">{selectedDonor.donorCode}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedDonor(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Search by name, code, or phone..."
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    data-testid="input-search-donor"
                  />
                  {donorSearchLoading && <p className="text-sm text-muted-foreground">Searching...</p>}
                  {donorSearchResults.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {donorSearchResults.map((donor) => (
                        <button
                          key={donor.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                          onClick={() => {
                            setSelectedDonor(donor);
                            setDonorSearch("");
                            setDonorSearchResults([]);
                          }}
                        >
                          <span>{donor.firstName} {donor.lastName || ""}</span>
                          <span className="text-xs text-muted-foreground">{donor.donorCode}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newSponsorship.sponsorshipType}
                  onValueChange={(v) => setNewSponsorship(prev => ({ ...prev, sponsorshipType: v }))}
                >
                  <SelectTrigger data-testid="select-sponsorship-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPONSORSHIP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={newSponsorship.frequency}
                  onValueChange={(v) => setNewSponsorship(prev => ({ ...prev, frequency: v }))}
                >
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (optional)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newSponsorship.amount}
                  onChange={(e) => setNewSponsorship(prev => ({ ...prev, amount: e.target.value }))}
                  data-testid="input-amount"
                />
              </div>

              <div className="space-y-2">
                <Label>In-Kind Item (optional)</Label>
                <Input
                  placeholder='e.g. "Rice bag"'
                  value={newSponsorship.inKindItem}
                  onChange={(e) => setNewSponsorship(prev => ({ ...prev, inKindItem: e.target.value }))}
                  data-testid="input-inkind"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newSponsorship.startDate}
                onChange={(e) => setNewSponsorship(prev => ({ ...prev, startDate: e.target.value }))}
                data-testid="input-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newSponsorship.notes}
                onChange={(e) => setNewSponsorship(prev => ({ ...prev, notes: e.target.value }))}
                data-testid="textarea-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSponsorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSponsor} disabled={addSponsorLoading || !selectedDonor} data-testid="button-submit-sponsor">
              {addSponsorLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Sponsor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddUpdateDialog} onOpenChange={setShowAddUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Update
            </DialogTitle>
            <DialogDescription>
              Share an update about {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Enter update title"
                value={newUpdate.title}
                onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-update-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Update Type</Label>
              <Select
                value={newUpdate.updateType}
                onValueChange={(value) => setNewUpdate(prev => ({ ...prev, updateType: value }))}
              >
                <SelectTrigger data-testid="select-update-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General Update</SelectItem>
                  <SelectItem value="MILESTONE">Milestone</SelectItem>
                  <SelectItem value="ACADEMIC">Academic Progress</SelectItem>
                  <SelectItem value="EDUCATION">Education</SelectItem>
                  <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                  <SelectItem value="HEALTH">Health Update</SelectItem>
                  <SelectItem value="PHOTO">Photo Update</SelectItem>
                  <SelectItem value="EVENT">Event / Activity</SelectItem>
                  <SelectItem value="THANK_YOU">Thank You Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                placeholder="Write update content..."
                value={newUpdate.content}
                onChange={(e) => setNewUpdate(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                data-testid="textarea-update-content"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-private"
                checked={newUpdate.isPrivate}
                onCheckedChange={(checked) => setNewUpdate(prev => ({ ...prev, isPrivate: checked }))}
              />
              <Label htmlFor="is-private" className="text-sm">
                Private update (only visible to staff)
              </Label>
            </div>

            {beneficiary.documents && beneficiary.documents.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  Attach Documents
                </Label>
                <p className="text-xs text-muted-foreground">Select documents from the vault to attach to this update</p>
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                  {beneficiary.documents.filter((doc: any) => !doc.isSensitive).map((doc: any) => (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm hover-elevate ${
                        selectedAttachmentIds.includes(doc.id) ? "bg-primary/10" : ""
                      }`}
                      onClick={() => {
                        setSelectedAttachmentIds(prev =>
                          prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                        );
                      }}
                      data-testid={`attachment-option-${doc.id}`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        selectedAttachmentIds.includes(doc.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                      }`}>
                        {selectedAttachmentIds.includes(doc.id) && <Check className="h-3 w-3" />}
                      </div>
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{doc.title}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {doc.docType?.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
                {selectedAttachmentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedAttachmentIds.length} document{selectedAttachmentIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddUpdateDialog(false);
              setSelectedAttachmentIds([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddUpdate} disabled={addUpdateLoading} data-testid="button-submit-update">
              {addUpdateLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendToSponsorsDialog} onOpenChange={setShowSendToSponsorsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Update to Sponsors
            </DialogTitle>
            <DialogDescription>
              Share this update with the beneficiary's sponsors
            </DialogDescription>
          </DialogHeader>

          {loadingSponsorData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sponsorDispatchData ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Update</Label>
                <p className="text-sm font-medium">{sponsorDispatchData.update?.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{sponsorDispatchData.update?.content}</p>
              </div>

              <div className="space-y-2">
                <Label>Sponsors ({sponsorDispatchData.sponsors?.length || 0})</Label>
                {sponsorDispatchData.sponsors?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sponsors linked to this beneficiary</p>
                ) : (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {sponsorDispatchData.sponsors?.map((sponsor: any) => (
                      <div key={sponsor.donorId} className="text-sm flex justify-between items-center">
                        <span>{sponsor.donorName}</span>
                        <div className="flex gap-1">
                          {sponsor.personalEmail && <Badge variant="outline" className="text-xs">Email</Badge>}
                          {sponsor.primaryPhone && <Badge variant="outline" className="text-xs">Phone</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {sponsorDispatchData.sponsors?.length > 0 && (
                <div className="space-y-2">
                  <Label>Send via</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSendToSponsors("EMAIL")}
                      disabled={sendingToSponsors}
                      className="flex-1"
                    >
                      {sendingToSponsors ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSendToSponsors("WHATSAPP")}
                      disabled={sendingToSponsors}
                      className="flex-1"
                    >
                      {sendingToSponsors ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiWhatsapp className="h-4 w-4 mr-2" />}
                      WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load sponsor information
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendToSponsorsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMetricDialog} onOpenChange={setShowAddMetricDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Add Measurement
            </DialogTitle>
            <DialogDescription>
              Record height and weight measurements for {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={newMetric.recordedOn}
                onChange={(e) => setNewMetric(prev => ({ ...prev, recordedOn: e.target.value }))}
                data-testid="input-metric-date"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  value={newMetric.heightCm}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, heightCm: e.target.value }))}
                  data-testid="input-metric-height"
                />
              </div>

              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  value={newMetric.weightKg}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, weightKg: e.target.value }))}
                  data-testid="input-metric-weight"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select
                value={newMetric.healthStatus || "NORMAL"}
                onValueChange={(value) => setNewMetric(prev => ({ ...prev, healthStatus: value }))}
              >
                <SelectTrigger data-testid="select-metric-health-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="SICK">Sick</SelectItem>
                  <SelectItem value="HOSPITALIZED">Hospitalized</SelectItem>
                  <SelectItem value="UNDER_TREATMENT">Under Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any observations..."
                value={newMetric.notes}
                onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                data-testid="textarea-metric-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMetricDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMetric} disabled={addMetricLoading} data-testid="button-submit-metric">
              {addMetricLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Measurement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddHealthEventDialog} onOpenChange={setShowAddHealthEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Add Health Event
            </DialogTitle>
            <DialogDescription>
              Record a health event for {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={newHealthEvent.eventDate}
                onChange={(e) => setNewHealthEvent(prev => ({ ...prev, eventDate: e.target.value }))}
                data-testid="input-health-event-date"
              />
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. Fever and Cold"
                value={newHealthEvent.title}
                onChange={(e) => setNewHealthEvent(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-health-event-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the health event..."
                value={newHealthEvent.description}
                onChange={(e) => setNewHealthEvent(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                data-testid="textarea-health-event-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={newHealthEvent.severity}
                onValueChange={(v) => setNewHealthEvent(prev => ({ ...prev, severity: v }))}
              >
                <SelectTrigger data-testid="select-health-event-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="requires-donor-update"
                checked={newHealthEvent.requiresDonorUpdate}
                onCheckedChange={(checked) => setNewHealthEvent(prev => ({ ...prev, requiresDonorUpdate: checked }))}
              />
              <Label htmlFor="requires-donor-update" className="text-sm">
                Requires donor update
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="share-with-donor"
                checked={newHealthEvent.shareWithDonor}
                onCheckedChange={(checked) => setNewHealthEvent(prev => ({ ...prev, shareWithDonor: checked }))}
              />
              <Label htmlFor="share-with-donor" className="text-sm">
                Share with donors
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Attach Document (optional)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setHealthEventFile(e.target.files?.[0] || null)}
                data-testid="input-health-event-file"
              />
              <p className="text-xs text-muted-foreground">Upload a prescription or medical report (PDF, JPG, PNG)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHealthEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHealthEvent} disabled={addHealthEventLoading} data-testid="button-submit-health-event">
              {addHealthEventLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Health Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddProgressCardDialog} onOpenChange={setShowAddProgressCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Add Progress Card
            </DialogTitle>
            <DialogDescription>
              Record academic progress for {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Academic Year *</Label>
                <Input
                  placeholder="e.g. 2025-2026"
                  value={newProgressCard.academicYear}
                  onChange={(e) => setNewProgressCard(prev => ({ ...prev, academicYear: e.target.value }))}
                  data-testid="input-academic-year"
                />
              </div>

              <div className="space-y-2">
                <Label>Term *</Label>
                <Select
                  value={newProgressCard.term}
                  onValueChange={(v) => setNewProgressCard(prev => ({ ...prev, term: v }))}
                >
                  <SelectTrigger data-testid="select-term">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TERM_1">Term 1</SelectItem>
                    <SelectItem value="TERM_2">Term 2</SelectItem>
                    <SelectItem value="TERM_3">Term 3</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class / Grade *</Label>
                <Input
                  placeholder="e.g. 8th Standard"
                  value={newProgressCard.classGrade}
                  onChange={(e) => setNewProgressCard(prev => ({ ...prev, classGrade: e.target.value }))}
                  data-testid="input-class-grade"
                />
              </div>

              <div className="space-y-2">
                <Label>School</Label>
                <Input
                  placeholder="School name"
                  value={newProgressCard.school}
                  onChange={(e) => setNewProgressCard(prev => ({ ...prev, school: e.target.value }))}
                  data-testid="input-school"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Overall Percentage</Label>
              <Input
                type="number"
                placeholder="e.g. 85"
                value={newProgressCard.overallPercentage}
                onChange={(e) => setNewProgressCard(prev => ({ ...prev, overallPercentage: e.target.value }))}
                data-testid="input-overall-percentage"
              />
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                placeholder="Teacher remarks or notes..."
                value={newProgressCard.remarks}
                onChange={(e) => setNewProgressCard(prev => ({ ...prev, remarks: e.target.value }))}
                data-testid="textarea-remarks"
              />
            </div>

            <div className="space-y-2">
              <Label>Report Card File (optional)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setProgressCardFile(e.target.files?.[0] || null)}
                data-testid="input-progress-card-file"
              />
              {progressCardFile && (
                <p className="text-xs text-muted-foreground">
                  {progressCardFile.name} ({(progressCardFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddProgressCardDialog(false); setProgressCardFile(null); }}>
              Cancel
            </Button>
            <Button onClick={handleAddProgressCard} disabled={addProgressCardLoading} data-testid="button-submit-progress-card">
              {addProgressCardLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Progress Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadDocumentDialog} onOpenChange={setShowUploadDocumentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Upload a document for {beneficiary.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File *</Label>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setDocumentFile(file);
                  if (file && !newDocument.title) {
                    setNewDocument(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
                  }
                }}
                data-testid="input-document-file"
              />
              {documentFile && (
                <p className="text-xs text-muted-foreground">
                  {documentFile.name} ({formatFileSize(documentFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Document title"
                value={newDocument.title}
                onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-document-title"
              />
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                value={newDocument.docType}
                onValueChange={(v) => setNewDocument(prev => ({ ...prev, docType: v }))}
              >
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHOTO">Photo</SelectItem>
                  <SelectItem value="REPORT_CARD">Report Card</SelectItem>
                  <SelectItem value="MEDICAL_REPORT">Medical Report</SelectItem>
                  <SelectItem value="AADHAAR">Aadhaar</SelectItem>
                  <SelectItem value="GOVT_ID">Government ID</SelectItem>
                  <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                  <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Brief description of the document..."
                value={newDocument.description}
                onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                data-testid="textarea-document-description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="doc-sensitive"
                checked={newDocument.isSensitive}
                onCheckedChange={(checked) => setNewDocument(prev => ({
                  ...prev,
                  isSensitive: checked,
                  shareWithDonor: checked ? false : prev.shareWithDonor,
                }))}
              />
              <Label htmlFor="doc-sensitive" className="text-sm">
                Sensitive document (Admin only access)
              </Label>
            </div>

            {!newDocument.isSensitive && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="doc-share-donor"
                  checked={newDocument.shareWithDonor}
                  onCheckedChange={(checked) => setNewDocument(prev => ({ ...prev, shareWithDonor: checked }))}
                />
                <Label htmlFor="doc-share-donor" className="text-sm">
                  Share with donors
                </Label>
              </div>
            )}

            {newDocument.isSensitive && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Sensitive documents can only be viewed by administrators</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadDocumentDialog(false);
              setDocumentFile(null);
              setNewDocument({ title: "", docType: "OTHER", description: "", isSensitive: false, shareWithDonor: false });
            }}>
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={uploadDocumentLoading || !documentFile} data-testid="button-submit-document">
              {uploadDocumentLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLinkPhotoDialog} onOpenChange={(open) => { setShowLinkPhotoDialog(open); if (!open) setLinkPhotoUrl(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Link Existing Photo
            </DialogTitle>
            <DialogDescription>
              Paste a Supabase Storage URL or any public image URL to link it to this beneficiary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Photo URL *</Label>
              <Input
                placeholder="https://..."
                value={linkPhotoUrl}
                onChange={(e) => setLinkPhotoUrl(e.target.value)}
                data-testid="input-link-photo-url"
              />
            </div>
            {linkPhotoUrl && (
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={linkPhotoUrl} alt="Preview" />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowLinkPhotoDialog(false); setLinkPhotoUrl(""); }} data-testid="button-cancel-link-photo">
              Cancel
            </Button>
            <Button onClick={handleLinkPhoto} disabled={!linkPhotoUrl.trim() || photoUploading} data-testid="button-submit-link-photo">
              {photoUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Sponsorship Status</DialogTitle>
            <DialogDescription>
              {statusChangeSponsorship && (
                <>Update sponsorship status for {statusChangeSponsorship.donor.firstName} {statusChangeSponsorship.donor.lastName || ""}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={statusChangeData.status} onValueChange={(v) => setStatusChangeData((prev) => ({ ...prev, status: v }))}>
                <SelectTrigger data-testid="select-new-status">
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
                value={statusChangeData.note}
                onChange={(e) => setStatusChangeData((prev) => ({ ...prev, note: e.target.value }))}
                data-testid="input-status-change-note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChangeDialog(false)} data-testid="button-cancel-status-change">
              Cancel
            </Button>
            <Button onClick={handleStatusChange} disabled={statusChangeLoading || !statusChangeData.status} data-testid="button-confirm-status-change">
              {statusChangeLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Sponsorship History
            </DialogTitle>
            <DialogDescription>
              {historySponsorship && (
                <>Change history for {historySponsorship.donor.firstName} {historySponsorship.donor.lastName || ""}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : historyEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No changes recorded yet</p>
            ) : (
              <div className="space-y-3">
                {historyEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-md p-3 space-y-1" data-testid={`history-entry-${entry.id}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(entry.oldStatus)} className="text-xs">
                          {entry.oldStatus}
                        </Badge>
                        <span className="text-muted-foreground text-xs">&rarr;</span>
                        <Badge variant={getStatusBadgeVariant(entry.newStatus)} className="text-xs">
                          {entry.newStatus}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.changedAt), "dd MMM yyyy, HH:mm")}
                      </span>
                    </div>
                    {entry.oldAmount !== entry.newAmount && entry.newAmount !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Amount: {formatAmount(entry.oldAmount || 0, "INR")} &rarr; {formatAmount(entry.newAmount, "INR")}
                      </p>
                    )}
                    {entry.note && <p className="text-sm">{entry.note}</p>}
                    {entry.changedBy && (
                      <p className="text-xs text-muted-foreground">By: {entry.changedBy.name}</p>
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
