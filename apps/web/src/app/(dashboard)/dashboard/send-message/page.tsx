"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Users, User, ChevronRight, ChevronLeft, MessageSquarePlus, Send, ExternalLink, Mail, Filter, CheckCircle2, Loader2, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { fetchWithAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface Template {
  id: string;
  type: string;
  name: string;
  description: string | null;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
}

interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  primaryPhone?: string;
  whatsappPhone?: string;
  personalEmail?: string;
  officialEmail?: string;
  city?: string;
  gender?: string;
  religion?: string;
  donationFrequency?: string;
  donations?: { donationAmount: string; donationDate: string; receiptNumber?: string }[];
}

function resolvePlaceholders(text: string, donor: Donor): string {
  const name = [donor.firstName, donor.middleName, donor.lastName].filter(Boolean).join(" ") || donor.donorCode;
  const donation = donor.donations?.[0];
  return text
    .replace(/\{\{donor_name\}\}/g, name)
    .replace(/\{\{donorName\}\}/g, name)
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{phone\}\}/g, donor.primaryPhone || "")
    .replace(/\{\{amount\}\}/g, donation?.donationAmount || "")
    .replace(/\{\{date\}\}/g, donation?.donationDate || "")
    .replace(/\{\{receipt\}\}/g, donation?.receiptNumber || "")
    .replace(/\{\{receipt_number\}\}/g, donation?.receiptNumber || "");
}

function getDonorDisplayName(donor: Donor) {
  return [donor.firstName, donor.middleName, donor.lastName].filter(Boolean).join(" ") || donor.donorCode;
}

export default function SendMessagePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const STEPS = [t("send_message.step_template"), t("send_message.step_recipients"), t("send_message.step_preview"), t("send_message.step_send")];
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1: Template
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Step 2: Recipients
  const [recipientMode, setRecipientMode] = useState<"individual" | "group">("individual");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Donor[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDonors, setSelectedDonors] = useState<Donor[]>([]);

  // Group filters
  const [groupCity, setGroupCity] = useState("");
  const [groupGender, setGroupGender] = useState("");
  const [groupReligion, setGroupReligion] = useState("");
  const [groupDonorType, setGroupDonorType] = useState("");
  const [groupResults, setGroupResults] = useState<Donor[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState<Record<string, boolean>>({});

  const handleSendWhatsApp = useCallback(async (donor: Donor, message: string) => {
    const toE164 = donor.whatsappPhone || donor.primaryPhone || "";
    if (!toE164) return;
    setSendingWhatsapp((prev) => ({ ...prev, [donor.id]: true }));
    try {
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId: donor.id, toE164, message, type: "FREEFORM" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send");
      toast({ title: "Sent", description: `WhatsApp message sent to ${donor.firstName}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not send message.", variant: "destructive" });
    } finally {
      setSendingWhatsapp((prev) => ({ ...prev, [donor.id]: false }));
    }
  }, [toast]);

  const selectedTemplate = templates.find((tmpl) => tmpl.id === selectedTemplateId);
  const recipients = recipientMode === "individual" ? selectedDonors : groupResults;

  // Load templates
  useEffect(() => {
    setLoadingTemplates(true);
    fetchWithAuth("/api/templates")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setTemplates(Array.isArray(data) ? data : []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  // Individual search
  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.items || data || []);
      }
    } catch { /* ignore */ }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  // Group filter search
  const doGroupSearch = async () => {
    setLoadingGroup(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (groupCity) params.set("city", groupCity);
      if (groupGender) params.set("gender", groupGender);
      if (groupReligion) params.set("religion", groupReligion);
      if (groupDonorType) params.set("donationFrequency", groupDonorType);
      const res = await fetchWithAuth(`/api/donors?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGroupResults(data.items || data || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load donors", variant: "destructive" });
    } finally {
      setLoadingGroup(false);
    }
  };

  const toggleDonor = (donor: Donor) => {
    setSelectedDonors((prev) =>
      prev.some((d) => d.id === donor.id) ? prev.filter((d) => d.id !== donor.id) : [...prev, donor]
    );
  };

  const canGoNext = () => {
    if (currentStep === 0) return !!selectedTemplateId;
    if (currentStep === 1) return recipients.length > 0;
    return true;
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#E6F4F1] dark:bg-[#5FA8A8]/20 flex items-center justify-center">
          <MessageSquarePlus className="h-5 w-5 text-[#5FA8A8]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("send_message.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("send_message.subtitle")}</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                idx < currentStep
                  ? "text-green-700 dark:text-green-400"
                  : idx === currentStep
                  ? "bg-[#E6F4F1]0 text-white shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {idx < currentStep ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  idx === currentStep ? "border-white bg-[#E6F4F1]0 text-white" : "border-muted-foreground/30"
                }`}>{idx + 1}</span>
              )}
              {step}
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-2 ${idx < currentStep ? "bg-green-400" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {/* ── STEP 1: Select Template ── */}
        {currentStep === 0 && (
          <>
            <CardHeader>
              <CardTitle>{t("send_message.step1_title")}</CardTitle>
              <CardDescription>{t("send_message.step1_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t("send_message.loading_templates")}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>{t("send_message.no_templates")}</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedTemplateId === tmpl.id
                          ? "border-[#5FA8A8] bg-[#E6F4F1] dark:bg-[#5FA8A8]/20"
                          : "border-border hover:border-[#5FA8A8]/60 hover:bg-muted/40"
                      }`}
                      data-testid={`template-option-${tmpl.type.toLowerCase()}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{tmpl.name}</p>
                          {tmpl.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.description}</p>}
                        </div>
                        {selectedTemplateId === tmpl.id && <CheckCircle2 className="h-5 w-5 text-[#5FA8A8] flex-shrink-0 mt-0.5" />}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <Badge variant="outline" className="text-[10px] py-0">
                          <SiWhatsapp className="h-2.5 w-2.5 mr-1 text-green-600" /> WhatsApp
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0">
                          <Mail className="h-2.5 w-2.5 mr-1 text-blue-600" /> Email
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* ── STEP 2: Select Recipients ── */}
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>{t("send_message.step2_title")}</CardTitle>
              <CardDescription>{t("send_message.step2_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={recipientMode} onValueChange={(v) => setRecipientMode(v as "individual" | "group")}>
                <TabsList className="mb-4">
                  <TabsTrigger value="individual" className="gap-1.5">
                    <User className="h-4 w-4" /> {t("send_message.individual")}
                  </TabsTrigger>
                  <TabsTrigger value="group" className="gap-1.5">
                    <Users className="h-4 w-4" /> {t("send_message.group_filter")}
                  </TabsTrigger>
                </TabsList>

                {/* Individual */}
                <TabsContent value="individual" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder={t("send_message.search_donor_placeholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-donor-search"
                    />
                    {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>

                  {selectedDonors.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">{t("send_message.selected_count", { count: selectedDonors.length })}</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedDonors.map((d) => (
                          <Badge key={d.id} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
                            {getDonorDisplayName(d)}
                            <button onClick={() => toggleDonor(d)} className="hover:text-destructive ml-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                      {searchResults.map((d) => {
                        const selected = selectedDonors.some((s) => s.id === d.id);
                        return (
                          <button
                            key={d.id}
                            onClick={() => toggleDonor(d)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors ${selected ? "bg-[#E6F4F1] dark:bg-[#5FA8A8]/20" : ""}`}
                            data-testid={`search-result-${d.donorCode}`}
                          >
                            <div className="h-8 w-8 rounded-full bg-[#E6F4F1] dark:bg-[#5FA8A8]/20 flex items-center justify-center text-[#5FA8A8] dark:text-[#A8D5D1] text-xs font-bold flex-shrink-0">
                              {(d.firstName?.[0] || "D").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{getDonorDisplayName(d)}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {d.donorCode} {d.primaryPhone ? `· ${d.primaryPhone}` : ""} {d.city ? `· ${d.city}` : ""}
                              </p>
                            </div>
                            {selected && <CheckCircle2 className="h-4 w-4 text-[#5FA8A8] flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {searchQuery && !searching && searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">{t("send_message.no_donors_found", { query: searchQuery })}</p>
                  )}
                </TabsContent>

                {/* Group */}
                <TabsContent value="group" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-sm mb-1.5 block">{t("donors.city")}</Label>
                      <Input placeholder="e.g. Hyderabad" value={groupCity} onChange={(e) => setGroupCity(e.target.value)} data-testid="input-group-city" />
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block">{t("donors.gender")}</Label>
                      <Select value={groupGender} onValueChange={setGroupGender}>
                        <SelectTrigger data-testid="select-group-gender">
                          <SelectValue placeholder={t("send_message.any_gender")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">{t("send_message.any")}</SelectItem>
                          <SelectItem value="MALE">{t("common.male")}</SelectItem>
                          <SelectItem value="FEMALE">{t("common.female")}</SelectItem>
                          <SelectItem value="OTHER">{t("common.other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block">{t("donors.religion")}</Label>
                      <Input placeholder="e.g. Hindu, Muslim…" value={groupReligion} onChange={(e) => setGroupReligion(e.target.value)} data-testid="input-group-religion" />
                    </div>
                    <div>
                      <Label className="text-sm mb-1.5 block">{t("send_message.donor_type")}</Label>
                      <Select value={groupDonorType} onValueChange={setGroupDonorType}>
                        <SelectTrigger data-testid="select-group-donortype">
                          <SelectValue placeholder={t("send_message.any_type")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">{t("send_message.any")}</SelectItem>
                          <SelectItem value="MONTHLY">{t("donors.freq_monthly")}</SelectItem>
                          <SelectItem value="ONE_TIME">{t("donors.freq_one_time")}</SelectItem>
                          <SelectItem value="QUARTERLY">{t("donors.freq_quarterly")}</SelectItem>
                          <SelectItem value="ANNUAL">{t("donors.freq_annual")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={doGroupSearch} disabled={loadingGroup} className="gap-2" data-testid="button-apply-group-filter">
                    {loadingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                    {t("send_message.apply_filters")}
                  </Button>

                  {groupResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Label className="text-sm text-muted-foreground">{t("send_message.donors_matched", { count: groupResults.length })}</Label>
                      </div>
                      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                        {groupResults.slice(0, 50).map((d) => (
                          <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                            <div className="h-7 w-7 rounded-full bg-[#E6F4F1] dark:bg-[#5FA8A8]/20 flex items-center justify-center text-[#5FA8A8] dark:text-[#A8D5D1] text-xs font-bold flex-shrink-0">
                              {(d.firstName?.[0] || "D").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium truncate block">{getDonorDisplayName(d)}</span>
                              <span className="text-xs text-muted-foreground">{d.donorCode} {d.city ? `· ${d.city}` : ""}</span>
                            </div>
                            <div className="flex gap-1 text-xs text-muted-foreground">
                              {d.primaryPhone && <Badge variant="outline" className="text-[10px]">Phone</Badge>}
                              {(d.personalEmail || d.officialEmail) && <Badge variant="outline" className="text-[10px]">Email</Badge>}
                            </div>
                          </div>
                        ))}
                        {groupResults.length > 50 && (
                          <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                            {t("send_message.more_donors", { count: groupResults.length - 50 })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </>
        )}

        {/* ── STEP 3: Preview ── */}
        {currentStep === 2 && selectedTemplate && (
          <>
            <CardHeader>
              <CardTitle>{t("send_message.step3_title")}</CardTitle>
              <CardDescription>
                {t("send_message.step3_desc", { count: recipients.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {recipients.length === 0 ? (
                <p className="text-muted-foreground">{t("send_message.no_recipients")}</p>
              ) : (
                recipients.slice(0, 3).map((donor, idx) => (
                  <div key={donor.id} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-[#E6F4F1] dark:bg-[#5FA8A8]/20 flex items-center justify-center text-[#5FA8A8] text-xs font-bold">
                        {(donor.firstName?.[0] || "D").toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">{getDonorDisplayName(donor)}</span>
                      <span className="text-xs text-muted-foreground">{donor.donorCode}</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400 mb-1">
                          <SiWhatsapp className="h-3.5 w-3.5" /> WhatsApp Message
                        </div>
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-xs whitespace-pre-wrap max-h-28 overflow-y-auto text-green-900 dark:text-green-100">
                          {resolvePlaceholders(selectedTemplate.whatsappMessage, donor)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs space-y-1">
                          <p className="font-medium text-blue-900 dark:text-blue-100 truncate">
                            Sub: {resolvePlaceholders(selectedTemplate.emailSubject, donor)}
                          </p>
                          <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap max-h-20 overflow-y-auto">
                            {resolvePlaceholders(selectedTemplate.emailBody, donor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {recipients.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  {t("send_message.showing_3_of", { count: recipients.length })}
                </p>
              )}
            </CardContent>
          </>
        )}

        {/* ── STEP 4: Send ── */}
        {currentStep === 3 && selectedTemplate && (
          <>
            <CardHeader>
              <CardTitle>{t("send_message.step4_title")}</CardTitle>
              <CardDescription>
                {t("send_message.step4_desc", { count: recipients.length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border text-sm">
                <div className="flex-1">
                  <span className="font-medium">{selectedTemplate.name}</span>
                  <span className="text-muted-foreground ml-2">— {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {recipients.map((donor) => {
                  const phone = (donor.whatsappPhone || donor.primaryPhone || "").replace(/\D/g, "");
                  const email = donor.personalEmail || donor.officialEmail || "";
                  const waMessage = resolvePlaceholders(selectedTemplate.whatsappMessage, donor);
                  const emailSubject = resolvePlaceholders(selectedTemplate.emailSubject, donor);
                  const emailBody = resolvePlaceholders(selectedTemplate.emailBody, donor);

                  return (
                    <div key={donor.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
                      <div className="h-8 w-8 rounded-full bg-[#E6F4F1] dark:bg-[#5FA8A8]/20 flex items-center justify-center text-[#5FA8A8] text-sm font-bold flex-shrink-0">
                        {(donor.firstName?.[0] || "D").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getDonorDisplayName(donor)}</p>
                        <p className="text-xs text-muted-foreground">{donor.donorCode} {donor.city ? `· ${donor.city}` : ""}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {phone ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950 gap-1.5"
                            onClick={() => handleSendWhatsApp(donor, waMessage)}
                            disabled={sendingWhatsapp[donor.id]}
                            data-testid={`button-send-whatsapp-${donor.donorCode}`}
                          >
                            {sendingWhatsapp[donor.id]
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <SiWhatsapp className="h-3.5 w-3.5" />
                            }
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled className="text-xs text-muted-foreground">{t("send_message.no_phone")}</Button>
                        )}
                        {email ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => window.open(`mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`, "_blank")}
                            data-testid={`button-send-email-${donor.donorCode}`}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled className="text-xs text-muted-foreground">{t("send_message.no_email")}</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  {t("send_message.send_note")}
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((s) => s - 1)}
          className="gap-2"
          data-testid="button-step-back"
        >
          <ChevronLeft className="h-4 w-4" /> {t("common.back")}
        </Button>

        <div className="flex gap-2">
          {currentStep < STEPS.length - 1 ? (
            <Button
              disabled={!canGoNext()}
              onClick={() => setCurrentStep((s) => s + 1)}
              className="gap-2"
              data-testid="button-step-next"
            >
              {t("common.next")} <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(0);
                setSelectedTemplateId("");
                setSelectedDonors([]);
                setGroupResults([]);
                setSearchQuery("");
              }}
              data-testid="button-start-over"
            >
              {t("send_message.start_over")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
