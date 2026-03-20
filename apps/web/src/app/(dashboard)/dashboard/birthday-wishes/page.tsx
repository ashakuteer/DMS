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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Cake,
  Mail,
  ExternalLink,
  Loader2,
  RefreshCw,
  Copy,
  Users,
  HandHeart,
  FileText,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { canAccessModule, hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface DonorBirthday {
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

interface BeneficiaryBirthday {
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

interface SentLogEntry {
  id: string;
  type: string;
  channel: string;
  donorId: string;
  donorName: string;
  donorCode: string;
  beneficiaryIds: string[] | null;
  status: string;
  createdAt: string;
  createdBy: string;
}

interface SentLogResponse {
  logs: SentLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

interface TemplateItem {
  id: string;
  key: string;
  name: string;
  subject: string | null;
  body: string;
  channel: string;
  variables: string[];
}

const formatDate = (month: number, day: number) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[month - 1]} ${day}`;
};

export default function BirthdayWishesPage() {
  const [donorBirthdays, setDonorBirthdays] = useState<DonorBirthday[]>([]);
  const [beneficiaryBirthdays, setBeneficiaryBirthdays] = useState<BeneficiaryBirthday[]>([]);
  const [sentLog, setSentLog] = useState<SentLogResponse | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logPage, setLogPage] = useState(1);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const { t } = useTranslation();
  const { toast } = useToast();
  const user = authStorage.getUser();

  if (user && !canAccessModule(user?.role, "birthdayWishes")) return <AccessDenied />;
  const isAdmin = user?.role === "ADMIN";

  const fetchDonorBirthdays = useCallback(async () => {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/upcoming?range=next7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setDonorBirthdays(await res.json());
    } catch (e) {
      console.error("Error fetching donor birthdays:", e);
    }
  }, []);

  const fetchBeneficiaryBirthdays = useCallback(async () => {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/upcoming-beneficiaries?range=next7`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBeneficiaryBirthdays(await res.json());
    } catch (e) {
      console.error("Error fetching beneficiary birthdays:", e);
    }
  }, []);

  const fetchSentLog = useCallback(async (page: number = 1) => {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/sent-log?page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSentLog(await res.json());
        setLogPage(page);
      }
    } catch (e) {
      console.error("Error fetching sent log:", e);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTemplates(await res.json());
    } catch (e) {
      console.error("Error fetching templates:", e);
    }
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDonorBirthdays(), fetchBeneficiaryBirthdays(), fetchSentLog(1), fetchTemplates()]);
    setLoading(false);
  }, [fetchDonorBirthdays, fetchBeneficiaryBirthdays, fetchSentLog, fetchTemplates]);

  useEffect(() => {
    loadAll();
  }, []);

  const handleQueueDonorEmail = async (donorId: string) => {
    setActionLoading(`donor-email-${donorId}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/queue-email/${donorId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Email Queued", description: result.message || "Birthday email queued" });
      } else throw new Error(result.message || "Failed");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkSentWhatsApp = async (donorId: string) => {
    setActionLoading(`donor-wa-${donorId}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/mark-sent/${donorId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "WHATSAPP" }),
      });
      if (res.ok) {
        toast({ title: "Logged", description: "WhatsApp wish logged" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyWhatsApp = async (item: DonorBirthday) => {
    if (item.whatsappPhone) {
      try {
        const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
          method: "POST",
          body: JSON.stringify({ donorId: item.donorId || "", toE164: item.whatsappPhone, message: item.whatsappText, type: "SPECIAL_DAY_WISH" }),
        });
        if (res.ok) {
          toast({ title: "WhatsApp Sent", description: "Birthday wish sent via WhatsApp" });
        } else {
          toast({ title: "WhatsApp Failed", variant: "destructive" });
        }
      } catch {
        toast({ title: "Error sending WhatsApp", variant: "destructive" });
      }
    } else {
      navigator.clipboard.writeText(item.whatsappText);
      toast({ title: "Copied", description: "No phone number. Message copied to clipboard." });
    }
  };

  const handleSendBeneficiaryWish = async (beneficiaryId: string) => {
    setActionLoading(`ben-email-${beneficiaryId}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/send-beneficiary-wish/${beneficiaryId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Emails Queued", description: result.message || "Birthday emails queued to sponsors" });
      } else throw new Error(result.message || "Failed");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const startEditTemplate = (t: TemplateItem) => {
    setEditingTemplate(t.id);
    setEditSubject(t.subject || "");
    setEditBody(t.body);
  };

  const handleSaveTemplate = async (id: string) => {
    setActionLoading(`save-template-${id}`);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/birthday-wishes/templates/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, body: editBody }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: "Template updated" });
        setEditingTemplate(null);
        fetchTemplates();
      } else throw new Error("Failed to save");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const todayDonors = donorBirthdays.filter((d) => d.isToday).length;
  const todayBeneficiaries = beneficiaryBirthdays.filter((b) => b.isToday).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("birthday.title")}</h1>
          <p className="text-muted-foreground">{t("birthday.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={loadAll} data-testid="button-refresh">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("common.refresh")}
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {t("birthday.donor_birthdays")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-donor-count">{donorBirthdays.length}</div>
            <p className="text-xs text-muted-foreground">{t("birthday.today_count", { count: todayDonors })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <HandHeart className="h-3 w-3" /> {t("birthday.beneficiary_birthdays")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ben-count">{beneficiaryBirthdays.length}</div>
            <p className="text-xs text-muted-foreground">{t("birthday.today_count", { count: todayBeneficiaries })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Cake className="h-3 w-3" /> {t("birthday.today_total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-today-count">{todayDonors + todayBeneficiaries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {t("birthday.messages_sent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sent-count">{sentLog?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="donors" className="space-y-4">
        <TabsList data-testid="tabs-birthday">
          <TabsTrigger value="donors" data-testid="tab-donors">
            <Users className="mr-2 h-4 w-4" />
            {t("birthday.donor_birthdays")} ({donorBirthdays.length})
          </TabsTrigger>
          <TabsTrigger value="beneficiaries" data-testid="tab-beneficiaries">
            <HandHeart className="mr-2 h-4 w-4" />
            {t("birthday.beneficiary_birthdays")} ({beneficiaryBirthdays.length})
          </TabsTrigger>
          <TabsTrigger value="log" data-testid="tab-log">
            <FileText className="mr-2 h-4 w-4" />
            {t("birthday.sent_log")}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="templates" data-testid="tab-templates">
              <FileText className="mr-2 h-4 w-4" />
              {t("birthday.templates")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="donors">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("birthday.upcoming_donor_birthdays")}</CardTitle>
            </CardHeader>
            <CardContent>
              {donorBirthdays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("birthday.no_donor_birthdays")}</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("birthday.col_donor")}</TableHead>
                        <TableHead>{t("birthday.col_birthday")}</TableHead>
                        <TableHead>{t("users.status")}</TableHead>
                        <TableHead>{t("birthday.col_sponsorships")}</TableHead>
                        <TableHead>{t("birthday.col_contact")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donorBirthdays.map((item) => (
                        <TableRow key={item.donorId} className="hover-elevate" data-testid={`row-donor-bday-${item.donorId}`}>
                          <TableCell>
                            <div className="font-medium">{item.donorName}</div>
                            <div className="text-xs text-muted-foreground">{item.donorCode}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(item.dobMonth, item.dobDay)}</TableCell>
                          <TableCell>
                            {item.isToday ? (
                              <Badge variant="default">{t("birthday.today")}</Badge>
                            ) : (
                              <span className="text-muted-foreground">{t("birthday.days_away", { count: item.daysUntil })}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.beneficiaries.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline">{item.beneficiaries.length}</Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs space-y-1">
                                    {item.beneficiaries.map((b) => (
                                      <div key={b.id}>{b.name} ({b.homeType.replace(/_/g, " ")})</div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-muted-foreground">{t("birthday.none")}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {item.hasEmail && <Badge variant="secondary">{t("birthday.email")}</Badge>}
                              {item.hasWhatsApp && <Badge variant="secondary">WA</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/dashboard/donors/${item.donorId}`}>
                                    <Button size="icon" variant="ghost" data-testid={`button-donor-profile-${item.donorId}`}>
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>{t("birthday.view_profile")}</TooltipContent>
                              </Tooltip>
                              {item.hasWhatsApp && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleCopyWhatsApp(item)}
                                      data-testid={`button-donor-wa-${item.donorId}`}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t("birthday.copy_whatsapp")}</TooltipContent>
                                </Tooltip>
                              )}
                              {item.hasEmail && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleQueueDonorEmail(item.donorId)}
                                      disabled={actionLoading === `donor-email-${item.donorId}`}
                                      data-testid={`button-donor-email-${item.donorId}`}
                                    >
                                      {actionLoading === `donor-email-${item.donorId}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Mail className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t("birthday.queue_email")}</TooltipContent>
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
          </Card>
        </TabsContent>

        <TabsContent value="beneficiaries">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("birthday.upcoming_ben_birthdays")}</CardTitle>
            </CardHeader>
            <CardContent>
              {beneficiaryBirthdays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("birthday.no_ben_birthdays")}</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("birthday.col_beneficiary")}</TableHead>
                        <TableHead>{t("birthday.col_home")}</TableHead>
                        <TableHead>{t("birthday.col_birthday")}</TableHead>
                        <TableHead>{t("users.status")}</TableHead>
                        <TableHead>{t("birthday.col_sponsors")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {beneficiaryBirthdays.map((item) => (
                        <TableRow key={item.beneficiaryId} className="hover-elevate" data-testid={`row-ben-bday-${item.beneficiaryId}`}>
                          <TableCell>
                            <div className="font-medium">{item.beneficiaryName}</div>
                            <div className="text-xs text-muted-foreground">{item.beneficiaryCode}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.homeType.replace(/_/g, " ")}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(item.dobMonth, item.dobDay)}</TableCell>
                          <TableCell>
                            {item.isToday ? (
                              <Badge variant="default">{t("birthday.today")}</Badge>
                            ) : (
                              <span className="text-muted-foreground">{t("birthday.days_away", { count: item.daysUntil })}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.sponsors.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline">
                                    {t("birthday.sponsor_count", { count: item.sponsors.length })}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs space-y-1">
                                    {item.sponsors.map((s) => (
                                      <div key={s.donorId}>
                                        {s.donorName} ({s.donorCode})
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-muted-foreground">{t("birthday.no_sponsors")}</span>
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
                                <TooltipContent>{t("birthday.view_profile")}</TooltipContent>
                              </Tooltip>
                              {item.sponsors.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleSendBeneficiaryWish(item.beneficiaryId)}
                                      disabled={actionLoading === `ben-email-${item.beneficiaryId}`}
                                      data-testid={`button-ben-email-${item.beneficiaryId}`}
                                    >
                                      {actionLoading === `ben-email-${item.beneficiaryId}` ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Mail className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t("birthday.email_sponsors")}</TooltipContent>
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
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("birthday.sent_log_title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!sentLog || sentLog.logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t("birthday.no_messages_sent")}</div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("birthday.col_date")}</TableHead>
                          <TableHead>{t("birthday.col_donor")}</TableHead>
                          <TableHead>{t("birthday.col_type")}</TableHead>
                          <TableHead>{t("birthday.col_channel")}</TableHead>
                          <TableHead>{t("users.status")}</TableHead>
                          <TableHead>{t("birthday.col_sent_by")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sentLog.logs.map((log) => (
                          <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(log.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>
                              <Link href={`/dashboard/donors/${log.donorId}`} className="hover:underline">
                                <div className="font-medium">{log.donorName}</div>
                                <div className="text-xs text-muted-foreground">{log.donorCode}</div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.type === "BENEFICIARY_BIRTHDAY" ? "outline" : "secondary"}>
                                {log.type === "BENEFICIARY_BIRTHDAY" ? t("birthday.col_beneficiary") : t("birthday.col_donor")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.channel}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.status === "SENT" ? "default" : "secondary"}>{log.status}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{log.createdBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {sentLog.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        {t("birthday.pagination", { page: sentLog.page, totalPages: sentLog.totalPages, total: sentLog.total })}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSentLog(logPage - 1)}
                          disabled={logPage <= 1}
                          data-testid="button-log-prev"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchSentLog(logPage + 1)}
                          disabled={logPage >= sentLog.totalPages}
                          data-testid="button-log-next"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("birthday.templates_title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{t("birthday.no_templates")}</div>
                ) : (
                  <div className="space-y-4">
                    {templates.map((tmpl) => (
                      <Card key={tmpl.id} data-testid={`template-${tmpl.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <CardTitle className="text-base">{tmpl.name}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t("birthday.channel_label")}: {tmpl.channel} | {t("birthday.variables_label")}: {Array.isArray(tmpl.variables) && tmpl.variables.length > 0 ? tmpl.variables.join(", ") : t("birthday.no_variables")}
                              </p>
                            </div>
                            {editingTemplate !== tmpl.id ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditTemplate(tmpl)}
                                data-testid={`button-edit-template-${tmpl.id}`}
                              >
                                {t("common.edit")}
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingTemplate(null)}
                                  data-testid={`button-cancel-template-${tmpl.id}`}
                                >
                                  {t("common.cancel")}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveTemplate(tmpl.id)}
                                  disabled={actionLoading === `save-template-${tmpl.id}`}
                                  data-testid={`button-save-template-${tmpl.id}`}
                                >
                                  {actionLoading === `save-template-${tmpl.id}` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  {t("common.save")}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {editingTemplate === tmpl.id ? (
                            <div className="space-y-3">
                              {tmpl.channel === "EMAIL" && (
                                <div>
                                  <Label>{t("birthday.subject_label")}</Label>
                                  <Input
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    data-testid={`input-subject-${tmpl.id}`}
                                  />
                                </div>
                              )}
                              <div>
                                <Label>{t("birthday.body_label")}</Label>
                                <Textarea
                                  value={editBody}
                                  onChange={(e) => setEditBody(e.target.value)}
                                  rows={8}
                                  className="font-mono text-sm"
                                  data-testid={`input-body-${tmpl.id}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {tmpl.subject && (
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">{t("birthday.subject_label")}: </span>
                                  <span className="text-sm">{tmpl.subject}</span>
                                </div>
                              )}
                              <div className="text-sm bg-muted/50 p-3 rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                                {tmpl.body}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
