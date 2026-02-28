"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileBarChart,
  Plus,
  Loader2,
  RefreshCw,
  Download,
  Share2,
  Trash2,
  Eye,
  Settings2,
  Search,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { authStorage } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";

interface DonorReport {
  id: string;
  type: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  donorId: string | null;
  campaignId: string | null;
  reportData: any;
  createdAt: string;
  donor?: { firstName: string; lastName: string; donorCode: string } | null;
  campaign?: { name: string } | null;
  template?: { name: string } | null;
}

interface ReportTemplate {
  id: string;
  name: string;
  headerText: string | null;
  footerText: string | null;
  showDonationSummary: boolean;
  showDonationBreakdown: boolean;
  showBeneficiaries: boolean;
  showCampaigns: boolean;
  showUsageSummary: boolean;
  isDefault: boolean;
}

interface DonorSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  donorCode: string;
  personalEmail: string | null;
}

interface CampaignResult {
  id: string;
  name: string;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authStorage.getAccessToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

export default function DonorReportsPage() {
  const [reports, setReports] = useState<DonorReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showGenerate, setShowGenerate] = useState(false);
  const [genType, setGenType] = useState("QUARTERLY");
  const [genStart, setGenStart] = useState("");
  const [genEnd, setGenEnd] = useState("");
  const [genDonorId, setGenDonorId] = useState("");
  const [genCampaignId, setGenCampaignId] = useState("");
  const [genTemplateId, setGenTemplateId] = useState("");
  const [genTitle, setGenTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  const [donorSearch, setDonorSearch] = useState("");
  const [donorResults, setDonorResults] = useState<DonorSearchResult[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<DonorSearchResult | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignResult[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);

  const [showShare, setShowShare] = useState(false);
  const [shareReportId, setShareReportId] = useState("");
  const [shareSearch, setShareSearch] = useState("");
  const [shareResults, setShareResults] = useState<DonorSearchResult[]>([]);
  const [selectedShareDonors, setSelectedShareDonors] = useState<DonorSearchResult[]>([]);
  const [sharing, setSharing] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [previewReport, setPreviewReport] = useState<DonorReport | null>(null);

  const [showTemplates, setShowTemplates] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ReportTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    headerText: "",
    footerText: "",
    showDonationSummary: true,
    showDonationBreakdown: true,
    showBeneficiaries: true,
    showCampaigns: true,
    showUsageSummary: true,
    isDefault: false,
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [filterType, setFilterType] = useState("");
  const [filterDonorId, setFilterDonorId] = useState("");

  const { toast } = useToast();
  const user = authStorage.getUser();

  if (user && !canAccessModule(user?.role, "donorReports")) return <AccessDenied />;

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (filterType) params.set("type", filterType);
      if (filterDonorId) params.set("donorId", filterDonorId);
      const res = await fetchWithAuth(`/api/donor-reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      toast({ title: "Failed to load reports", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterDonorId]);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/donor-reports/campaigns");
      if (res.ok) setCampaigns(await res.json());
    } catch {}
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/donor-reports/templates");
      if (res.ok) setTemplates(await res.json());
    } catch {}
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);
  useEffect(() => { loadCampaigns(); loadTemplates(); }, []);

  const searchDonors = useCallback(async (query: string, setter: (r: DonorSearchResult[]) => void) => {
    if (query.length < 2) { setter([]); return; }
    try {
      const res = await fetchWithAuth(`/api/donor-reports/search-donors?search=${encodeURIComponent(query)}&limit=10`);
      if (res.ok) setter(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchDonors(donorSearch, setDonorResults), 300);
    return () => clearTimeout(t);
  }, [donorSearch, searchDonors]);

  useEffect(() => {
    const t = setTimeout(() => searchDonors(shareSearch, setShareResults), 300);
    return () => clearTimeout(t);
  }, [shareSearch, searchDonors]);

  async function handleGenerate() {
    if (!genStart || !genEnd) {
      toast({ title: "Please select period dates", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const body: any = {
        type: genType,
        periodStart: genStart,
        periodEnd: genEnd,
      };
      if (genDonorId) body.donorId = genDonorId;
      if (genCampaignId) body.campaignId = genCampaignId;
      if (genTemplateId) body.templateId = genTemplateId;
      if (genTitle) body.title = genTitle;

      const res = await fetchWithAuth("/api/donor-reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: "Report generated successfully" });
        setShowGenerate(false);
        resetGenerateForm();
        loadReports();
      } else {
        const err = await res.json().catch(() => null);
        toast({ title: err?.message || "Failed to generate report", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to generate report", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  function resetGenerateForm() {
    setGenType("QUARTERLY");
    setGenStart("");
    setGenEnd("");
    setGenDonorId("");
    setGenCampaignId("");
    setGenTemplateId("");
    setGenTitle("");
    setSelectedDonor(null);
    setDonorSearch("");
    setDonorResults([]);
  }

  async function handleDownload(id: string, format: "pdf" | "excel") {
    setActionLoading(`download-${format}-${id}`);
    try {
      const endpoint = format === "pdf" ? "download/pdf" : "download/excel";
      const res = await fetchWithAuth(`/api/donor-reports/${id}/${endpoint}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = format === "pdf" ? `report-${id}.pdf` : `report-${id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: `${format.toUpperCase()} downloaded` });
      } else {
        toast({ title: "Download failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleShare() {
    if (selectedShareDonors.length === 0) {
      toast({ title: "Select donors to share with", variant: "destructive" });
      return;
    }
    setSharing(true);
    try {
      const res = await fetchWithAuth(`/api/donor-reports/${shareReportId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorIds: selectedShareDonors.map(d => d.id) }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Report shared with ${data.sentCount} donor(s)` });
        setShowShare(false);
        setSelectedShareDonors([]);
        setShareSearch("");
        setShareResults([]);
        loadReports();
      } else {
        toast({ title: "Failed to share report", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to share report", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetchWithAuth(`/api/donor-reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Report deleted" });
        loadReports();
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePreview(report: DonorReport) {
    if (!report.reportData) {
      setActionLoading(`preview-${report.id}`);
      try {
        const res = await fetchWithAuth(`/api/donor-reports/${report.id}`);
        if (res.ok) {
          const full = await res.json();
          setPreviewReport(full);
          setShowPreview(true);
        }
      } catch {} finally {
        setActionLoading(null);
      }
    } else {
      setPreviewReport(report);
      setShowPreview(true);
    }
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    try {
      const url = editTemplate
        ? `/api/donor-reports/templates/${editTemplate.id}`
        : "/api/donor-reports/templates";
      const method = editTemplate ? "PATCH" : "POST";
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      if (res.ok) {
        toast({ title: editTemplate ? "Template updated" : "Template created" });
        loadTemplates();
        setEditTemplate(null);
        resetTemplateForm();
      } else {
        toast({ title: "Failed to save template", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save template", variant: "destructive" });
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      const res = await fetchWithAuth(`/api/donor-reports/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Template deleted" });
        loadTemplates();
      }
    } catch {}
  }

  function resetTemplateForm() {
    setTemplateForm({
      name: "",
      headerText: "",
      footerText: "",
      showDonationSummary: true,
      showDonationBreakdown: true,
      showBeneficiaries: true,
      showCampaigns: true,
      showUsageSummary: true,
      isDefault: false,
    });
  }

  function openEditTemplate(tpl: ReportTemplate) {
    setEditTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      headerText: tpl.headerText || "",
      footerText: tpl.footerText || "",
      showDonationSummary: tpl.showDonationSummary,
      showDonationBreakdown: tpl.showDonationBreakdown,
      showBeneficiaries: tpl.showBeneficiaries,
      showCampaigns: tpl.showCampaigns,
      showUsageSummary: tpl.showUsageSummary,
      isDefault: tpl.isDefault,
    });
  }

  const isAdmin = hasPermission(user?.role, "donorReports", "generate");

  const statusColor = (s: string) => {
    switch (s) {
      case "READY": return "secondary";
      case "SHARED": return "default";
      case "GENERATING": return "outline";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "QUARTERLY": return "Quarterly";
      case "ANNUAL": return "Annual";
      case "CUSTOM": return "Custom";
      default: return t;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto" data-testid="donor-reports-page">
      <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Donor Reports</h1>
          <p className="text-sm text-muted-foreground">Generate quarterly and annual reports for donors</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplates(true)}
                data-testid="button-manage-templates"
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Templates
              </Button>
              <Button
                size="sm"
                onClick={() => { resetGenerateForm(); setShowGenerate(true); }}
                data-testid="button-generate-report"
              >
                <Plus className="h-4 w-4 mr-1" />
                Generate Report
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={loadReports} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterType} onValueChange={(v) => { setFilterType(v === "ALL" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-type">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
            <SelectItem value="ANNUAL">Annual</SelectItem>
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>
        {filterType || filterDonorId ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterType(""); setFilterDonorId(""); setPage(1); }}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        ) : null}
        <span className="text-sm text-muted-foreground ml-auto">{total} report(s)</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No reports found. Generate your first report.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow key={r.id} data-testid={`row-report-${r.id}`}>
                    <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabel(r.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.donor ? `${r.donor.firstName} ${r.donor.lastName || ""}`.trim() : "All Donors"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(r)}
                          disabled={actionLoading === `preview-${r.id}`}
                          data-testid={`button-preview-${r.id}`}
                        >
                          {actionLoading === `preview-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(r.id, "pdf")}
                          disabled={!!actionLoading}
                          data-testid={`button-download-pdf-${r.id}`}
                        >
                          {actionLoading === `download-pdf-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(r.id, "excel")}
                          disabled={!!actionLoading}
                          data-testid={`button-download-excel-${r.id}`}
                        >
                          {actionLoading === `download-excel-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setShareReportId(r.id); setShowShare(true); }}
                              data-testid={`button-share-${r.id}`}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(r.id)}
                              disabled={actionLoading === `delete-${r.id}`}
                              data-testid={`button-delete-${r.id}`}
                            >
                              {actionLoading === `delete-${r.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-md" data-testid="dialog-generate">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>Configure and generate a donor report</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Title (optional)</Label>
              <Input
                value={genTitle}
                onChange={(e) => setGenTitle(e.target.value)}
                placeholder="Auto-generated if empty"
                data-testid="input-title"
              />
            </div>
            <div className="space-y-1">
              <Label>Report Type</Label>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Period Start</Label>
                <Input type="date" value={genStart} onChange={(e) => setGenStart(e.target.value)} data-testid="input-start" />
              </div>
              <div className="space-y-1">
                <Label>Period End</Label>
                <Input type="date" value={genEnd} onChange={(e) => setGenEnd(e.target.value)} data-testid="input-end" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Specific Donor (optional)</Label>
              <div className="relative">
                <Input
                  value={selectedDonor ? `${selectedDonor.firstName} ${selectedDonor.lastName || ""} (${selectedDonor.donorCode})` : donorSearch}
                  onChange={(e) => { setDonorSearch(e.target.value); setSelectedDonor(null); setGenDonorId(""); }}
                  placeholder="Search donor..."
                  data-testid="input-donor-search"
                />
                {selectedDonor && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => { setSelectedDonor(null); setGenDonorId(""); setDonorSearch(""); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                {donorResults.length > 0 && !selectedDonor && (
                  <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
                    {donorResults.map((d) => (
                      <button
                        key={d.id}
                        className="w-full text-left px-3 py-2 text-sm hover-elevate"
                        onClick={() => { setSelectedDonor(d); setGenDonorId(d.id); setDonorResults([]); }}
                        data-testid={`donor-option-${d.id}`}
                      >
                        {d.firstName} {d.lastName || ""} ({d.donorCode})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Campaign (optional)</Label>
              <Select value={genCampaignId || "NONE"} onValueChange={(v) => setGenCampaignId(v === "NONE" ? "" : v)}>
                <SelectTrigger data-testid="select-campaign">
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">All campaigns</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Template (optional)</Label>
              <Select value={genTemplateId || "NONE"} onValueChange={(v) => setGenTemplateId(v === "NONE" ? "" : v)}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder="Default template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Default</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}{t.isDefault ? " (Default)" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating} data-testid="button-confirm-generate">
              {generating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-md" data-testid="dialog-share">
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
            <DialogDescription>Select donors to email this report to</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
                placeholder="Search donors..."
                data-testid="input-share-search"
              />
            </div>
            {shareResults.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {shareResults.map((d) => {
                  const isSelected = selectedShareDonors.some(sd => sd.id === d.id);
                  return (
                    <button
                      key={d.id}
                      className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover-elevate"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedShareDonors(prev => prev.filter(sd => sd.id !== d.id));
                        } else {
                          setSelectedShareDonors(prev => [...prev, d]);
                        }
                      }}
                      data-testid={`share-donor-${d.id}`}
                    >
                      <span>{d.firstName} {d.lastName || ""} ({d.donorCode})</span>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedShareDonors.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Selected ({selectedShareDonors.length})</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedShareDonors.map(d => (
                    <Badge key={d.id} variant="secondary" className="gap-1">
                      {d.firstName} {d.lastName || ""}
                      <button onClick={() => setSelectedShareDonors(prev => prev.filter(sd => sd.id !== d.id))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShare(false)}>Cancel</Button>
            <Button onClick={handleShare} disabled={sharing || selectedShareDonors.length === 0} data-testid="button-confirm-share">
              {sharing && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Share via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-preview">
          <DialogHeader>
            <DialogTitle>{previewReport?.title}</DialogTitle>
            <DialogDescription>
              {previewReport && `${new Date(previewReport.periodStart).toLocaleDateString()} - ${new Date(previewReport.periodEnd).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          {previewReport?.reportData && (
            <div className="space-y-4">
              {previewReport.reportData.summary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Donations</p>
                        <p className="text-lg font-semibold" data-testid="text-total-amount">
                          {previewReport.reportData.summary.totalAmount?.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Donation Count</p>
                        <p className="text-lg font-semibold">{previewReport.reportData.summary.totalDonations}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unique Donors</p>
                        <p className="text-lg font-semibold">{previewReport.reportData.summary.uniqueDonors}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Beneficiaries</p>
                        <p className="text-lg font-semibold">{previewReport.reportData.summary.beneficiariesSupported}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {previewReport.reportData.topDonors?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top Donors</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewReport.reportData.topDonors.map((d: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{d.name}</TableCell>
                            <TableCell>{d.code}</TableCell>
                            <TableCell className="text-right">{d.amount?.toLocaleString("en-IN")}</TableCell>
                            <TableCell className="text-right">{d.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {previewReport.reportData.donationsByType?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Donations by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewReport.reportData.donationsByType.map((d: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{d.type?.replace(/_/g, " ")}</TableCell>
                            <TableCell className="text-right">{d.count}</TableCell>
                            <TableCell className="text-right">{d.amount?.toLocaleString("en-IN")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {previewReport.reportData.beneficiaries?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Beneficiaries Supported</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Home</TableHead>
                          <TableHead className="text-right">Sponsors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewReport.reportData.beneficiaries.slice(0, 20).map((b: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{b.name}</TableCell>
                            <TableCell>{b.home?.replace(/_/g, " ")}</TableCell>
                            <TableCell className="text-right">{b.sponsors}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-templates">
          <DialogHeader>
            <DialogTitle>Report Templates</DialogTitle>
            <DialogDescription>Manage configurable report templates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {templates.length > 0 && (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          t.showDonationSummary && "Summary",
                          t.showDonationBreakdown && "Breakdown",
                          t.showBeneficiaries && "Beneficiaries",
                          t.showCampaigns && "Campaigns",
                          t.showUsageSummary && "Usage",
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {t.isDefault && <Badge variant="secondary">Default</Badge>}
                      <Button variant="ghost" size="icon" onClick={() => openEditTemplate(t)} data-testid={`button-edit-template-${t.id}`}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} data-testid={`button-delete-template-${t.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">{editTemplate ? "Edit Template" : "New Template"}</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Quarterly Summary"
                    data-testid="input-template-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Header Text</Label>
                  <Textarea
                    value={templateForm.headerText}
                    onChange={(e) => setTemplateForm(f => ({ ...f, headerText: e.target.value }))}
                    placeholder="Custom header message..."
                    className="resize-none"
                    rows={2}
                    data-testid="input-header-text"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Footer Text</Label>
                  <Textarea
                    value={templateForm.footerText}
                    onChange={(e) => setTemplateForm(f => ({ ...f, footerText: e.target.value }))}
                    placeholder="Custom footer message..."
                    className="resize-none"
                    rows={2}
                    data-testid="input-footer-text"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Sections</Label>
                  {[
                    { key: "showDonationSummary", label: "Donation Summary" },
                    { key: "showDonationBreakdown", label: "Donation Breakdown" },
                    { key: "showBeneficiaries", label: "Beneficiaries" },
                    { key: "showCampaigns", label: "Campaigns" },
                    { key: "showUsageSummary", label: "Usage Summary" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={(templateForm as any)[key]}
                        onCheckedChange={(v) => setTemplateForm(f => ({ ...f, [key]: v }))}
                        data-testid={`switch-${key}`}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Set as Default</Label>
                    <Switch
                      checked={templateForm.isDefault}
                      onCheckedChange={(v) => setTemplateForm(f => ({ ...f, isDefault: v }))}
                      data-testid="switch-isDefault"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                {editTemplate && (
                  <Button variant="outline" size="sm" onClick={() => { setEditTemplate(null); resetTemplateForm(); }}>
                    Cancel Edit
                  </Button>
                )}
                <Button size="sm" onClick={handleSaveTemplate} disabled={savingTemplate || !templateForm.name} data-testid="button-save-template">
                  {savingTemplate && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {editTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
