"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Radio,
  Users,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Eye,
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";
import { BroadcastFilters, PreviewResult, SendResult, WhatsAppTemplate, EmailTemplate, StaffMember } from "./_components/types";
import { SUPPORT_PREFERENCES, DEFAULT_FILTERS } from "./_components/helpers";
import { ConfirmDialog } from "./_components/ConfirmDialog";

export default function BroadcastingPage() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const [channel, setChannel] = useState<"WHATSAPP" | "EMAIL" | null>(null);
  const [filters, setFilters] = useState<BroadcastFilters>({ ...DEFAULT_FILTERS });
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const [selectedWaTemplate, setSelectedWaTemplate] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetailsExpanded, setShowDetailsExpanded] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const u = authStorage.getUser();
    setUser(u);
  }, []);

  const hasAccess =
    user?.role === "ADMIN" ||
    user?.role === "MANAGER" ||
    canAccessModule(user?.role, "broadcasting");

  const fetchAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = authStorage.getAccessToken();
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
    },
    []
  );

  const loadStaffList = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await fetchAuth("/api/broadcasting/staff-list");
      if (res.ok) setStaffList(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setStaffLoading(false);
    }
  }, [fetchAuth]);

  const loadTemplates = useCallback(async () => {
    if (!channel) return;
    setTemplatesLoading(true);
    try {
      if (channel === "WHATSAPP") {
        const res = await fetchAuth("/api/broadcasting/whatsapp-templates");
        if (res.ok) setWhatsappTemplates(await res.json());
      } else {
        const res = await fetchAuth("/api/broadcasting/email-templates");
        if (res.ok) setEmailTemplates(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTemplatesLoading(false);
    }
  }, [channel, fetchAuth]);

  useEffect(() => {
    if (mounted && hasAccess) loadStaffList();
  }, [mounted, hasAccess, loadStaffList]);

  useEffect(() => {
    if (channel) loadTemplates();
  }, [channel, loadTemplates]);

  const handlePreview = async () => {
    if (!channel) {
      toast({ title: "Select Channel", description: "Please select a channel first", variant: "destructive" });
      return;
    }
    setPreviewLoading(true);
    setPreviewResult(null);
    try {
      const cleanFilters = { ...filters };
      if (!cleanFilters.supportPreferences?.length) delete cleanFilters.supportPreferences;
      Object.keys(cleanFilters).forEach((key) => {
        const val = (cleanFilters as any)[key];
        if (val === "" || val === undefined) delete (cleanFilters as any)[key];
      });

      const res = await fetchAuth("/api/broadcasting/preview", {
        method: "POST",
        body: JSON.stringify({ filters: cleanFilters, channel }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewResult(data);
        toast({ title: "Preview Ready", description: `${data.total} donor(s) matched` });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Preview Failed", description: err.message || "Could not preview audience", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    setShowConfirmDialog(false);
    setSendLoading(true);
    setSendResult(null);
    try {
      const cleanFilters = { ...filters };
      if (!cleanFilters.supportPreferences?.length) delete cleanFilters.supportPreferences;
      Object.keys(cleanFilters).forEach((key) => {
        const val = (cleanFilters as any)[key];
        if (val === "" || val === undefined) delete (cleanFilters as any)[key];
      });

      const body: any = { channel, filters: cleanFilters };
      if (channel === "WHATSAPP") {
        const tpl = whatsappTemplates.find((t) => t.contentSid === selectedWaTemplate);
        if (!tpl) {
          toast({ title: "Error", description: "Please select a WhatsApp template", variant: "destructive" });
          setSendLoading(false);
          return;
        }
        body.contentSid = tpl.contentSid;
      } else {
        if (!emailSubject.trim() || !emailBody.trim()) {
          toast({ title: "Error", description: "Email subject and body are required", variant: "destructive" });
          setSendLoading(false);
          return;
        }
        body.emailSubject = emailSubject;
        body.emailBody = emailBody;
      }

      const res = await fetchAuth("/api/broadcasting/send", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data: SendResult = await res.json();
        setSendResult(data);
        toast({
          title: "Broadcast Complete",
          description: `Sent: ${data.sent}, Failed: ${data.failed}, Skipped: ${data.skipped}`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Send Failed", description: err.message || "Could not send broadcast", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSendLoading(false);
    }
  };

  const updateFilter = (key: keyof BroadcastFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPreviewResult(null);
  };

  const toggleSupportPref = (pref: string) => {
    setFilters((prev) => {
      const current = prev.supportPreferences || [];
      const updated = current.includes(pref)
        ? current.filter((p) => p !== pref)
        : [...current, pref];
      return { ...prev, supportPreferences: updated };
    });
    setPreviewResult(null);
  };

  const handleEmailTemplateSelect = (templateId: string) => {
    const tpl = emailTemplates.find((t) => t.id === templateId);
    if (tpl) {
      setEmailSubject(tpl.emailSubject || "");
      setEmailBody(tpl.emailBody || "");
    }
  };

  const selectedWaTpl = whatsappTemplates.find((t) => t.contentSid === selectedWaTemplate);

  const canSend =
    channel &&
    previewResult &&
    previewResult.reachable > 0 &&
    (channel === "WHATSAPP" ? !!selectedWaTemplate : !!(emailSubject.trim() && emailBody.trim()));

  if (!mounted) return null;
  if (user && !hasAccess) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Radio className="h-6 w-6" />
            Broadcasting
          </h1>
          <p className="text-muted-foreground">
            Send targeted messages to donor groups via WhatsApp or Email
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Step 1: Select Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setChannel("WHATSAPP");
                setSendResult(null);
                setPreviewResult(null);
                setSelectedWaTemplate("");
              }}
              className={`flex items-center gap-4 p-4 rounded-md border-2 transition-colors ${
                channel === "WHATSAPP"
                  ? "border-green-500 bg-green-500/10"
                  : "border-border"
              }`}
              data-testid="button-channel-whatsapp"
            >
              <SiWhatsapp className="h-8 w-8 text-green-500" />
              <div className="text-left">
                <div className="font-semibold">WhatsApp</div>
                <div className="text-sm text-muted-foreground">Send via approved templates</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setChannel("EMAIL");
                setSendResult(null);
                setPreviewResult(null);
                setEmailSubject("");
                setEmailBody("");
              }}
              className={`flex items-center gap-4 p-4 rounded-md border-2 transition-colors ${
                channel === "EMAIL"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border"
              }`}
              data-testid="button-channel-email"
            >
              <Mail className="h-8 w-8 text-blue-500" />
              <div className="text-left">
                <div className="font-semibold">Email</div>
                <div className="text-sm text-muted-foreground">Send custom HTML emails</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          className="cursor-pointer flex flex-row items-center justify-between gap-2"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Step 2: Audience Filters
          </CardTitle>
          <Button variant="ghost" size="icon" data-testid="button-toggle-filters">
            {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>
        {filtersOpen && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={filters.gender || ""}
                  onValueChange={(v) => updateFilter("gender", v || undefined)}
                >
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category || ""}
                  onValueChange={(v) => updateFilter("category", v || undefined)}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                    <SelectItem value="ORGANIZATION">Organization</SelectItem>
                    <SelectItem value="TRUST">Trust</SelectItem>
                    <SelectItem value="TEMPLE">Temple</SelectItem>
                    <SelectItem value="ANONYMOUS">Anonymous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  placeholder="e.g. Bangalore"
                  value={filters.city || ""}
                  onChange={(e) => updateFilter("city", e.target.value || undefined)}
                  data-testid="input-city"
                />
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  placeholder="e.g. India"
                  value={filters.country || ""}
                  onChange={(e) => updateFilter("country", e.target.value || undefined)}
                  data-testid="input-country"
                />
              </div>

              <div className="space-y-2">
                <Label>Religion</Label>
                <Input
                  placeholder="e.g. Hindu"
                  value={filters.religion || ""}
                  onChange={(e) => updateFilter("religion", e.target.value || undefined)}
                  data-testid="input-religion"
                />
              </div>

              <div className="space-y-2">
                <Label>Engagement Level</Label>
                <Select
                  value={filters.engagementLevel || ""}
                  onValueChange={(v) => updateFilter("engagementLevel", v || undefined)}
                >
                  <SelectTrigger data-testid="select-engagement">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOT">Hot</SelectItem>
                    <SelectItem value="WARM">Warm</SelectItem>
                    <SelectItem value="COLD">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Donation Frequency</Label>
                <Select
                  value={filters.donationFrequency || ""}
                  onValueChange={(v) => updateFilter("donationFrequency", v || undefined)}
                >
                  <SelectTrigger data-testid="select-frequency">
                    <SelectValue placeholder="All frequencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONE_TIME">One-Time</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="HALF_YEARLY">Half-Yearly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned Staff</Label>
                <Select
                  value={filters.assignedToUserId || ""}
                  onValueChange={(v) => updateFilter("assignedToUserId", v || undefined)}
                >
                  <SelectTrigger data-testid="select-staff">
                    <SelectValue placeholder={staffLoading ? "Loading..." : "All staff"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Age Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.ageMin ?? ""}
                    onChange={(e) =>
                      updateFilter("ageMin", e.target.value ? Number(e.target.value) : undefined)
                    }
                    data-testid="input-age-min"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.ageMax ?? ""}
                    onChange={(e) =>
                      updateFilter("ageMax", e.target.value ? Number(e.target.value) : undefined)
                    }
                    data-testid="input-age-max"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Support Preferences</Label>
              <div className="flex flex-wrap gap-4">
                {SUPPORT_PREFERENCES.map((pref) => (
                  <label key={pref} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(filters.supportPreferences || []).includes(pref)}
                      onCheckedChange={() => toggleSupportPref(pref)}
                      data-testid={`checkbox-pref-${pref.toLowerCase()}`}
                    />
                    <span className="text-sm">{pref.charAt(0) + pref.slice(1).toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={handlePreview} disabled={!channel || previewLoading} data-testid="button-preview">
                {previewLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Preview Audience
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ ...DEFAULT_FILTERS });
                  setPreviewResult(null);
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>

            {previewResult && (
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold" data-testid="text-preview-total">
                        {previewResult.total}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" /> Total Donors
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600" data-testid="text-preview-reachable">
                        {previewResult.reachable}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" /> Reachable
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600" data-testid="text-preview-unreachable">
                        {previewResult.unreachable}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <XCircle className="h-3 w-3 text-red-600" /> Unreachable
                      </div>
                    </div>
                  </div>
                  {previewResult.sampleDonors.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2 text-muted-foreground">
                        Sample Donors (up to 10)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previewResult.sampleDonors.map((d) => (
                          <Badge key={d.id} variant="secondary">
                            {d.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>

      {channel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {channel === "WHATSAPP" ? (
                <SiWhatsapp className="h-5 w-5 text-green-500" />
              ) : (
                <Mail className="h-5 w-5 text-blue-500" />
              )}
              Step 3: Message Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : channel === "WHATSAPP" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>WhatsApp Template</Label>
                  <Select
                    value={selectedWaTemplate}
                    onValueChange={setSelectedWaTemplate}
                  >
                    <SelectTrigger data-testid="select-wa-template">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsappTemplates.map((t) => (
                        <SelectItem key={t.contentSid} value={t.contentSid}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedWaTpl && (
                  <div className="rounded-md bg-muted p-3 text-sm" data-testid="text-wa-template-desc">
                    <div className="font-medium mb-1">{selectedWaTpl.name}</div>
                    <div className="text-muted-foreground">{selectedWaTpl.description}</div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {"Variable {{1}} will be auto-filled with the donor's name."}
                  </span>
                </div>
                {whatsappTemplates.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No WhatsApp templates available. Please configure templates in Twilio first.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {emailTemplates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Load from Template (optional)</Label>
                    <Select onValueChange={handleEmailTemplateSelect}>
                      <SelectTrigger data-testid="select-email-template">
                        <SelectValue placeholder="Start from a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject line"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    data-testid="input-email-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body (HTML supported)</Label>
                  <Textarea
                    placeholder="Compose your email body here..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    data-testid="input-email-body"
                  />
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {"Available placeholders: {{donorName}}, {{date}}"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {channel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" />
              Step 4: Review & Send
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Channel</div>
                <div className="font-medium flex items-center gap-2" data-testid="text-review-channel">
                  {channel === "WHATSAPP" ? (
                    <>
                      <SiWhatsapp className="h-4 w-4 text-green-500" /> WhatsApp
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 text-blue-500" /> Email
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Audience</div>
                <div className="font-medium" data-testid="text-review-audience">
                  {previewResult ? `${previewResult.reachable} reachable of ${previewResult.total}` : "Not previewed yet"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Template</div>
                <div className="font-medium" data-testid="text-review-template">
                  {channel === "WHATSAPP"
                    ? selectedWaTpl?.name || "None selected"
                    : emailSubject
                    ? emailSubject
                    : "Not configured"}
                </div>
              </div>
            </div>

            {!previewResult && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 rounded-md p-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Please preview your audience before sending.
              </div>
            )}

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!canSend || sendLoading}
              data-testid="button-send-broadcast"
            >
              {sendLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Broadcast
            </Button>

            {sendResult && (
              <div className="space-y-4 pt-4 border-t">
                <div className="text-lg font-semibold">Broadcast Results</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold" data-testid="text-result-total">{sendResult.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600" data-testid="text-result-sent">{sendResult.sent}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" /> Sent
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600" data-testid="text-result-failed">{sendResult.failed}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <XCircle className="h-3 w-3 text-red-600" /> Failed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600" data-testid="text-result-skipped">{sendResult.skipped}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" /> Skipped
                    </div>
                  </div>
                </div>

                {sendResult.details.length > 0 && (
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
                      data-testid="button-toggle-details"
                    >
                      {showDetailsExpanded ? (
                        <ChevronUp className="mr-2 h-4 w-4" />
                      ) : (
                        <ChevronDown className="mr-2 h-4 w-4" />
                      )}
                      {showDetailsExpanded ? "Hide Details" : "Show Details"} ({sendResult.details.length})
                    </Button>

                    {showDetailsExpanded && (
                      <div className="rounded-md border mt-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Donor</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sendResult.details.map((d, i) => (
                              <TableRow key={`${d.donorId}-${i}`} data-testid={`row-detail-${d.donorId}`}>
                                <TableCell className="font-medium">{d.donorName}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      d.status === "sent"
                                        ? "default"
                                        : d.status === "failed"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {d.status === "sent" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                    {d.status === "failed" && <XCircle className="mr-1 h-3 w-3" />}
                                    {d.status === "skipped" && <AlertTriangle className="mr-1 h-3 w-3" />}
                                    {d.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {d.error || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        channel={channel}
        reachable={previewResult?.reachable || 0}
        onConfirm={handleSend}
      />
    </div>
  );
}
