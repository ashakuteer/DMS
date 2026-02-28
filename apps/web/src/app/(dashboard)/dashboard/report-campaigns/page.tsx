"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Plus,
  Send,
  Loader2,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  Upload,
  Copy,
  Check,
  Clock,
  X,
  Search,
  UserPlus,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { format } from "date-fns";

interface ReportCampaign {
  id: string;
  name: string;
  type: "QUARTERLY" | "ANNUAL" | "AUDIT" | "EVENT";
  periodStart: string;
  periodEnd: string;
  target: string;
  customDonorIds: string[];
  notes?: string;
  status: string;
  emailsSent: number;
  sentAt?: string;
  documentId?: string;
  createdAt: string;
  createdBy: { id: string; name: string };
  document?: { id: string; title: string; storagePath: string; mimeType: string };
}

interface DonorOption {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  personalEmail?: string;
  officialEmail?: string;
}

const typeLabels: Record<string, string> = {
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
  AUDIT: "Audit",
  EVENT: "Event",
};

const typeColors: Record<string, string> = {
  QUARTERLY: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ANNUAL: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  AUDIT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  EVENT: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

export default function ReportCampaignsPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const [campaigns, setCampaigns] = useState<ReportCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [whatsappDialog, setWhatsappDialog] = useState<{ campaignId: string; text: string; reportUrl: string } | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "QUARTERLY" as "QUARTERLY" | "ANNUAL" | "AUDIT" | "EVENT",
    periodStart: "",
    periodEnd: "",
    target: "ALL_DONORS",
    notes: "",
    customDonorIds: [] as string[],
  });

  const [donorSearch, setDonorSearch] = useState("");
  const [donorResults, setDonorResults] = useState<DonorOption[]>([]);
  const [selectedDonors, setSelectedDonors] = useState<DonorOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/report-campaigns");
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (donorSearch.length < 2) {
      setDonorResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetchWithAuth(`/api/report-campaigns/search-donors?q=${encodeURIComponent(donorSearch)}`);
        if (response.ok) {
          const results = await response.json();
          setDonorResults(results.filter((d: DonorOption) => !selectedDonors.some((s) => s.id === d.id)));
        }
      } catch (error) {
        console.error("Error searching donors:", error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [donorSearch, selectedDonors]);

  if (user && !canAccessModule(user?.role, 'reportCampaigns')) return <AccessDenied />;

  const handleCreate = async () => {
    if (!newCampaign.name || !newCampaign.periodStart || !newCampaign.periodEnd) {
      toast({
        title: "Missing Fields",
        description: "Please fill in name, period start, and period end",
        variant: "destructive",
      });
      return;
    }

    if (newCampaign.target === "CUSTOM" && selectedDonors.length === 0) {
      toast({
        title: "No Donors Selected",
        description: "Please select at least one donor for custom audience",
        variant: "destructive",
      });
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        ...newCampaign,
        customDonorIds: newCampaign.target === "CUSTOM" ? selectedDonors.map((d) => d.id) : [],
      };
      const response = await fetchWithAuth("/api/report-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast({ title: "Campaign Created", description: "Report campaign created successfully" });
        setShowCreateDialog(false);
        setNewCampaign({ name: "", type: "QUARTERLY", periodStart: "", periodEnd: "", target: "ALL_DONORS", notes: "", customDonorIds: [] });
        setSelectedDonors([]);
        setDonorSearch("");
        fetchCampaigns();
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.message || "Failed to create campaign", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFileUpload = async (campaignId: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid File", description: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    setUploadingId(campaignId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);

      const response = await fetchWithAuth(`/api/report-campaigns/${campaignId}/attach-document`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({ title: "Document Attached", description: "Report PDF attached successfully" });
        fetchCampaigns();
      } else {
        const err = await response.json();
        toast({ title: "Upload Failed", description: err.message || "Failed to upload document", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload document", variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  const handleSend = async (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign && !campaign.documentId) {
      toast({ title: "No Document", description: "Please attach a report PDF before sending", variant: "destructive" });
      return;
    }

    setSendingId(campaignId);
    try {
      const response = await fetchWithAuth(`/api/report-campaigns/${campaignId}/send`, {
        method: "POST",
      });
      if (response.ok) {
        const result = await response.json();
        toast({ title: "Emails Queued", description: result.message || "Report emails queued successfully" });
        fetchCampaigns();
      } else {
        const err = await response.json();
        toast({ title: "Error", description: err.message || "Failed to send emails", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send emails", variant: "destructive" });
    } finally {
      setSendingId(null);
    }
  };

  const handleWhatsAppCopy = async (campaignId: string) => {
    try {
      const response = await fetchWithAuth(`/api/report-campaigns/${campaignId}/whatsapp-text`);
      if (response.ok) {
        const data = await response.json();
        setWhatsappDialog({ campaignId, text: data.text, reportUrl: data.reportUrl });
      } else {
        toast({ title: "Error", description: "Failed to generate WhatsApp text", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate WhatsApp text", variant: "destructive" });
    }
  };

  const copyWhatsAppText = async () => {
    if (!whatsappDialog) return;
    try {
      await navigator.clipboard.writeText(whatsappDialog.text);
      setCopiedWhatsApp(true);
      toast({ title: "Copied", description: "WhatsApp message copied to clipboard" });
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy text", variant: "destructive" });
    }
  };

  const addDonor = (donor: DonorOption) => {
    setSelectedDonors((prev) => [...prev, donor]);
    setDonorResults((prev) => prev.filter((d) => d.id !== donor.id));
    setDonorSearch("");
  };

  const removeDonor = (donorId: string) => {
    setSelectedDonors((prev) => prev.filter((d) => d.id !== donorId));
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case "DRAFT":
        return <Badge variant="outline" data-testid="badge-status-draft">Draft</Badge>;
      case "QUEUED":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" data-testid="badge-status-queued">Queued</Badge>;
      case "SENT":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" data-testid="badge-status-sent">Sent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getTargetLabel(target: string, customCount?: number) {
    switch (target) {
      case "ALL_DONORS": return "All Donors";
      case "SPONSORS_ONLY": return "Sponsors Only";
      case "CUSTOM": return `Custom (${customCount || 0} donor${(customCount || 0) !== 1 ? "s" : ""})`;
      default: return target;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Megaphone className="h-6 w-6" />
            Report Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload and distribute reports to donors via email and WhatsApp
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-campaign">
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Megaphone className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No report campaigns yet</p>
            <p className="text-sm text-muted-foreground">Create your first campaign to share reports with donors</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sent Reports History</CardTitle>
              <CardDescription>Track all reports distributed to donors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} data-testid={`row-campaign-${campaign.id}`}>
                        <TableCell>
                          <div className="font-medium">{campaign.name}</div>
                          {campaign.document && (
                            <a
                              href={campaign.document.storagePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs hover:underline flex items-center gap-1 mt-0.5"
                              data-testid={`link-view-doc-${campaign.id}`}
                            >
                              <FileText className="h-3 w-3" />
                              {campaign.document.title}
                            </a>
                          )}
                          {campaign.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{campaign.notes}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColors[campaign.type] || ""}>
                            {typeLabels[campaign.type] || campaign.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(campaign.periodStart), "MMM yyyy")} - {format(new Date(campaign.periodEnd), "MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getTargetLabel(campaign.target, campaign.customDonorIds?.length)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            {getStatusBadge(campaign.status)}
                            {campaign.emailsSent > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {campaign.emailsSent} email{campaign.emailsSent !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {campaign.sentAt
                            ? format(new Date(campaign.sentAt), "MMM d, yyyy h:mm a")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            {campaign.status === "DRAFT" && !campaign.documentId && (
                              <>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  ref={(el) => { fileInputRefs.current[campaign.id] = el; }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(campaign.id, file);
                                    e.target.value = "";
                                  }}
                                  data-testid={`input-file-${campaign.id}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRefs.current[campaign.id]?.click()}
                                  disabled={uploadingId === campaign.id}
                                  data-testid={`button-upload-pdf-${campaign.id}`}
                                >
                                  {uploadingId === campaign.id ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  ) : (
                                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  Upload PDF
                                </Button>
                              </>
                            )}
                            {campaign.status === "DRAFT" && campaign.documentId && (
                              <>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  ref={(el) => { fileInputRefs.current[campaign.id] = el; }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(campaign.id, file);
                                    e.target.value = "";
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWhatsAppCopy(campaign.id)}
                                  data-testid={`button-whatsapp-${campaign.id}`}
                                >
                                  <SiWhatsapp className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                                  WhatsApp
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSend(campaign.id)}
                                  disabled={sendingId === campaign.id}
                                  data-testid={`button-send-campaign-${campaign.id}`}
                                >
                                  {sendingId === campaign.id ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                  ) : (
                                    <Send className="h-3.5 w-3.5 mr-1.5" />
                                  )}
                                  Send Emails
                                </Button>
                              </>
                            )}
                            {campaign.status === "SENT" && campaign.documentId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWhatsAppCopy(campaign.id)}
                                data-testid={`button-whatsapp-sent-${campaign.id}`}
                              >
                                <SiWhatsapp className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); setSelectedDonors([]); setDonorSearch(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              New Report Campaign
            </DialogTitle>
            <DialogDescription>
              Upload a report and distribute it to selected donors
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Q1 2026 Impact Report"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign((prev) => ({ ...prev, name: e.target.value }))}
                data-testid="input-campaign-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select
                  value={newCampaign.type}
                  onValueChange={(v) => setNewCampaign((prev) => ({ ...prev, type: v as any }))}
                >
                  <SelectTrigger data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUARTERLY">Quarterly Report</SelectItem>
                    <SelectItem value="ANNUAL">Annual Report</SelectItem>
                    <SelectItem value="AUDIT">Audit Report</SelectItem>
                    <SelectItem value="EVENT">Event Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={newCampaign.target}
                  onValueChange={(v) => setNewCampaign((prev) => ({ ...prev, target: v }))}
                >
                  <SelectTrigger data-testid="select-campaign-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_DONORS">All Donors</SelectItem>
                    <SelectItem value="SPONSORS_ONLY">Sponsors Only</SelectItem>
                    <SelectItem value="CUSTOM">Custom Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newCampaign.target === "CUSTOM" && (
              <div className="space-y-2">
                <Label>Select Donors</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search donors by name, code, or email..."
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    className="pl-9"
                    data-testid="input-donor-search"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {donorResults.length > 0 && (
                  <div className="rounded-md border max-h-36 overflow-y-auto">
                    {donorResults.map((donor) => (
                      <button
                        key={donor.id}
                        className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover-elevate"
                        onClick={() => addDonor(donor)}
                        data-testid={`button-add-donor-${donor.id}`}
                      >
                        <div>
                          <span className="font-medium">{donor.firstName} {donor.lastName || ""}</span>
                          <span className="text-muted-foreground ml-2">{donor.donorCode}</span>
                        </div>
                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {selectedDonors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedDonors.map((donor) => (
                      <Badge key={donor.id} variant="secondary" className="gap-1 pr-1" data-testid={`badge-donor-${donor.id}`}>
                        {donor.firstName} {donor.lastName || ""} ({donor.donorCode})
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 ml-0.5"
                          onClick={() => removeDonor(donor.id)}
                          data-testid={`button-remove-donor-${donor.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {newCampaign.target === "CUSTOM" && selectedDonors.length === 0 && donorSearch.length === 0 && (
                  <p className="text-xs text-muted-foreground">Start typing to search and add donors</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period From *</Label>
                <Input
                  type="date"
                  value={newCampaign.periodStart}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, periodStart: e.target.value }))}
                  data-testid="input-period-start"
                />
              </div>

              <div className="space-y-2">
                <Label>Period To *</Label>
                <Input
                  type="date"
                  value={newCampaign.periodEnd}
                  onChange={(e) => setNewCampaign((prev) => ({ ...prev, periodEnd: e.target.value }))}
                  data-testid="input-period-end"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any additional notes about this report..."
                value={newCampaign.notes}
                onChange={(e) => setNewCampaign((prev) => ({ ...prev, notes: e.target.value }))}
                className="min-h-[80px]"
                data-testid="input-campaign-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setSelectedDonors([]); setDonorSearch(""); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLoading} data-testid="button-submit-campaign">
              {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!whatsappDialog} onOpenChange={(open) => { if (!open) { setWhatsappDialog(null); setCopiedWhatsApp(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              WhatsApp Message
            </DialogTitle>
            <DialogDescription>
              Copy this message and share it with donors via WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              value={whatsappDialog?.text || ""}
              readOnly
              className="min-h-[200px] text-sm"
              data-testid="textarea-whatsapp-text"
            />
            {whatsappDialog?.reportUrl && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span className="truncate">{whatsappDialog.reportUrl}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setWhatsappDialog(null); setCopiedWhatsApp(false); }}>
              Close
            </Button>
            <Button onClick={copyWhatsAppText} data-testid="button-copy-whatsapp">
              {copiedWhatsApp ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copiedWhatsApp ? "Copied" : "Copy Text"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
