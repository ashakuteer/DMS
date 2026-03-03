"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  Eye,
  Loader2,
  IndianRupee,
  Calendar,
  User,
  RefreshCw,
  Package,
  Receipt,
  Home,
  Download,
  FileSpreadsheet,
  Mail,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  FileText,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SiWhatsapp } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission, canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { format } from "date-fns";

interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
  personalEmail?: string;
  officialEmail?: string;
  whatsappPhone?: string;
  city?: string;
  state?: string;
}

interface Donation {
  id: string;
  donorId: string;
  donationDate: string;
  donationAmount: string;
  currency: string;
  donationType: string;
  donationMode: string | null;
  donationPurpose?: string;
  transactionId?: string;
  remarks?: string;
  quantity?: string;
  unit?: string;
  itemDescription?: string;
  donationHomeType?: string;
  receiptNumber?: string;
  financialYear?: string;
  donor: Donor;
  createdBy?: { id: string; name: string };
  home?: { id: string; name: string };
  campaign?: { id: string; name: string };
}

interface DonationsResponse {
  items: Donation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DonorSearchResult {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
  personalEmail?: string;
}

const DONATION_TYPES = [
  { value: "all", label: "All Types" },
  { value: "CASH", label: "Cash" },
  { value: "ANNADANAM", label: "Annadanam" },
  { value: "GROCERIES", label: "Groceries" },
  { value: "MEDICINES", label: "Medicines" },
  { value: "RICE_BAGS", label: "Rice Bags" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "SPORTS_KITS", label: "Sports Kits" },
  { value: "USED_ITEMS", label: "Used Items" },
  { value: "OTHER", label: "Other" },
];

const DONATION_MODES = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "GPAY", label: "GPay" },
  { value: "PHONEPE", label: "PhonePe" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE", label: "Online" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "IN_KIND", label: "In-Kind" },
];

const DONATION_HOME_TYPES = [
  { value: "all", label: "All Homes" },
  { value: "GIRLS_HOME", label: "Girls Home" },
  { value: "BLIND_BOYS_HOME", label: "Blind Boys Home" },
  { value: "OLD_AGE_HOME", label: "Old Age Home" },
  { value: "GENERAL", label: "General" },
];

const DONATION_PURPOSES = [
  { value: "GENERAL_SUPPORT", label: "General Support" },
  { value: "FESTIVAL_DONATION", label: "Festival Donation" },
  { value: "SPONSORSHIP", label: "Sponsorship" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "MEMORIAL", label: "Memorial" },
  { value: "CELEBRATION", label: "Celebration" },
];

export default function DonationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [searchQuery, setSearchQuery] = useState("");
  const [donationType, setDonationType] = useState("all");
  const [donationHomeType, setDonationHomeType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [donorSearchQuery, setDonorSearchQuery] = useState("");
  const [donorSearchResults, setDonorSearchResults] = useState<DonorSearchResult[]>([]);
  const [donorSearchLoading, setDonorSearchLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<DonorSearchResult | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const [newDonation, setNewDonation] = useState({
    donationAmount: "",
    donationDate: format(new Date(), "yyyy-MM-dd"),
    donationType: "CASH",
    donationMode: "CASH",
    donationPurpose: "",
    transactionId: "",
    remarks: "",
    quantity: "",
    unit: "",
    itemDescription: "",
    donationHomeType: "",
    kindCategory: "",
    kindDescription: "",
  });

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    donorName: string;
    amount: string;
    currency: string;
    receiptNumber?: string;
    communicationResults: {
      emailStatus?: string;
      whatsAppStatus?: string;
      whatsAppMessageId?: string;
    };
  } | null>(null);

  interface HomeStats {
    homeType: string;
    label: string;
    cashTotal: number;
    inKindCount: number;
    totalCount: number;
  }

  interface DonationStats {
    byHome: HomeStats[];
    totals: {
      cashTotal: number;
      inKindCount: number;
      totalDonations: number;
    };
  }

  const [stats, setStats] = useState<DonationStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/donations/stats/by-home');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch donation stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (searchQuery) params.append("search", searchQuery);
      if (donationType && donationType !== "all") params.append("donationType", donationType);
      if (donationHomeType && donationHomeType !== "all") params.append("donationHomeType", donationHomeType);

      const response = await fetchWithAuth(`/api/donations?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch donations");
      }

      const data: DonationsResponse = await response.json();
      
      setDonations(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch donations:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch donations";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate, searchQuery, donationType, donationHomeType, toast]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const isCompletePhoneNumber = (query: string): boolean => {
    const cleaned = query.replace(/[\s\-\(\)\+\.]/g, '');
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length < 10) return false;
    if (digitsOnly.length === 10) return true;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return true;
    if (digitsOnly.length > 10 && digitsOnly.startsWith('91')) return true;
    return false;
  };

  const lookupDonorByPhone = useCallback(async (phone: string) => {
    setDonorSearchLoading(true);
    try {
      const response = await fetchWithAuth(`/api/donors/lookup?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.found && data.donor) {
          setSelectedDonor(data.donor);
          setDonorSearchQuery("");
          setDonorSearchResults([]);
          toast({
            title: "Donor Found",
            description: `${data.donor.firstName} ${data.donor.lastName || ''} (${data.donor.donorCode})`,
          });
        } else {
          toast({
            title: "Not Found",
            description: "No donor found with this phone number",
            variant: "destructive",
          });
          setDonorSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Failed to lookup donor:", error);
      toast({
        title: "Error",
        description: "Failed to lookup donor by phone",
        variant: "destructive",
      });
    } finally {
      setDonorSearchLoading(false);
    }
  }, [toast]);

  const handlePhoneLookup = () => {
    if (donorSearchQuery && isCompletePhoneNumber(donorSearchQuery)) {
      lookupDonorByPhone(donorSearchQuery);
    } else if (donorSearchQuery.length >= 10) {
      lookupDonorByPhone(donorSearchQuery);
    } else {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
    }
  };

  const handleDonorSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && donorSearchQuery) {
      e.preventDefault();
      if (isCompletePhoneNumber(donorSearchQuery)) {
        lookupDonorByPhone(donorSearchQuery);
      }
    }
  };

  const searchDonors = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDonorSearchResults([]);
      return;
    }

    if (isCompletePhoneNumber(query)) {
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
    const debounce = setTimeout(() => {
      if (!isCompletePhoneNumber(donorSearchQuery)) {
        searchDonors(donorSearchQuery);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [donorSearchQuery, searchDonors]);

  const isInKindDonation = newDonation.donationType !== "CASH";

  const handleDonationTypeChange = (newType: string) => {
    if (newType !== "CASH") {
      setNewDonation(prev => ({
        ...prev,
        donationType: newType,
        donationMode: "IN_KIND",
      }));
    } else {
      setNewDonation(prev => ({
        ...prev,
        donationType: newType,
        donationMode: prev.donationMode === "IN_KIND" ? "CASH" : prev.donationMode,
      }));
    }
  };

  const validateDonationForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!selectedDonor) {
      errors.donor = "Please select a donor before recording a donation";
    }

    if (!newDonation.donationDate) {
      errors.date = "Donation date is required";
    }

    if (!isInKindDonation) {
      if (!newDonation.donationAmount || parseFloat(newDonation.donationAmount) <= 0) {
        errors.amount = "Amount is required for cash donations";
      }
    } else {
      const hasQuantity = newDonation.quantity && parseFloat(newDonation.quantity) > 0;
      const hasEstValue = newDonation.donationAmount && parseFloat(newDonation.donationAmount) > 0;
      if (!hasQuantity && !hasEstValue) {
        errors.inKindValue = "Either quantity or estimated value is required for in-kind donations";
      }
    }

    return errors;
  };

  const handlePreviewReceipt = () => {
    const errors = validateDonationForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setShowPreview(true);
  };

  const handleAddDonation = async () => {
    const errors = validateDonationForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setShowPreview(false);
      return;
    }

    setAddLoading(true);
    try {
      const payload: Record<string, any> = {
        donorId: selectedDonor!.id,
        donationDate: newDonation.donationDate,
        donationType: newDonation.donationType,
        donationPurpose: newDonation.donationPurpose || null,
        remarks: newDonation.remarks || null,
        donationHomeType: newDonation.donationHomeType || null,
      };

      if (isInKindDonation) {
        payload.quantity = newDonation.quantity ? parseFloat(newDonation.quantity) : null;
        payload.unit = newDonation.unit || null;
        payload.itemDescription = newDonation.itemDescription || null;
        payload.donationAmount = newDonation.donationAmount ? parseFloat(newDonation.donationAmount) : 0;
        payload.donationMode = "IN_KIND";
        payload.kindCategory = newDonation.kindCategory || null;
        payload.kindDescription = newDonation.kindDescription || null;
      } else {
        payload.donationAmount = parseFloat(newDonation.donationAmount);
        payload.donationMode = newDonation.donationMode;
        payload.transactionId = newDonation.transactionId || null;
      }

      const response = await fetchWithAuth("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create donation");
      }

      const result = await response.json();

      setSuccessResult({
        donorName: selectedDonor ? `${selectedDonor.firstName} ${selectedDonor.lastName || ""}`.trim() : "Donor",
        amount: newDonation.donationAmount,
        currency: result.currency || "INR",
        receiptNumber: result.receiptNumber,
        communicationResults: result.communicationResults || {},
      });

      setShowAddDialog(false);
      setShowPreview(false);
      setShowSuccessDialog(true);
      resetAddForm();
      fetchDonations();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record donation",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const resetAddForm = () => {
    setSelectedDonor(null);
    setDonorSearchQuery("");
    setDonorSearchResults([]);
    setFormErrors({});
    setShowPreview(false);
    setNewDonation({
      donationAmount: "",
      donationDate: format(new Date(), "yyyy-MM-dd"),
      donationType: "CASH",
      donationMode: "CASH",
      donationPurpose: "",
      transactionId: "",
      remarks: "",
      quantity: "",
      unit: "",
      itemDescription: "",
      donationHomeType: "",
      kindCategory: "",
      kindDescription: "",
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDonationType("all");
    setDonationHomeType("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const hasFilters = searchQuery || donationType !== "all" || donationHomeType !== "all" || startDate || endDate;

  const [exportLoading, setExportLoading] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailDonation, setDetailDonation] = useState<Donation | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [thankYouLoading, setThankYouLoading] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);
  
  const [user, setUser] = useState<{ role: string } | null>(null);
  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const canCreateDonation = hasPermission(user?.role, 'donations', 'create');
  const canEditDonation = hasPermission(user?.role, 'donations', 'edit');
  const canDeleteDonation = hasPermission(user?.role, 'donations', 'delete');
  const canExportDonation = hasPermission(user?.role, 'donations', 'export');

  const openDetailsModal = async (donationId: string) => {
    setShowDetailsModal(true);
    setDetailLoading(true);
    setWhatsappCopied(false);
    try {
      const response = await fetchWithAuth(`/api/donations/${donationId}`);
      if (!response.ok) throw new Error("Failed to fetch donation details");
      const data = await response.json();
      setDetailDonation(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load donation details",
        variant: "destructive",
      });
      setShowDetailsModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const buildThankYouMessage = (donation: Donation) => {
    const donorName = getDonorName(donation.donor);
    const amount = donation.donationType === "CASH"
      ? formatAmount(donation.donationAmount, donation.currency)
      : donation.quantity && donation.unit
        ? `${donation.quantity} ${donation.unit} of ${donation.donationType.replace(/_/g, " ").toLowerCase()}`
        : donation.donationType.replace(/_/g, " ").toLowerCase();
    const date = format(new Date(donation.donationDate), "dd MMM yyyy");
    const home = donation.donationHomeType
      ? DONATION_HOME_TYPES.find(h => h.value === donation.donationHomeType)?.label || ""
      : "";

    return `Dear ${donorName},\n\nThank you for your generous donation of ${amount} received on ${date}.${home ? ` Your contribution to ${home} is deeply appreciated.` : ""}\n\nYour support helps us continue our mission to serve those in need.${donation.receiptNumber ? ` Receipt #${donation.receiptNumber} has been generated.` : ""}\n\nWith heartfelt gratitude,\nAsha Kuteer Foundation`;
  };

  const handleSendThankYouEmail = async () => {
    if (!detailDonation) return;
    const email = detailDonation.donor.personalEmail || detailDonation.donor.officialEmail;
    if (!email) {
      toast({
        title: "No Email Address",
        description: "This donor doesn't have an email address on file",
        variant: "destructive",
      });
      return;
    }

    setThankYouLoading(true);
    try {
      const donorName = getDonorName(detailDonation.donor);
      const amount = detailDonation.donationType === "CASH"
        ? formatAmount(detailDonation.donationAmount, detailDonation.currency)
        : `${detailDonation.donationType.replace(/_/g, " ")}`;
      const date = format(new Date(detailDonation.donationDate), "dd MMM yyyy");

      const response = await fetchWithAuth("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId: detailDonation.donor.id,
          donationId: detailDonation.id,
          toEmail: email,
          subject: `Thank You for Your Donation${detailDonation.receiptNumber ? ` - Receipt #${detailDonation.receiptNumber}` : ""}`,
          body: `<p>Dear ${donorName},</p><p>We are deeply grateful for your generous donation of <strong>${amount}</strong> received on ${date}.</p><p>Your contribution helps us continue our mission to serve those in need.${detailDonation.receiptNumber ? ` Receipt #${detailDonation.receiptNumber} has been generated and is attached.` : ""}</p><p>With heartfelt gratitude,</p>`,
          attachReceipt: !!detailDonation.receiptNumber,
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      toast({
        title: "Email Sent",
        description: `Thank you email sent to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send thank you email",
        variant: "destructive",
      });
    } finally {
      setThankYouLoading(false);
    }
  };

  const handleWhatsAppThankYou = async () => {
    if (!detailDonation) return;
    const phone = detailDonation.donor.whatsappPhone || detailDonation.donor.primaryPhone;
    if (!phone) {
      const message = buildThankYouMessage(detailDonation);
      navigator.clipboard.writeText(message);
      setWhatsappCopied(true);
      setTimeout(() => setWhatsappCopied(false), 3000);
      toast({
        title: "Message Copied",
        description: "No phone number found. Thank you message copied to clipboard.",
      });
      return;
    }

    const message = buildThankYouMessage(detailDonation);
    try {
      const donorId = detailDonation?.donor?.id || detailDonation?.donorId || "";
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
        method: "POST",
        body: JSON.stringify({ donorId, toE164: phone, message, type: "DONATION_THANK_YOU" }),
      });
      if (res.ok) {
        toast({ title: "WhatsApp Sent", description: "Thank you message sent via WhatsApp" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "WhatsApp Failed", description: err.message || "Could not send", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send WhatsApp", variant: "destructive" });
    }
  };

  const handleDownloadReceipt = async (donationId: string) => {
    try {
      const response = await fetchWithAuth(`/api/donations/${donationId}/receipt`);
      if (!response.ok) {
        throw new Error("Failed to download receipt");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt_${donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "Receipt downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt",
        variant: "destructive",
      });
    }
  };

  const handleExportToExcel = async () => {
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (donationType && donationType !== "all") params.append("donationType", donationType);
      if (donationHomeType && donationHomeType !== "all") params.append("donationHomeType", donationHomeType);
      
      const response = await fetchWithAuth(`/api/donations/export/excel?${params}`);
      if (!response.ok) {
        throw new Error("Failed to export donations");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donations_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Success",
        description: "Donations exported to Excel",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export donations",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const formatAmount = (amount: string, currency: string = "INR") => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getDonorName = (donor: Donor) => {
    return [donor.firstName, donor.lastName].filter(Boolean).join(" ");
  };

  const getDonationTypeBadgeColor = (type: string) => {
    switch (type) {
      case "CASH": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "GROCERIES": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "MEDICINES": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "ANNADANAM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "RICE_BAGS": return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      case "STATIONERY": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "SPORTS_KITS": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getHomeBadgeInfo = (homeType?: string) => {
    switch (homeType) {
      case "GIRLS_HOME": 
        return { label: "Girls", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" };
      case "BLIND_BOYS_HOME": 
        return { label: "Blind Boys", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" };
      case "OLD_AGE_HOME": 
        return { label: "Old Age", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" };
      case "GENERAL": 
        return { label: "General", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
      default: 
        return null;
    }
  };

  const getDisplayValue = (donation: Donation) => {
    if (donation.donationType === "CASH") {
      return formatAmount(donation.donationAmount, donation.currency);
    }
    if (donation.quantity && donation.unit) {
      return `${donation.quantity} ${donation.unit}`;
    }
    if (donation.quantity) {
      return donation.quantity;
    }
    return formatAmount(donation.donationAmount, donation.currency);
  };

  if (user && !canAccessModule(user?.role, 'donations')) {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Donations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and manage all donations ({total} total)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline"
            size="sm"
            onClick={fetchDonations}
            data-testid="button-refresh-donations"
          >
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canExportDonation && (
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              disabled={exportLoading}
              data-testid="button-export-excel"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          {canCreateDonation && (
            <Button 
              size="sm"
              onClick={() => setShowAddDialog(true)}
              data-testid="button-add-donation"
            >
              <Plus className="mr-1 h-4 w-4" />
              Record Donation
            </Button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.byHome.map((homeStat) => (
            <Card key={homeStat.homeType} className="hover-elevate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-sm font-medium">
                  {homeStat.label}
                </CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(homeStat.cashTotal)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{homeStat.totalCount} donations</span>
                  {homeStat.inKindCount > 0 && (
                    <>
                      <span>|</span>
                      <Badge variant="secondary" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {homeStat.inKindCount} in-kind
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Donation History</CardTitle>
              <CardDescription>All recorded donations</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search donor..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 w-full sm:w-56 md:w-64"
                  data-testid="input-search-donations"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-accent" : ""}
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="flex items-end gap-4 mt-4 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={donationType} onValueChange={(v) => { setDonationType(v); setPage(1); }}>
                  <SelectTrigger className="w-40" data-testid="select-donation-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DONATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Home</Label>
                <Select value={donationHomeType} onValueChange={(v) => { setDonationHomeType(v); setPage(1); }}>
                  <SelectTrigger className="w-40" data-testid="select-donation-home">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DONATION_HOME_TYPES.map((h) => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">From Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-40"
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-40"
                  data-testid="input-end-date"
                />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {/* Filter bar skeleton */}
              <div className="flex items-end gap-4 flex-wrap">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-40" data-testid="skeleton-filter-type" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-40" data-testid="skeleton-filter-home" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-9 w-40" data-testid="skeleton-filter-date-from" />
                </div>
              </div>

              {/* Table skeleton */}
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">
                        <Skeleton className="h-4 w-12" data-testid="skeleton-table-head-date" />
                      </th>
                      <th className="text-left p-4 hidden sm:table-cell">
                        <Skeleton className="h-4 w-16" data-testid="skeleton-table-head-receipt" />
                      </th>
                      <th className="text-left p-4">
                        <Skeleton className="h-4 w-12" data-testid="skeleton-table-head-donor" />
                      </th>
                      <th className="text-left p-4">
                        <Skeleton className="h-4 w-12" data-testid="skeleton-table-head-type" />
                      </th>
                      <th className="text-left p-4 hidden md:table-cell">
                        <Skeleton className="h-4 w-12" data-testid="skeleton-table-head-home" />
                      </th>
                      <th className="text-right p-4">
                        <Skeleton className="h-4 w-16 ml-auto" data-testid="skeleton-table-head-amount" />
                      </th>
                      <th className="text-right p-4">
                        <Skeleton className="h-4 w-12 ml-auto" data-testid="skeleton-table-head-actions" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b" data-testid={`skeleton-row-${i}`}>
                        <td className="p-4">
                          <Skeleton className="h-8 w-24" />
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          <Skeleton className="h-6 w-20" />
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-6 w-20" />
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <Skeleton className="h-6 w-16" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-6 w-20 ml-auto" />
                        </td>
                        <td className="p-4">
                          <Skeleton className="h-8 w-8 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4" data-testid="error-state-container">
              <AlertTriangle className="h-12 w-12 text-destructive/60" data-testid="icon-error-alert" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-foreground">Something went wrong</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button 
                onClick={fetchDonations}
                variant="default"
                size="sm"
                data-testid="button-retry-fetch"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : donations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3" data-testid="empty-state-container">
              <IndianRupee className="h-12 w-12 opacity-50" data-testid="icon-empty-state" />
              <div className="text-center space-y-1">
                <p className="text-lg font-medium text-foreground">No Donations Found</p>
                <p className="text-sm">
                  {hasFilters ? "Try adjusting your filters to see more donations" : "Record your first donation to track contributions"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="hidden sm:table-cell">Receipt #</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Home</TableHead>
                      <TableHead className="text-right">Amount/Qty</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.map((donation) => (
                      <TableRow key={donation.id} data-testid={`row-donation-${donation.id}`}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(donation.donationDate), "dd MMM yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="font-mono text-xs">
                            {donation.receiptNumber || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{getDonorName(donation.donor)}</span>
                            <span className="text-xs text-muted-foreground">{donation.donor.donorCode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDonationTypeBadgeColor(donation.donationType)}>
                            {donation.donationType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {(() => {
                            const homeInfo = getHomeBadgeInfo(donation.donationHomeType);
                            return homeInfo ? (
                              <Badge variant="outline" className={`${homeInfo.color} flex items-center gap-1`}>
                                <Home className="h-3 w-3" />
                                {homeInfo.label}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="flex items-center justify-end gap-1">
                            {donation.donationType !== "CASH" && donation.quantity && (
                              <Package className="h-3 w-3 text-muted-foreground" />
                            )}
                            {getDisplayValue(donation)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetailsModal(donation.id);
                                  }}
                                  data-testid={`button-view-donation-${donation.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            {donation.receiptNumber && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadReceipt(donation.id);
                                    }}
                                    data-testid={`button-download-receipt-${donation.id}`}
                                  >
                                    <Receipt className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download Receipt</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-sm">
                    {page}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
            <DialogDescription>
              Full details of the recorded donation
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailDonation ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 border">
                <User className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium" data-testid="text-detail-donor-name">{getDonorName(detailDonation.donor)}</p>
                  <p className="text-xs text-muted-foreground">{detailDonation.donor.donorCode} {detailDonation.donor.primaryPhone ? `| ${detailDonation.donor.primaryPhone}` : ""}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/dashboard/donors/${detailDonation.donor.id}`)}
                  data-testid="button-goto-donor-profile"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium" data-testid="text-detail-date">{format(new Date(detailDonation.donationDate), "dd MMM yyyy")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Receipt #</p>
                  <p className="text-sm font-medium font-mono" data-testid="text-detail-receipt">{detailDonation.receiptNumber || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge className={getDonationTypeBadgeColor(detailDonation.donationType)} data-testid="badge-detail-type">
                    {detailDonation.donationType.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Payment Mode</p>
                  <p className="text-sm font-medium" data-testid="text-detail-mode">{detailDonation.donationMode?.replace(/_/g, " ") || "-"}</p>
                </div>
              </div>

              {detailDonation.donationType === "CASH" ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold" data-testid="text-detail-amount">{formatAmount(detailDonation.donationAmount, detailDonation.currency)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {detailDonation.quantity && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="text-sm font-medium" data-testid="text-detail-quantity">{detailDonation.quantity} {detailDonation.unit || ""}</p>
                    </div>
                  )}
                  {detailDonation.itemDescription && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-xs text-muted-foreground">Items</p>
                      <p className="text-sm" data-testid="text-detail-items">{detailDonation.itemDescription}</p>
                    </div>
                  )}
                  {parseFloat(detailDonation.donationAmount) > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Estimated Value</p>
                      <p className="text-sm font-medium">{formatAmount(detailDonation.donationAmount, detailDonation.currency)}</p>
                    </div>
                  )}
                </div>
              )}

              {detailDonation.donationHomeType && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Designated Home</p>
                  {(() => {
                    const homeInfo = getHomeBadgeInfo(detailDonation.donationHomeType);
                    return homeInfo ? (
                      <Badge variant="outline" className={`${homeInfo.color} inline-flex items-center gap-1`} data-testid="badge-detail-home">
                        <Home className="h-3 w-3" />
                        {homeInfo.label}
                      </Badge>
                    ) : (
                      <p className="text-sm">{detailDonation.donationHomeType}</p>
                    );
                  })()}
                </div>
              )}

              {detailDonation.transactionId && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="text-sm font-mono">{detailDonation.transactionId}</p>
                </div>
              )}

              {detailDonation.remarks && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm" data-testid="text-detail-notes">{detailDonation.remarks}</p>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-muted-foreground mb-3">Send Thank You</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendThankYouEmail}
                    disabled={thankYouLoading}
                    data-testid="button-thank-you-email"
                  >
                    {thankYouLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4 mr-2" />
                    )}
                    Send Thank You (Email)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppThankYou}
                    data-testid="button-thank-you-whatsapp"
                  >
                    {whatsappCopied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <SiWhatsapp className="h-4 w-4 mr-2" />
                    )}
                    {whatsappCopied ? "Copied!" : "Send Thank You (WhatsApp)"}
                  </Button>
                  {detailDonation.receiptNumber && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(detailDonation.id)}
                      data-testid="button-detail-download-receipt"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/dashboard/donations/${detailDonation.id}`)}
                  data-testid="button-full-details"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full Details Page
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetAddForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showPreview ? "Preview Before Saving" : "Record Donation"}</DialogTitle>
            <DialogDescription>
              {showPreview ? "Review the donation details before recording" : "Record a new donation from a donor"}
            </DialogDescription>
          </DialogHeader>

          {showPreview && selectedDonor ? (
            <div className="space-y-4 py-2">
              <div className="rounded-md border p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Receipt Preview</p>
                  <Badge variant="outline" className="font-mono text-xs" data-testid="text-preview-receipt-format">
                    AKF-REC-{new Date().getFullYear()}-XXXX
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Donor</p>
                    <p className="text-sm font-medium" data-testid="text-preview-donor">{selectedDonor.firstName} {selectedDonor.lastName || ""}</p>
                    <p className="text-xs text-muted-foreground">{selectedDonor.donorCode}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium" data-testid="text-preview-date">
                      {newDonation.donationDate ? format(new Date(newDonation.donationDate), "dd MMM yyyy") : "-"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <Badge className={getDonationTypeBadgeColor(newDonation.donationType)} data-testid="badge-preview-type">
                      {DONATION_TYPES.find(t => t.value === newDonation.donationType)?.label || newDonation.donationType}
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Payment Mode</p>
                    <p className="text-sm" data-testid="text-preview-mode">
                      {isInKindDonation ? "In-Kind" : (DONATION_MODES.find(m => m.value === newDonation.donationMode)?.label || newDonation.donationMode)}
                    </p>
                  </div>
                </div>

                {!isInKindDonation ? (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold" data-testid="text-preview-amount">
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(parseFloat(newDonation.donationAmount) || 0)}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {newDonation.quantity && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="text-sm font-medium" data-testid="text-preview-quantity">{newDonation.quantity} {newDonation.unit || ""}</p>
                      </div>
                    )}
                    {newDonation.donationAmount && parseFloat(newDonation.donationAmount) > 0 && (
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Estimated Value</p>
                        <p className="text-sm font-medium" data-testid="text-preview-est-value">
                          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(parseFloat(newDonation.donationAmount))}
                        </p>
                      </div>
                    )}
                    {newDonation.itemDescription && (
                      <div className="space-y-0.5 col-span-2">
                        <p className="text-xs text-muted-foreground">Items</p>
                        <p className="text-sm">{newDonation.itemDescription}</p>
                      </div>
                    )}
                  </div>
                )}

                {newDonation.donationHomeType && (
                  <>
                    <Separator />
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Designated Home</p>
                      <p className="text-sm" data-testid="text-preview-home">
                        {DONATION_HOME_TYPES.find(h => h.value === newDonation.donationHomeType)?.label || newDonation.donationHomeType}
                      </p>
                    </div>
                  </>
                )}

                {newDonation.remarks && (
                  <>
                    <Separator />
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{newDonation.remarks}</p>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                A receipt will be auto-generated and emailed to the donor upon saving.
              </p>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowPreview(false)} data-testid="button-back-to-edit">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={handleAddDonation} disabled={addLoading} data-testid="button-confirm-donation">
                  {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm & Save
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              {Object.keys(formErrors).length > 0 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3 space-y-1" data-testid="form-errors">
                  {Object.values(formErrors).map((err, i) => (
                    <p key={i} className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Select Donor <span className="text-destructive">*</span></Label>
                  {selectedDonor ? (
                    <div className={`flex items-center justify-between p-3 border rounded-md bg-muted/50 ${formErrors.donor ? "border-destructive" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <User className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{selectedDonor.firstName} {selectedDonor.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{selectedDonor.donorCode} {selectedDonor.primaryPhone ? `| ${selectedDonor.primaryPhone}` : selectedDonor.personalEmail ? `| ${selectedDonor.personalEmail}` : ""}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedDonor(null); setFormErrors(prev => { const {donor, ...rest} = prev; return rest; }); }} data-testid="button-deselect-donor">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search name/code or enter phone..."
                            value={donorSearchQuery}
                            onChange={(e) => setDonorSearchQuery(e.target.value)}
                            onKeyDown={handleDonorSearchKeyDown}
                            className={`pl-9 ${formErrors.donor ? "border-destructive" : ""}`}
                            data-testid="input-donor-search"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePhoneLookup}
                          disabled={donorSearchLoading || !donorSearchQuery}
                          title="Lookup by phone"
                          data-testid="button-phone-lookup"
                        >
                          {donorSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                      {formErrors.donor && (
                        <p className="text-xs text-destructive flex items-center gap-1" data-testid="error-donor">
                          <AlertCircle className="h-3 w-3" /> {formErrors.donor}
                        </p>
                      )}
                      {donorSearchLoading && !donorSearchResults.length && (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                      {donorSearchResults.length > 0 && (
                        <div className="border rounded-md max-h-48 overflow-auto">
                          {donorSearchResults.map((donor) => (
                            <button
                              key={donor.id}
                              type="button"
                              className="w-full p-2 text-left hover:bg-muted flex items-center gap-3 border-b last:border-b-0"
                              onClick={() => {
                                setSelectedDonor(donor);
                                setDonorSearchQuery("");
                                setDonorSearchResults([]);
                                setFormErrors(prev => { const {donor: _, ...rest} = prev; return rest; });
                              }}
                              data-testid={`donor-option-${donor.id}`}
                            >
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{donor.firstName} {donor.lastName}</p>
                                <p className="text-xs text-muted-foreground">{donor.donorCode}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Donation Type <span className="text-destructive">*</span></Label>
                  <Select 
                    value={newDonation.donationType} 
                    onValueChange={(v) => { handleDonationTypeChange(v); setFormErrors(prev => { const {amount, inKindValue, ...rest} = prev; return rest; }); }}
                  >
                    <SelectTrigger data-testid="select-new-donation-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DONATION_TYPES.filter(t => t.value !== "all").map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isInKindDonation ? (
                  <>
                    <div className="rounded-md border border-dashed p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">In-kind donation — payment mode set to "In-Kind" automatically</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 25"
                          value={newDonation.quantity}
                          onChange={(e) => { setNewDonation(prev => ({ ...prev, quantity: e.target.value })); setFormErrors(prev => { const {inKindValue, ...rest} = prev; return rest; }); }}
                          className={formErrors.inKindValue ? "border-destructive" : ""}
                          data-testid="input-quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit</Label>
                        <Input
                          placeholder="e.g., kg, bags, pieces"
                          value={newDonation.unit}
                          onChange={(e) => setNewDonation(prev => ({ ...prev, unit: e.target.value }))}
                          data-testid="input-unit"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe the donated items..."
                        value={newDonation.itemDescription}
                        onChange={(e) => setNewDonation(prev => ({ ...prev, itemDescription: e.target.value }))}
                        data-testid="input-item-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kind Category</Label>
                      <Select
                        value={newDonation.kindCategory}
                        onValueChange={(v) => setNewDonation(prev => ({ ...prev, kindCategory: v }))}
                      >
                        <SelectTrigger data-testid="select-kind-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GROCERIES">Groceries</SelectItem>
                          <SelectItem value="MEDICINES">Medicines</SelectItem>
                          <SelectItem value="TOILETRIES">Toiletries</SelectItem>
                          <SelectItem value="STATIONERY">Stationery</SelectItem>
                          <SelectItem value="CLOTHES">Clothes</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kind Description</Label>
                      <Input
                        placeholder="Optional description of donated items"
                        value={newDonation.kindDescription}
                        onChange={(e) => setNewDonation(prev => ({ ...prev, kindDescription: e.target.value }))}
                        data-testid="input-kind-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Value (₹)</Label>
                      <Input
                        type="number"
                        placeholder="Estimated value in rupees"
                        value={newDonation.donationAmount}
                        onChange={(e) => { setNewDonation(prev => ({ ...prev, donationAmount: e.target.value })); setFormErrors(prev => { const {inKindValue, ...rest} = prev; return rest; }); }}
                        className={formErrors.inKindValue ? "border-destructive" : ""}
                        data-testid="input-donation-amount"
                      />
                      <p className="text-xs text-muted-foreground">Provide quantity or estimated value (or both)</p>
                    </div>
                    {formErrors.inKindValue && (
                      <p className="text-xs text-destructive flex items-center gap-1" data-testid="error-inkind">
                        <AlertCircle className="h-3 w-3" /> {formErrors.inKindValue}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={newDonation.donationAmount}
                        onChange={(e) => { setNewDonation(prev => ({ ...prev, donationAmount: e.target.value })); setFormErrors(prev => { const {amount, ...rest} = prev; return rest; }); }}
                        className={formErrors.amount ? "border-destructive" : ""}
                        data-testid="input-donation-amount"
                      />
                      {formErrors.amount && (
                        <p className="text-xs text-destructive flex items-center gap-1" data-testid="error-amount">
                          <AlertCircle className="h-3 w-3" /> {formErrors.amount}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Date <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={newDonation.donationDate}
                        onChange={(e) => { setNewDonation(prev => ({ ...prev, donationDate: e.target.value })); setFormErrors(prev => { const {date, ...rest} = prev; return rest; }); }}
                        className={formErrors.date ? "border-destructive" : ""}
                        data-testid="input-donation-date"
                      />
                    </div>
                  </div>
                )}

                {isInKindDonation && (
                  <div className="space-y-2">
                    <Label>Date <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={newDonation.donationDate}
                      onChange={(e) => { setNewDonation(prev => ({ ...prev, donationDate: e.target.value })); setFormErrors(prev => { const {date, ...rest} = prev; return rest; }); }}
                      className={formErrors.date ? "border-destructive" : ""}
                      data-testid="input-donation-date-inkind"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {!isInKindDonation && (
                    <div className="space-y-2">
                      <Label>Payment Mode <span className="text-destructive">*</span></Label>
                      <Select 
                        value={newDonation.donationMode || "CASH"} 
                        onValueChange={(v) => setNewDonation(prev => ({ ...prev, donationMode: v }))}
                      >
                        <SelectTrigger data-testid="select-donation-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DONATION_MODES.filter(m => m.value !== "IN_KIND").map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Designated Home</Label>
                    <Select 
                      value={newDonation.donationHomeType || "none"} 
                      onValueChange={(v) => setNewDonation(prev => ({ ...prev, donationHomeType: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger data-testid="select-donation-home-new">
                        <SelectValue placeholder="Select home..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {DONATION_HOME_TYPES.filter(h => h.value !== "all").map((h) => (
                          <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Purpose</Label>
                    <Select 
                      value={newDonation.donationPurpose || "none"} 
                      onValueChange={(v) => setNewDonation(prev => ({ ...prev, donationPurpose: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger data-testid="select-donation-purpose-new">
                        <SelectValue placeholder="Select purpose..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {DONATION_PURPOSES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!isInKindDonation && (
                  <div className="space-y-2">
                    <Label>Transaction ID (optional)</Label>
                    <Input
                      placeholder="Enter transaction reference"
                      value={newDonation.transactionId}
                      onChange={(e) => setNewDonation(prev => ({ ...prev, transactionId: e.target.value }))}
                      data-testid="input-transaction-id"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Any additional notes..."
                    value={newDonation.remarks}
                    onChange={(e) => setNewDonation(prev => ({ ...prev, remarks: e.target.value }))}
                    data-testid="input-remarks"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} data-testid="button-cancel-donation">
                  Cancel
                </Button>
                <Button variant="outline" onClick={handlePreviewReceipt} data-testid="button-preview-receipt">
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Receipt
                </Button>
                <Button onClick={handleAddDonation} disabled={addLoading} data-testid="button-submit-donation">
                  {addLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Donation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-donation-success">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center">Donation Recorded</DialogTitle>
            <DialogDescription className="text-center">
              {successResult && (
                <>
                  <span className="font-medium text-foreground">{successResult.currency} {parseFloat(successResult.amount).toLocaleString()}</span>
                  {" from "}
                  <span className="font-medium text-foreground">{successResult.donorName}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {successResult && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between rounded-lg border p-3" data-testid="status-receipt">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Receipt</span>
                </div>
                {successResult.receiptNumber ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    #{successResult.receiptNumber}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Generated</Badge>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3" data-testid="status-email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Email Receipt</span>
                </div>
                {(() => {
                  const s = successResult.communicationResults.emailStatus;
                  if (s === "queued" || s === "sent")
                    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sent</Badge>;
                  if (s === "skipped_no_email")
                    return <Badge variant="secondary">No email on file</Badge>;
                  if (s === "failed")
                    return <Badge variant="destructive">Failed</Badge>;
                  return <Badge variant="secondary">Skipped</Badge>;
                })()}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3" data-testid="status-whatsapp">
                <div className="flex items-center gap-2">
                  <SiWhatsapp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">WhatsApp Thank-You</span>
                </div>
                {(() => {
                  const s = successResult.communicationResults.whatsAppStatus;
                  if (s === "queued" || s === "accepted" || s === "sent")
                    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Queued (Twilio accepted)</Badge>;
                  if (s === "delivered")
                    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Delivered</Badge>;
                  if (s === "undelivered")
                    return <Badge variant="destructive">Undelivered</Badge>;
                  if (s === "skipped_no_phone")
                    return <Badge variant="secondary">No phone on file</Badge>;
                  if (s === "skipped_invalid_phone")
                    return <Badge variant="secondary">Invalid phone number</Badge>;
                  if (s === "not_configured")
                    return <Badge variant="secondary">Not configured</Badge>;
                  if (s === "failed")
                    return <Badge variant="destructive">Failed</Badge>;
                  return <Badge variant="secondary">Skipped</Badge>;
                })()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => setShowSuccessDialog(false)}
              data-testid="button-close-success"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
