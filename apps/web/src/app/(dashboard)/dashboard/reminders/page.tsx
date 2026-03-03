"use client";

import { API_URL } from "@/lib/api-config";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MessageCircle,
  Mail,
  MoreVertical,
  User,
  ExternalLink,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";

interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  lastName?: string;
  primaryPhone?: string;
  primaryPhoneCode?: string;
  whatsappPhone?: string;
  whatsappPhoneCode?: string;
  personalEmail?: string;
  officialEmail?: string;
}

interface ReminderTask {
  id: string;
  donorId: string;
  type: string;
  title: string;
  dueDate: string;
  status: string;
  snoozedUntil?: string;
  createdAt: string;
  autoEmailSent: boolean;
  autoEmailSentAt?: string;
  donor: Donor;
  sourceOccasion?: { relatedPersonName?: string };
  sourceFamilyMember?: { name?: string };
}

interface Stats {
  today: number;
  week: number;
  month: number;
  overdue: number;
}

const typeColors: Record<string, string> = {
  BIRTHDAY: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  ANNIVERSARY: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  MEMORIAL: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  FOLLOW_UP: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  FAMILY_BIRTHDAY: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const typeLabels: Record<string, string> = {
  BIRTHDAY: "Birthday",
  ANNIVERSARY: "Anniversary",
  MEMORIAL: "Memorial",
  FOLLOW_UP: "Follow-up",
  FAMILY_BIRTHDAY: "Family Birthday",
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderTask[]>([]);
  const [stats, setStats] = useState<Stats>({ today: 0, week: 0, month: 0, overdue: 0 });
  const [activeTab, setActiveTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const isAdmin = user?.role === "ADMIN";
  const canEdit = user?.role === "ADMIN" || user?.role === "STAFF";
  if (user && !canAccessModule(user?.role, 'reminders')) return <AccessDenied />;

  const fetchReminders = async (filter: string) => {
    setLoading(true);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchReminders(activeTab);
    fetchStats();
  }, [activeTab]);

  const handleMarkDone = async (id: string) => {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/${id}/done`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Reminder marked as done" });
        fetchReminders(activeTab);
        fetchStats();
      } else {
        toast({ title: "Failed to mark reminder as done", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    }
  };

  const handleSnooze = async (id: string, days: number) => {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/${id}/snooze`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        toast({ title: `Reminder snoozed for ${days} days` });
        fetchReminders(activeTab);
        fetchStats();
      } else {
        toast({ title: "Failed to snooze reminder", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    }
  };

  const handleGenerateReminders = async () => {
    setGenerating(true);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
        fetchReminders(activeTab);
        fetchStats();
      } else {
        toast({ title: "Failed to generate reminders", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const openWhatsApp = async (reminder: ReminderTask) => {
    const { donor, id } = reminder;
    const phone = donor.whatsappPhone || donor.primaryPhone;
    
    if (!phone) {
      toast({ title: "No phone number available for this donor", variant: "destructive" });
      return;
    }

    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`${API_URL}/api/reminder-tasks/${id}/whatsapp-log`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        const sendRes = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
          method: "POST",
          body: JSON.stringify({ donorId: donor.id, toE164: data.phone, message: data.message, type: "SPECIAL_DAY_WISH" }),
        });
        if (sendRes.ok) {
          toast({ title: "WhatsApp Sent", description: "Reminder sent via WhatsApp" });
        } else {
          toast({ title: "WhatsApp Failed", variant: "destructive" });
        }
      } else {
        toast({ title: "Failed to log WhatsApp action. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "An error occurred. Please try again.", variant: "destructive" });
    }
  };

  const openDonorProfile = (donorId: string) => {
    router.push(`/dashboard/donors/${donorId}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysOverdue = (dateStr: string) => {
    const dueDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Reminders</h1>
          <p className="text-muted-foreground">Manage birthday, anniversary, and follow-up reminders</p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleGenerateReminders}
            disabled={generating}
            data-testid="button-generate-reminders"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Generate Reminders
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-today">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next 7 Days</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-week">{stats.week}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next 30 Days</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stat-month">{stats.month}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-stat-overdue">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="today" data-testid="tab-today">Today ({stats.today})</TabsTrigger>
          <TabsTrigger value="week" data-testid="tab-week">7 Days ({stats.week})</TabsTrigger>
          <TabsTrigger value="month" data-testid="tab-month">30 Days ({stats.month})</TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue">Overdue ({stats.overdue})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-2" />
                  <p>No reminders in this category</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Donor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reminder</TableHead>
                      <TableHead>Due Date</TableHead>
                      {activeTab === "overdue" && <TableHead>Days Overdue</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.map((reminder) => (
                      <TableRow key={reminder.id} data-testid={`row-reminder-${reminder.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {reminder.donor.firstName} {reminder.donor.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {reminder.donor.donorCode}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeColors[reminder.type] || "bg-gray-100"}>
                            {typeLabels[reminder.type] || reminder.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{reminder.title}</span>
                        </TableCell>
                        <TableCell>
                          <span className={activeTab === "overdue" ? "text-destructive font-medium" : ""}>
                            {formatDate(reminder.dueDate)}
                          </span>
                        </TableCell>
                        {activeTab === "overdue" && (
                          <TableCell>
                            <Badge variant="destructive">
                              {getDaysOverdue(reminder.dueDate)} days
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {reminder.autoEmailSent && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400" data-testid={`badge-email-sent-${reminder.id}`}>
                                <Mail className="h-3 w-3 mr-1" />
                                Sent
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openWhatsApp(reminder)}
                              title="Send WhatsApp"
                              data-testid={`button-whatsapp-${reminder.id}`}
                            >
                              <MessageCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDonorProfile(reminder.donorId)}
                              title="Open Donor Profile"
                              data-testid={`button-profile-${reminder.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {canEdit && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-actions-${reminder.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleMarkDone(reminder.id)}
                                    data-testid={`menu-done-${reminder.id}`}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Done
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSnooze(reminder.id, 7)}
                                    data-testid={`menu-snooze7-${reminder.id}`}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Snooze 7 Days
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSnooze(reminder.id, 30)}
                                    data-testid={`menu-snooze30-${reminder.id}`}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Snooze 30 Days
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
