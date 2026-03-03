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
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Birthday Wishes</h1>
          <p className="text-muted-foreground">Manage birthday greetings for donors and beneficiaries</p>
        </div>
        <Button variant="outline" onClick={loadAll} data-testid="button-refresh">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Donor Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-donor-count">{donorBirthdays.length}</div>
            <p className="text-xs text-muted-foreground">{todayDonors} today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <HandHeart className="h-3 w-3" /> Beneficiary Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-ben-count">{beneficiaryBirthdays.length}</div>
            <p className="text-xs text-muted-foreground">{todayBeneficiaries} today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Cake className="h-3 w-3" /> Today Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="text-today-count">{todayDonors + todayBeneficiaries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Messages Sent
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
            Donor Birthdays ({donorBirthdays.length})
          </TabsTrigger>
          <TabsTrigger value="beneficiaries" data-testid="tab-beneficiaries">
            <HandHeart className="mr-2 h-4 w-4" />
            Beneficiary Birthdays ({beneficiaryBirthdays.length})
          </TabsTrigger>
          <TabsTrigger value="log" data-testid="tab-log">
            <FileText className="mr-2 h-4 w-4" />
            Sent Log
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="templates" data-testid="tab-templates">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="donors">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Donor Birthdays (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {donorBirthdays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No donor birthdays in the next 7 days</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Donor</TableHead>
                        <TableHead>Birthday</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sponsorships</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                              <Badge variant="default">Today</Badge>
                            ) : (
                              <span className="text-muted-foreground">{item.daysUntil}d away</span>
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
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {item.hasEmail && <Badge variant="secondary">Email</Badge>}
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
                                <TooltipContent>View Profile</TooltipContent>
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
                                  <TooltipContent>Copy & Open WhatsApp</TooltipContent>
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
                                  <TooltipContent>Queue Birthday Email</TooltipContent>
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
              <CardTitle className="text-lg">Upcoming Beneficiary Birthdays (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {beneficiaryBirthdays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No beneficiary birthdays in the next 7 days</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Beneficiary</TableHead>
                        <TableHead>Home</TableHead>
                        <TableHead>Birthday</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sponsors</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                              <Badge variant="default">Today</Badge>
                            ) : (
                              <span className="text-muted-foreground">{item.daysUntil}d away</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.sponsors.length > 0 ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline">
                                    {item.sponsors.length} sponsor{item.sponsors.length > 1 ? "s" : ""}
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
                              <span className="text-xs text-muted-foreground">No sponsors</span>
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
                                <TooltipContent>View Profile</TooltipContent>
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
                                  <TooltipContent>Email All Sponsors</TooltipContent>
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
              <CardTitle className="text-lg">Sent Birthday Messages Log</CardTitle>
            </CardHeader>
            <CardContent>
              {!sentLog || sentLog.logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No birthday messages sent yet</div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Donor</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent By</TableHead>
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
                                {log.type === "BENEFICIARY_BIRTHDAY" ? "Beneficiary" : "Donor"}
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
                        Page {sentLog.page} of {sentLog.totalPages} ({sentLog.total} total)
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
                <CardTitle className="text-lg">Birthday Wish Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No birthday templates found</div>
                ) : (
                  <div className="space-y-4">
                    {templates.map((t) => (
                      <Card key={t.id} data-testid={`template-${t.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <CardTitle className="text-base">{t.name}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-1">
                                Channel: {t.channel} | Variables: {Array.isArray(t.variables) && t.variables.length > 0 ? t.variables.join(", ") : "No variables"}
                              </p>
                            </div>
                            {editingTemplate !== t.id ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEditTemplate(t)}
                                data-testid={`button-edit-template-${t.id}`}
                              >
                                Edit
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingTemplate(null)}
                                  data-testid={`button-cancel-template-${t.id}`}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveTemplate(t.id)}
                                  disabled={actionLoading === `save-template-${t.id}`}
                                  data-testid={`button-save-template-${t.id}`}
                                >
                                  {actionLoading === `save-template-${t.id}` ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  Save
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {editingTemplate === t.id ? (
                            <div className="space-y-3">
                              {t.channel === "EMAIL" && (
                                <div>
                                  <Label>Subject</Label>
                                  <Input
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    data-testid={`input-subject-${t.id}`}
                                  />
                                </div>
                              )}
                              <div>
                                <Label>Body</Label>
                                <Textarea
                                  value={editBody}
                                  onChange={(e) => setEditBody(e.target.value)}
                                  rows={8}
                                  className="font-mono text-sm"
                                  data-testid={`input-body-${t.id}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {t.subject && (
                                <div>
                                  <span className="text-sm font-medium text-muted-foreground">Subject: </span>
                                  <span className="text-sm">{t.subject}</span>
                                </div>
                              )}
                              <div className="text-sm bg-muted/50 p-3 rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                                {t.body}
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
