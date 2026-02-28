"use client";

import AssignDonorOwner from "./components/AssignDonorOwner";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Lock,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Eye,
  Upload,
  FileSpreadsheet,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  GitMerge,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  primaryPhone?: string;
  personalEmail?: string;
  city?: string;
  state?: string;
  country?: string;
  category: string;
  religion?: string;
  donationFrequency?: string;
  healthScore?: number;
  healthStatus?: "GREEN" | "YELLOW" | "RED";
  healthReasons?: string[];
  engagementLevel?: "HOT" | "WARM" | "COLD";

  // ✅ Owner / assigned staff user (matches backend: assignedToUser)
  assignedToUser?: {
    id: string;
    name: string;
    email?: string;
  } | null;

  _count: {
    donations: number;
    pledges: number;
  };
}

interface DonorsResponse {
  items: Donor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface StaffMember {
  id: string;
  name: string;
}
interface ImportField {
  key: string;
  label: string;
  required: boolean;
}

interface ParsedFileData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  suggestedMapping: Record<string, string>;
  availableFields: ImportField[];
}

interface DuplicateResult {
  rowIndex: number;
  duplicate: boolean;
  existingDonor?: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName?: string | null;
    primaryPhone?: string | null;
    personalEmail?: string | null;
  };
  matchedOn?: string[];
}

interface ImportSummary {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ rowIndex: number; error: string; rowData: any }>;
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "NGO", label: "NGO" },
  { value: "CSR_REP", label: "CSR Representative" },
  { value: "WHATSAPP_GROUP", label: "WhatsApp Group" },
  { value: "SOCIAL_MEDIA_PERSON", label: "Social Media Person" },
  { value: "CROWD_PULLER", label: "Crowd Puller" },
  { value: "VISITOR_ENQUIRY", label: "Visitor Enquiry" },
];

const DONATION_FREQUENCIES = [
  { value: "all", label: "All Frequencies" },
  { value: "ONE_TIME", label: "One Time" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "OCCASIONAL", label: "Occasional" },
];

export default function DonorsPage() {
  const router = useRouter();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [requestingAccess, setRequestingAccess] = useState<string | null>(null);
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [religionFilter, setReligionFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [frequencyFilter, setFrequencyFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState("all");
  const [engagementFilter, setEngagementFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [showMasterExportDialog, setShowMasterExportDialog] = useState(false);
  const [masterExportFilters, setMasterExportFilters] = useState({
    home: "all",
    donorType: "all",
    activity: "all",
  });
  const [masterExporting, setMasterExporting] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState<
    "upload" | "mapping" | "review" | "importing" | "summary"
  >("upload");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {},
  );
  const [duplicateResults, setDuplicateResults] = useState<DuplicateResult[]>(
    [],
  );
  const [rowActions, setRowActions] = useState<
    Record<number, "skip" | "update" | "create">
  >({});
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (cityFilter) params.set("city", cityFilter);
      if (countryFilter) params.set("country", countryFilter);
      if (religionFilter) params.set("religion", religionFilter);
      if (assignedFilter !== "all")
        params.set("assignedToUserId", assignedFilter);
      if (frequencyFilter !== "all")
        params.set("donationFrequency", frequencyFilter);
      if (healthFilter !== "all") params.set("healthStatus", healthFilter);
      if (engagementFilter !== "all")
        params.set("engagementLevel", engagementFilter);

      const res = await fetchWithAuth(`/api/donors?${params.toString()}`);

      if (res.ok) {
        const data: DonorsResponse = await res.json();
        setDonors(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        setError("Failed to fetch donors. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      setError("An error occurred while fetching donors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    categoryFilter,
    cityFilter,
    countryFilter,
    religionFilter,
    assignedFilter,
    frequencyFilter,
    healthFilter,
    engagementFilter,
  ]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/auth/profile");

      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  const fetchStaffMembers = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/users");

      if (res.ok) {
        const users = await res.json();
        setStaffMembers(users.filter((u: any) => u.role !== "ADMIN"));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchStaffMembers();
  }, [fetchProfile, fetchStaffMembers]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setCategoryFilter("all");
    setCityFilter("");
    setCountryFilter("");
    setReligionFilter("");
    setAssignedFilter("all");
    setFrequencyFilter("all");
    setHealthFilter("all");
    setEngagementFilter("all");
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    categoryFilter !== "all" ||
    cityFilter ||
    countryFilter ||
    religionFilter ||
    assignedFilter !== "all" ||
    frequencyFilter !== "all" ||
    healthFilter !== "all" ||
    engagementFilter !== "all";

  const resetImportModal = () => {
    setImportStep("upload");
    setParsedData(null);
    setColumnMapping({});
    setDuplicateResults([]);
    setRowActions({});
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetchWithAuth("/api/donors/bulk-import/parse", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data: ParsedFileData = await res.json();
        setParsedData(data);
        setColumnMapping(data.suggestedMapping);
        setImportStep("mapping");
      } else {
        const error = await res.json();
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to parse file",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDetectDuplicates = async () => {
    if (!parsedData) return;

    setDetectingDuplicates(true);
    try {
      const res = await fetchWithAuth(
        "/api/donors/bulk-import/detect-duplicates",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rows: parsedData.rows,
            columnMapping,
          }),
        },
      );

      if (res.ok) {
        const { results } = await res.json();
        setDuplicateResults(results);

        const defaultActions: Record<number, "skip" | "update" | "create"> = {};
        results.forEach((r: DuplicateResult) => {
          defaultActions[r.rowIndex] = r.duplicate ? "skip" : "create";
        });
        setRowActions(defaultActions);
        setImportStep("review");
      } else {
        const error = await res.json();
        toast({
          title: "Detection Failed",
          description: error.message || "Failed to detect duplicates",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to detect duplicates",
        variant: "destructive",
      });
    } finally {
      setDetectingDuplicates(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setImportStep("importing");
    try {
      const res = await fetchWithAuth("/api/donors/bulk-import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: parsedData.rows,
          columnMapping,
          actions: rowActions,
        }),
      });

      if (res.ok) {
        const summary: ImportSummary = await res.json();
        setImportSummary(summary);
        setImportStep("summary");
        if (summary.imported > 0 || summary.updated > 0) {
          fetchDonors();
        }
      } else {
        const error = await res.json();
        toast({
          title: "Import Failed",
          description: error.message || "Failed to import donors",
          variant: "destructive",
        });
        setImportStep("review");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to import donors",
        variant: "destructive",
      });
      setImportStep("review");
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorReport = () => {
    if (!importSummary || importSummary.errors.length === 0) return;

    const errorRows = importSummary.errors.map((e) => ({
      "Row Number": e.rowIndex + 2,
      Error: e.error,
      Data: JSON.stringify(e.rowData),
    }));

    const csvContent = [
      Object.keys(errorRows[0]).join(","),
      ...errorRows.map((row) =>
        Object.values(row)
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `import-errors-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getMappedValue = (row: any[], columnIndex: string) => {
    const idx = parseInt(columnIndex);
    return row[idx] !== undefined && row[idx] !== null ? String(row[idx]) : "";
  };

  const handleRequestAccess = async (donorId: string) => {
    try {
      setRequestingAccess(donorId);

      const res = await fetchWithAuth(`/api/donors/${donorId}/request-access`, {
        method: "POST",
      });

      if (res.ok) {
        toast({
          title: "Access Requested",
          description:
            "Your request for full access has been logged. An admin will review it.",
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
      setRequestingAccess(null);
    }
  };

  const handleMasterExport = async () => {
    try {
      setMasterExporting(true);
      const params = new URLSearchParams();
      if (masterExportFilters.home !== "all")
        params.set("home", masterExportFilters.home);
      if (masterExportFilters.donorType !== "all")
        params.set("donorType", masterExportFilters.donorType);
      if (masterExportFilters.activity !== "all")
        params.set("activity", masterExportFilters.activity);
      const queryStr = params.toString();
      const url = `/api/donors/export/master-excel${queryStr ? "?" + queryStr : ""}`;
      const res = await fetchWithAuth(url);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Export failed");
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `master-donor-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      setShowMasterExportDialog(false);
      toast({
        title: "Export Complete",
        description: "Master donor Excel has been downloaded.",
      });
    } catch (err: any) {
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export donor data",
        variant: "destructive",
      });
    } finally {
      setMasterExporting(false);
    }
  };

  const isAdmin = user?.role === "ADMIN";
  const canAddDonor = hasPermission(user?.role, "donors", "create");
  const canExportDonors = hasPermission(user?.role, "donors", "export");
  const isDataMasked = !isAdmin;

  const getDonorName = (donor: Donor) => {
    const parts = [donor.firstName, donor.middleName, donor.lastName].filter(
      Boolean,
    );
    return parts.join(" ");
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Donors</h1>
          <p className="text-muted-foreground mt-1">
            Manage your donor database
            {isDataMasked && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                (Contact info masked for privacy)
              </span>
            )}
          </p>
        </div>
        {(canAddDonor || canExportDonors) && (
          <div className="flex items-center gap-2">
            {canExportDonors && (
              <Button
                variant="outline"
                data-testid="button-master-export"
                onClick={() => setShowMasterExportDialog(true)}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Master Export
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                data-testid="button-detect-duplicates"
                onClick={() => router.push("/dashboard/donors/duplicates")}
              >
                <GitMerge className="mr-2 h-4 w-4" />
                Detect Duplicates
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                data-testid="button-import-donors"
                onClick={() => {
                  resetImportModal();
                  setShowImportModal(true);
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Donors
              </Button>
            )}
            {canAddDonor && (
              <Button
                data-testid="button-add-donor"
                onClick={() => router.push("/dashboard/donors/new")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Donor
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Donor List</CardTitle>
              <CardDescription>
                {total > 0
                  ? `${total} donor${total !== 1 ? "s" : ""} found`
                  : "Search and filter donors"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email, or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Button onClick={handleSearch} data-testid="button-search">
              Search
            </Button>
            <Button
              variant={healthFilter === "RED" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (healthFilter === "RED") {
                  setHealthFilter("all");
                } else {
                  setHealthFilter("RED");
                }
                setPage(1);
              }}
              data-testid="button-at-risk-filter"
            >
              <AlertTriangle className="mr-1 h-4 w-4" />
              At Risk
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Category
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => {
                    setCategoryFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input
                  placeholder="Filter by city"
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setPage(1);
                  }}
                  data-testid="input-city-filter"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Country
                </label>
                <Input
                  placeholder="Filter by country"
                  value={countryFilter}
                  onChange={(e) => {
                    setCountryFilter(e.target.value);
                    setPage(1);
                  }}
                  data-testid="input-country-filter"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Religion
                </label>
                <Input
                  placeholder="Filter by religion"
                  value={religionFilter}
                  onChange={(e) => {
                    setReligionFilter(e.target.value);
                    setPage(1);
                  }}
                  data-testid="input-religion-filter"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Frequency
                </label>
                <Select
                  value={frequencyFilter}
                  onValueChange={(v) => {
                    setFrequencyFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DONATION_FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && staffMembers.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Assigned To
                  </label>
                  <Select
                    value={assignedFilter}
                    onValueChange={(v) => {
                      setAssignedFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger data-testid="select-assigned">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {staffMembers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Health Status
                </label>
                <Select
                  value={healthFilter}
                  onValueChange={(v) => {
                    setHealthFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger data-testid="select-health-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Donors</SelectItem>
                    <SelectItem value="RED">At Risk</SelectItem>
                    <SelectItem value="YELLOW">Needs Attention</SelectItem>
                    <SelectItem value="GREEN">Healthy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Engagement Level
                </label>
                <Select
                  value={engagementFilter}
                  onValueChange={(v) => {
                    setEngagementFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger data-testid="select-engagement-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="WARM">WARM</SelectItem>
                    <SelectItem value="COLD">COLD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 max-w-md">
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">
                        <Skeleton className="h-6 w-20" />
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        <Skeleton className="h-6 w-12" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-6 w-16" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-6 w-20" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-6 w-20" />
                      </TableHead>
                      <TableHead>
                        <Skeleton className="h-6 w-20" />
                      </TableHead>
                      <TableHead className="text-center">
                        <Skeleton className="h-6 w-16" />
                      </TableHead>
                      <TableHead className="text-right">
                        <Skeleton className="h-6 w-12" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-3 w-3 rounded-full mx-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-6 w-8 mx-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-8" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-4 opacity-50 text-destructive" />
              <p className="text-lg font-medium">{error}</p>
              <Button
                className="mt-4"
                onClick={() => fetchDonors()}
                data-testid="button-retry-fetch"
              >
                Try Again
              </Button>
            </div>
          ) : donors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users
                className="h-12 w-12 mb-4 opacity-50"
                data-testid="icon-no-donors"
              />
              <p
                className="text-lg font-medium"
                data-testid="text-no-donors-title"
              >
                No Donors Found
              </p>
              <p
                className="text-sm mb-4"
                data-testid="text-no-donors-description"
              >
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Add your first donor to get started"}
              </p>
              {!hasActiveFilters && canAddDonor && (
                <Button
                  data-testid="button-add-first-donor"
                  onClick={() => router.push("/dashboard/donors/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Donor
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Code</TableHead>
                      <TableHead className="w-[80px] text-center">
                        Health
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Donations</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((donor) => (
                      <TableRow
                        key={donor.id}
                        data-testid={`row-donor-${donor.id}`}
                        className="cursor-pointer hover-elevate"
                        onClick={() =>
                          router.push(`/dashboard/donors/${donor.id}`)
                        }
                      >
                        <TableCell className="font-mono text-sm">
                          {donor.donorCode}
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            className="flex items-center justify-center"
                            data-testid={`health-score-${donor.id}`}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-3 h-3 rounded-full cursor-help ${
                                    donor.healthStatus === "GREEN"
                                      ? "bg-green-500"
                                      : donor.healthStatus === "YELLOW"
                                        ? "bg-yellow-500"
                                        : donor.healthStatus === "RED"
                                          ? "bg-red-500"
                                          : "bg-gray-400"
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-[250px]"
                              >
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {donor.healthStatus === "GREEN"
                                      ? "Healthy"
                                      : donor.healthStatus === "YELLOW"
                                        ? "Needs Attention"
                                        : donor.healthStatus === "RED"
                                          ? "At Risk"
                                          : "Unknown"}
                                    {donor.healthScore !== undefined &&
                                      ` (${donor.healthScore})`}
                                  </p>
                                  {donor.healthReasons &&
                                    donor.healthReasons.length > 0 && (
                                      <ul className="text-xs space-y-0.5">
                                        {donor.healthReasons.map(
                                          (reason, i) => (
                                            <li
                                              key={i}
                                              className="text-muted-foreground"
                                            >
                                              {reason}
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="font-medium"
                              data-testid={`text-donor-name-${donor.id}`}
                            >
                              {getDonorName(donor)}
                            </div>
                            {donor.engagementLevel && (
                              <Badge
                                data-testid={`badge-engagement-${donor.id}`}
                                variant={
                                  donor.engagementLevel === "HOT"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className={
                                  donor.engagementLevel === "WARM"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                                    : donor.engagementLevel === "COLD"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                      : ""
                                }
                              >
                                {donor.engagementLevel}
                              </Badge>
                            )}
                          </div>
                          {donor.assignedTo && (
                            <div className="text-xs text-muted-foreground">
                              Assigned: {donor.assignedTo.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {donor.primaryPhone && (
                              <div
                                className="flex items-center gap-1 text-sm"
                                data-testid={`text-phone-${donor.id}`}
                              >
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {donor.primaryPhone}
                                {isDataMasked &&
                                  donor.primaryPhone?.includes("*") && (
                                    <Lock className="h-3 w-3 text-amber-500" />
                                  )}
                              </div>
                            )}
                            {donor.personalEmail && (
                              <div
                                className="flex items-center gap-1 text-sm"
                                data-testid={`text-email-${donor.id}`}
                              >
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[180px]">
                                  {donor.personalEmail}
                                </span>
                                {isDataMasked &&
                                  donor.personalEmail?.includes("*") && (
                                    <Lock className="h-3 w-3 text-amber-500" />
                                  )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {[donor.city, donor.state]
                              .filter(Boolean)
                              .join(", ") || "-"}
                          </div>
                          {donor.country && donor.country !== "India" && (
                            <div className="text-xs text-muted-foreground">
                              {donor.country}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(donor.category)}>
                            {donor.category.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant="secondary">
                              {donor._count.donations}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isDataMasked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRequestAccess(donor.id)}
                                disabled={requestingAccess === donor.id}
                                data-testid={`button-request-access-${donor.id}`}
                              >
                                <Lock className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-donor-${donor.id}`}
                              onClick={() =>
                                router.push(`/dashboard/donors/${donor.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showImportModal}
        onOpenChange={(open) => {
          setShowImportModal(open);
          if (!open) resetImportModal();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Donors
            </DialogTitle>
            <DialogDescription>
              {importStep === "upload" &&
                "Upload an Excel (.xlsx) or CSV file to import donors"}
              {importStep === "mapping" &&
                "Map your file columns to donor fields"}
              {importStep === "review" &&
                "Review duplicates and choose actions for each row"}
              {importStep === "importing" && "Importing donors..."}
              {importStep === "summary" && "Import completed"}
            </DialogDescription>
          </DialogHeader>

          {importStep === "upload" && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-import-file"
                />
                {uploadingFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Parsing file...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Excel (.xlsx, .xls) or CSV files up to 10MB
                    </p>
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Import tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>First row should contain column headers</li>
                  <li>
                    At least one of: Name, Phone, or Email is required per row
                  </li>
                  <li>Phone numbers will be normalized to 10 digits</li>
                  <li>Duplicates will be detected by phone or email</li>
                </ul>
              </div>
            </div>
          )}

          {importStep === "mapping" && parsedData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {parsedData.headers.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className="flex-1 p-2 bg-muted rounded text-sm font-medium truncate"
                      title={header}
                    >
                      {header || `Column ${idx + 1}`}
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <Select
                      value={columnMapping[idx.toString()] || "__skip__"}
                      onValueChange={(v) =>
                        setColumnMapping((prev) => {
                          const newMapping = { ...prev };
                          if (v === "__skip__") {
                            delete newMapping[idx.toString()];
                          } else {
                            newMapping[idx.toString()] = v;
                          }
                          return newMapping;
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-[180px]"
                        data-testid={`select-mapping-${idx}`}
                      >
                        <SelectValue placeholder="Skip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">Skip</SelectItem>
                        {parsedData.availableFields.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium mb-2">
                  Preview (first 5 rows)
                </p>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        {parsedData.headers.map((h, i) => (
                          <TableHead key={i} className="min-w-[100px]">
                            {h || `Col ${i + 1}`}
                            {columnMapping[i.toString()] && (
                              <div className="text-xs text-primary font-normal">
                                → {columnMapping[i.toString()]}
                              </div>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.rows.slice(0, 5).map((row, rowIdx) => (
                        <TableRow key={rowIdx}>
                          <TableCell className="text-muted-foreground">
                            {rowIdx + 1}
                          </TableCell>
                          {parsedData.headers.map((_, colIdx) => (
                            <TableCell
                              key={colIdx}
                              className="max-w-[150px] truncate"
                            >
                              {row[colIdx] !== undefined
                                ? String(row[colIdx])
                                : ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total rows to import: {parsedData.totalRows}
                </p>
              </div>
            </div>
          )}

          {importStep === "review" && parsedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">
                  {duplicateResults.filter((r) => r.duplicate).length}{" "}
                  duplicates found
                </Badge>
                <Badge variant="outline">
                  {duplicateResults.filter((r) => !r.duplicate).length} new
                  donors
                </Badge>
              </div>

              <div className="overflow-x-auto border rounded-lg max-h-[400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.rows.map((row, rowIdx) => {
                      const dupResult = duplicateResults.find(
                        (r) => r.rowIndex === rowIdx,
                      );
                      const nameColIdx = Object.entries(columnMapping).find(
                        ([_, v]) => v === "firstName",
                      )?.[0];
                      const phoneColIdx = Object.entries(columnMapping).find(
                        ([_, v]) => v === "primaryPhone",
                      )?.[0];
                      const emailColIdx = Object.entries(columnMapping).find(
                        ([_, v]) => v === "personalEmail",
                      )?.[0];

                      return (
                        <TableRow
                          key={rowIdx}
                          className={
                            dupResult?.duplicate
                              ? "bg-amber-50 dark:bg-amber-950/20"
                              : ""
                          }
                        >
                          <TableCell className="text-muted-foreground">
                            {rowIdx + 2}
                          </TableCell>
                          <TableCell>
                            {nameColIdx ? getMappedValue(row, nameColIdx) : "-"}
                          </TableCell>
                          <TableCell>
                            {phoneColIdx
                              ? getMappedValue(row, phoneColIdx)
                              : "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {emailColIdx
                              ? getMappedValue(row, emailColIdx)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {dupResult?.duplicate ? (
                              <div className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs">
                                  Matches {dupResult.existingDonor?.donorCode}
                                  {dupResult.matchedOn?.length
                                    ? ` (${dupResult.matchedOn.join(", ")})`
                                    : ""}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">New</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={rowActions[rowIdx] || "skip"}
                              onValueChange={(v) =>
                                setRowActions((prev) => ({
                                  ...prev,
                                  [rowIdx]: v as "skip" | "update" | "create",
                                }))
                              }
                            >
                              <SelectTrigger
                                className="w-[100px]"
                                data-testid={`select-action-${rowIdx}`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="skip">Skip</SelectItem>
                                {dupResult?.duplicate && (
                                  <SelectItem value="update">Update</SelectItem>
                                )}
                                <SelectItem value="create">Create</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span>Quick actions:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newActions: Record<
                      number,
                      "skip" | "update" | "create"
                    > = {};
                    duplicateResults.forEach((r) => {
                      newActions[r.rowIndex] = "create";
                    });
                    setRowActions(newActions);
                  }}
                >
                  Create All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newActions: Record<
                      number,
                      "skip" | "update" | "create"
                    > = {};
                    duplicateResults.forEach((r) => {
                      newActions[r.rowIndex] = "skip";
                    });
                    setRowActions(newActions);
                  }}
                >
                  Skip All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newActions: Record<
                      number,
                      "skip" | "update" | "create"
                    > = {};
                    duplicateResults.forEach((r) => {
                      newActions[r.rowIndex] = r.duplicate
                        ? "update"
                        : "create";
                    });
                    setRowActions(newActions);
                  }}
                >
                  Update Duplicates, Create New
                </Button>
              </div>
            </div>
          )}

          {importStep === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Importing donors...</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment
              </p>
            </div>
          )}

          {importStep === "summary" && importSummary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold">
                    {importSummary.total}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Rows
                  </div>
                </Card>
                <Card className="p-4 text-center bg-green-50 dark:bg-green-950/20">
                  <div className="text-2xl font-bold text-green-600">
                    {importSummary.imported}
                  </div>
                  <div className="text-sm text-muted-foreground">Imported</div>
                </Card>
                <Card className="p-4 text-center bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-2xl font-bold text-blue-600">
                    {importSummary.updated}
                  </div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {importSummary.skipped}
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </Card>
                <Card className="p-4 text-center bg-red-50 dark:bg-red-950/20">
                  <div className="text-2xl font-bold text-red-600">
                    {importSummary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </Card>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-red-700 dark:text-red-400">
                      {importSummary.errors.length} row(s) failed to import
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadErrorReport}
                      data-testid="button-download-errors"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Error Report
                    </Button>
                  </div>
                  <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-[100px] overflow-y-auto">
                    {importSummary.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        Row {err.rowIndex + 2}: {err.error}
                      </li>
                    ))}
                    {importSummary.errors.length > 5 && (
                      <li className="text-muted-foreground">
                        ... and {importSummary.errors.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {(importSummary.imported > 0 || importSummary.updated > 0) && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Donor list has been updated</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {importStep === "mapping" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImportStep("upload");
                    setParsedData(null);
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleDetectDuplicates}
                  disabled={detectingDuplicates}
                  data-testid="button-detect-duplicates"
                >
                  {detectingDuplicates ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Detect Duplicates & Preview
                </Button>
              </>
            )}
            {importStep === "review" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setImportStep("mapping")}
                >
                  Back
                </Button>
                <Button
                  onClick={handleExecuteImport}
                  disabled={importing}
                  data-testid="button-execute-import"
                >
                  {importing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Import{" "}
                  {Object.values(rowActions).filter((a) => a !== "skip").length}{" "}
                  Donors
                </Button>
              </>
            )}
            {importStep === "summary" && (
              <Button
                onClick={() => {
                  setShowImportModal(false);
                  resetImportModal();
                }}
                data-testid="button-close-import"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showMasterExportDialog}
        onOpenChange={setShowMasterExportDialog}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Master Donor Export</DialogTitle>
            <DialogDescription>
              Export a comprehensive Excel file with all donor data including
              personal details, contact info, preferences, special days,
              sponsorships, and lifetime donation totals.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Home
              </label>
              <Select
                value={masterExportFilters.home}
                onValueChange={(v) =>
                  setMasterExportFilters((f) => ({ ...f, home: v }))
                }
              >
                <SelectTrigger data-testid="select-export-home">
                  <SelectValue placeholder="All Homes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Homes</SelectItem>
                  <SelectItem value="ORPHAN_GIRLS">Girls Home</SelectItem>
                  <SelectItem value="BLIND_BOYS">Blind Boys Home</SelectItem>
                  <SelectItem value="OLD_AGE">Old Age Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Donor Type
              </label>
              <Select
                value={masterExportFilters.donorType}
                onValueChange={(v) =>
                  setMasterExportFilters((f) => ({ ...f, donorType: v }))
                }
              >
                <SelectTrigger data-testid="select-export-donor-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="NGO">NGO</SelectItem>
                  <SelectItem value="CSR_REP">CSR Rep</SelectItem>
                  <SelectItem value="WHATSAPP_GROUP">WhatsApp Group</SelectItem>
                  <SelectItem value="SOCIAL_MEDIA_PERSON">
                    Social Media
                  </SelectItem>
                  <SelectItem value="CROWD_PULLER">Crowd Puller</SelectItem>
                  <SelectItem value="VISITOR_ENQUIRY">
                    Visitor / Enquiry
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Activity Status
              </label>
              <Select
                value={masterExportFilters.activity}
                onValueChange={(v) =>
                  setMasterExportFilters((f) => ({ ...f, activity: v }))
                }
              >
                <SelectTrigger data-testid="select-export-activity">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Donors</SelectItem>
                  <SelectItem value="active">
                    Active (donated or sponsored in last year)
                  </SelectItem>
                  <SelectItem value="inactive">
                    Inactive (no activity in last year)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMasterExportDialog(false)}
              data-testid="button-cancel-export"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMasterExport}
              disabled={masterExporting}
              data-testid="button-download-export"
            >
              {masterExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {masterExporting ? "Exporting..." : "Download Excel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
