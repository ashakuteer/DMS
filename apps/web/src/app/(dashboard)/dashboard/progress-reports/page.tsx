"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Plus,
  Loader2,
  RefreshCw,
  Download,
  Share2,
  Trash2,
  Eye,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";

interface ProgressReport {
  id: string;
  title: string;
  beneficiaryId: string;
  periodStart: string;
  periodEnd: string;
  includePhotos: boolean;
  includeHealth: boolean;
  includeEducation: boolean;
  includeUpdates: boolean;
  status: string;
  reportData: any;
  sharedAt: string | null;
  sharedTo: string[];
  createdAt: string;
  beneficiary: { fullName: string; code: string; homeType: string; photoUrl?: string };
  generatedBy: { name: string };
}

interface BeneficiarySearchResult {
  id: string;
  fullName: string;
  code: string;
  homeType: string;
}

export default function ProgressReportsPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const userRole = user?.role;

  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genTitle, setGenTitle] = useState("");
  const [genStart, setGenStart] = useState("");
  const [genEnd, setGenEnd] = useState("");
  const [genIncludePhotos, setGenIncludePhotos] = useState(true);
  const [genIncludeHealth, setGenIncludeHealth] = useState(true);
  const [genIncludeEducation, setGenIncludeEducation] = useState(true);
  const [genIncludeUpdates, setGenIncludeUpdates] = useState(true);

  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [beneficiaryResults, setBeneficiaryResults] = useState<BeneficiarySearchResult[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiarySearchResult | null>(null);
  const [searchingBeneficiaries, setSearchingBeneficiaries] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<ProgressReport | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareReportId, setShareReportId] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!canAccessModule(userRole, "progressReports")) {
    return <AccessDenied />;
  }

  const canGenerate = hasPermission(userRole, "progressReports", "generate");
  const canShare = hasPermission(userRole, "progressReports", "share");
  const canDelete = hasPermission(userRole, "progressReports", "delete");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      const res = await fetchWithAuth(`/api/beneficiary-progress-reports?${params}`);
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
  }, [page]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const searchBeneficiaries = useCallback(async (q: string) => {
    if (q.length < 2) { setBeneficiaryResults([]); return; }
    setSearchingBeneficiaries(true);
    try {
      const res = await fetchWithAuth(`/api/beneficiary-progress-reports/search-beneficiaries?q=${encodeURIComponent(q)}`);
      if (res.ok) setBeneficiaryResults(await res.json());
    } catch { /* ignore */ }
    finally { setSearchingBeneficiaries(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchBeneficiaries(beneficiarySearch), 300);
    return () => clearTimeout(t);
  }, [beneficiarySearch, searchBeneficiaries]);

  const handleGenerate = async () => {
    if (!selectedBeneficiary || !genStart || !genEnd) {
      toast({ title: "Please select a beneficiary and date range", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetchWithAuth("/api/beneficiary-progress-reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryId: selectedBeneficiary.id,
          title: genTitle || undefined,
          periodStart: genStart,
          periodEnd: genEnd,
          includePhotos: genIncludePhotos,
          includeHealth: genIncludeHealth,
          includeEducation: genIncludeEducation,
          includeUpdates: genIncludeUpdates,
        }),
      });
      if (res.ok) {
        toast({ title: "Progress report generated successfully" });
        setGenerateOpen(false);
        resetGenerateForm();
        loadReports();
      } else {
        const err = await res.json();
        toast({ title: err.message || "Failed to generate report", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to generate report", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const resetGenerateForm = () => {
    setGenTitle("");
    setGenStart("");
    setGenEnd("");
    setGenIncludePhotos(true);
    setGenIncludeHealth(true);
    setGenIncludeEducation(true);
    setGenIncludeUpdates(true);
    setSelectedBeneficiary(null);
    setBeneficiarySearch("");
    setBeneficiaryResults([]);
  };

  const handlePreview = async (id: string) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const res = await fetchWithAuth(`/api/beneficiary-progress-reports/${id}`);
      if (res.ok) {
        setPreviewReport(await res.json());
      }
    } catch {
      toast({ title: "Failed to load report", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (id: string) => {
    setDownloading(id);
    try {
      const res = await fetchWithAuth(`/api/beneficiary-progress-reports/${id}/download/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `progress-report-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "PDF downloaded" });
      } else {
        toast({ title: "Failed to download PDF", variant: "destructive" });
      }
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setDownloading(null);
    }
  };

  const handleShareSponsors = async () => {
    if (!shareReportId) return;
    setSharing(true);
    try {
      const res = await fetchWithAuth(`/api/beneficiary-progress-reports/${shareReportId}/share-sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `Report shared with ${data.sharedCount} sponsor(s)` });
        setShareOpen(false);
        loadReports();
      } else {
        const err = await res.json();
        toast({ title: err.message || "Failed to share", variant: "destructive" });
      }
    } catch {
      toast({ title: "Share failed", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this progress report?")) return;
    setDeleting(id);
    try {
      const res = await fetchWithAuth(`/api/beneficiary-progress-reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Report deleted" });
        loadReports();
      } else {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtPeriod = (s: string, e: string) => `${fmtDate(s)} - ${fmtDate(e)}`;

  const statusVariant = (s: string) => {
    switch (s) {
      case "READY": return "default";
      case "SHARED": return "secondary";
      case "GENERATING": return "outline";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const formatHomeType = (ht: string) => ht.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const reportData = previewReport?.reportData;

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="progress-reports-page">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Beneficiary Progress Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and share beneficiary progress reports with sponsors</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReports} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          {canGenerate && (
            <Button size="sm" onClick={() => setGenerateOpen(true)} data-testid="button-generate-report">
              <Plus className="w-4 h-4 mr-1" /> Generate Report
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No progress reports found. Generate your first report.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow key={r.id} data-testid={`row-report-${r.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{r.beneficiary.fullName}</div>
                        <div className="text-xs text-muted-foreground">{r.beneficiary.code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.title}</TableCell>
                    <TableCell className="text-sm">{fmtPeriod(r.periodStart, r.periodEnd)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.includeHealth && <Badge variant="outline" className="text-xs">Health</Badge>}
                        {r.includeEducation && <Badge variant="outline" className="text-xs">Education</Badge>}
                        {r.includeUpdates && <Badge variant="outline" className="text-xs">Updates</Badge>}
                        {r.includePhotos && <Badge variant="outline" className="text-xs">Photos</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(r.status) as any} data-testid={`badge-status-${r.id}`}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handlePreview(r.id)}
                          data-testid={`button-preview-${r.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(r.status === "READY" || r.status === "SHARED") && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDownload(r.id)}
                              disabled={downloading === r.id}
                              data-testid={`button-download-${r.id}`}
                            >
                              {downloading === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </Button>
                            {canShare && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => { setShareReportId(r.id); setShareOpen(true); }}
                                data-testid={`button-share-${r.id}`}
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(r.id)}
                            disabled={deleting === r.id}
                            data-testid={`button-delete-${r.id}`}
                          >
                            {deleting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
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
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} report{total !== 1 ? "s" : ""} total
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={generateOpen} onOpenChange={(o) => { if (!o) resetGenerateForm(); setGenerateOpen(o); }}>
        <DialogContent className="max-w-lg" data-testid="dialog-generate">
          <DialogHeader>
            <DialogTitle>Generate Progress Report</DialogTitle>
            <DialogDescription>Create a comprehensive progress report for a beneficiary</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Beneficiary *</Label>
              <div className="relative">
                <Input
                  placeholder="Search by name or code..."
                  value={selectedBeneficiary ? `${selectedBeneficiary.fullName} (${selectedBeneficiary.code})` : beneficiarySearch}
                  onChange={(e) => {
                    if (selectedBeneficiary) {
                      setSelectedBeneficiary(null);
                    }
                    setBeneficiarySearch(e.target.value);
                  }}
                  data-testid="input-beneficiary-search"
                />
                {searchingBeneficiaries && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-2.5" />}
                {selectedBeneficiary && (
                  <button className="absolute right-3 top-2.5" onClick={() => { setSelectedBeneficiary(null); setBeneficiarySearch(""); }}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              {beneficiaryResults.length > 0 && !selectedBeneficiary && (
                <Card className="mt-1">
                  <CardContent className="p-1">
                    {beneficiaryResults.map((b) => (
                      <button
                        key={b.id}
                        className="w-full text-left px-3 py-2 text-sm hover-elevate rounded-md"
                        onClick={() => { setSelectedBeneficiary(b); setBeneficiaryResults([]); setBeneficiarySearch(""); }}
                        data-testid={`option-beneficiary-${b.id}`}
                      >
                        <div className="font-medium">{b.fullName}</div>
                        <div className="text-xs text-muted-foreground">{b.code} - {formatHomeType(b.homeType)}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Label htmlFor="gen-title">Title (optional)</Label>
              <Input
                id="gen-title"
                placeholder="Auto-generated if left empty"
                value={genTitle}
                onChange={(e) => setGenTitle(e.target.value)}
                data-testid="input-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gen-start">Period Start *</Label>
                <Input
                  id="gen-start"
                  type="date"
                  value={genStart}
                  onChange={(e) => setGenStart(e.target.value)}
                  data-testid="input-start"
                />
              </div>
              <div>
                <Label htmlFor="gen-end">Period End *</Label>
                <Input
                  id="gen-end"
                  type="date"
                  value={genEnd}
                  onChange={(e) => setGenEnd(e.target.value)}
                  data-testid="input-end"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Include Sections</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sw-health" className="text-sm cursor-pointer">Health & Wellbeing</Label>
                  <Switch id="sw-health" checked={genIncludeHealth} onCheckedChange={setGenIncludeHealth} data-testid="switch-health" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sw-education" className="text-sm cursor-pointer">Academic Progress</Label>
                  <Switch id="sw-education" checked={genIncludeEducation} onCheckedChange={setGenIncludeEducation} data-testid="switch-education" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sw-updates" className="text-sm cursor-pointer">Updates & Milestones</Label>
                  <Switch id="sw-updates" checked={genIncludeUpdates} onCheckedChange={setGenIncludeUpdates} data-testid="switch-updates" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sw-photos" className="text-sm cursor-pointer">Include Photos</Label>
                  <Switch id="sw-photos" checked={genIncludePhotos} onCheckedChange={setGenIncludePhotos} data-testid="switch-photos" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetGenerateForm(); setGenerateOpen(false); }}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating || !selectedBeneficiary || !genStart || !genEnd} data-testid="button-confirm-generate">
              {generating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</> : "Generate Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-preview">
          <DialogHeader>
            <DialogTitle>{previewReport?.title || "Report Preview"}</DialogTitle>
            <DialogDescription>
              {previewReport?.beneficiary?.fullName} ({previewReport?.beneficiary?.code})
            </DialogDescription>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : reportData ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Beneficiary Profile</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Name:</strong> {reportData.beneficiary?.fullName}</p>
                  <p><strong>Code:</strong> {reportData.beneficiary?.code}</p>
                  <p><strong>Home:</strong> {formatHomeType(reportData.beneficiary?.homeType || "")}</p>
                  {reportData.beneficiary?.gender && <p><strong>Gender:</strong> {reportData.beneficiary.gender}</p>}
                  {reportData.beneficiary?.approxAge && <p><strong>Approx Age:</strong> {reportData.beneficiary.approxAge}</p>}
                  {reportData.beneficiary?.educationClassOrRole && <p><strong>Class/Role:</strong> {reportData.beneficiary.educationClassOrRole}</p>}
                  {reportData.beneficiary?.schoolOrCollege && <p><strong>School:</strong> {reportData.beneficiary.schoolOrCollege}</p>}
                  <p><strong>Period:</strong> {reportData.period?.label}</p>
                </CardContent>
              </Card>

              {reportData.healthMetrics?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Health Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Height (cm)</TableHead>
                          <TableHead>Weight (kg)</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.healthMetrics.map((m: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{fmtDate(m.date)}</TableCell>
                            <TableCell>{m.heightCm || "-"}</TableCell>
                            <TableCell>{m.weightKg || "-"}</TableCell>
                            <TableCell>{m.healthStatus}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {reportData.healthEvents?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Health Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {reportData.healthEvents.map((e: any, i: number) => (
                      <div key={i} className="border-l-2 pl-3 py-1" style={{ borderColor: e.severity === "CRITICAL" ? "#e53e3e" : e.severity === "HIGH" ? "#dd6b20" : e.severity === "MEDIUM" ? "#d69e2e" : "#38a169" }}>
                        <div className="font-medium text-sm">{fmtDate(e.date)} - {e.title}</div>
                        <div className="text-sm text-muted-foreground">{e.description}</div>
                        <Badge variant="outline" className="text-xs mt-1">{e.severity}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {reportData.progressCards?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Academic Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>%</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.progressCards.map((p: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell>{p.academicYear}</TableCell>
                            <TableCell>{p.term?.replace("_", " ")}</TableCell>
                            <TableCell>{p.classGrade}</TableCell>
                            <TableCell>{p.percentage != null ? `${p.percentage}%` : "-"}</TableCell>
                            <TableCell>{p.remarks || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {reportData.updates?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Updates & Milestones ({reportData.updates.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reportData.updates.map((u: any, i: number) => (
                      <div key={i} className="border-b pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{u.title}</span>
                          <Badge variant="outline" className="text-xs">{u.type}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{fmtDate(u.date)}</div>
                        <p className="text-sm mt-1">{u.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {reportData.sponsors?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Active Sponsors ({reportData.sponsors.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {reportData.sponsors.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{s.name}</span>
                          <span className="text-muted-foreground">({s.code})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No report data available</p>
          )}
          <DialogFooter>
            {previewReport && (previewReport.status === "READY" || previewReport.status === "SHARED") && (
              <Button size="sm" onClick={() => handleDownload(previewReport.id)}>
                <Download className="w-4 h-4 mr-1" /> Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent data-testid="dialog-share">
          <DialogHeader>
            <DialogTitle>Share with Sponsors</DialogTitle>
            <DialogDescription>
              This will send the progress report via email to all active sponsors of this beneficiary.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              An email notification will be queued for each active sponsor with an email address on file.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>Cancel</Button>
            <Button onClick={handleShareSponsors} disabled={sharing} data-testid="button-confirm-share">
              {sharing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Sharing...</> : <><Share2 className="w-4 h-4 mr-1" /> Share with Sponsors</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
