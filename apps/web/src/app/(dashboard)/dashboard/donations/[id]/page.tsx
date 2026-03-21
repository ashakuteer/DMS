"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, IndianRupee, HandHeart, TrendingUp, Lightbulb, AlertTriangle, Info, ArrowUpRight, ArrowDownRight, Clock, Receipt, Shield, Phone, Target, CalendarCheck, CheckCircle2, Bell, Mail, MessageCircle, Check, AlarmClockOff, Inbox, BarChart3, RefreshCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/auth";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Stats {
  totalDonationsFY: number;
  donationsThisMonth: number;
  activeDonors: number;
  totalBeneficiaries: number;
}

interface MonthlyTrend {
  month: string;
  amount: number;
  count: number;
}

interface ModeSplit {
  mode: string;
  amount: number;
  count: number;
}

interface TopDonor {
  donorId: string;
  donorCode: string;
  name: string;
  category: string;
  totalAmount: number;
  donationCount: number;
}

interface RecentDonation {
  id: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  amount: number;
  date: string;
  mode: string;
  type: string;
  receiptNumber: string;
}

interface Insight {
  type: "positive" | "warning" | "info";
  title: string;
  description: string;
}

interface AdminInsight {
  type: string;
  title: string;
  description: string;
}

interface InsightCard {
  key: string;
  title: string;
  count: number;
  description: string;
  type: 'warning' | 'info' | 'positive' | 'urgent';
  details?: { name: string; id: string; extra?: string }[];
}

interface FollowUpDonor {
  id: string;
  name: string;
  donorCode: string;
  phone: string;
  daysSinceLastDonation: number;
  healthStatus: "AT_RISK" | "DORMANT";
  bestTimeToContact: string;
  followUpReason: string;
}

interface StaffActionsData {
  followUpDonors: FollowUpDonor[];
  atRiskCount: number;
  dormantCount: number;
  bestCallTime: { day: string; slot: string };
  summary: { total: number; atRisk: number; dormant: number };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DueReminder {
  id: string;
  donorId: string;
  donationId: string | null;
  type: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: string;
  donor: {
    id: string;
    donorCode: string;
    firstName: string;
    lastName: string | null;
    primaryPhone: string | null;
    personalEmail: string | null;
  };
  donation: {
    id: string;
    donationAmount: number;
    receiptNumber: string | null;
    donationDate: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatMode = (mode: string) => {
  const map: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    GPAY: "Google Pay",
    PHONEPE: "PhonePe",
    BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque",
    ONLINE: "Online",
  };
  return map[mode] || mode;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [modeSplit, setModeSplit] = useState<ModeSplit[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [adminInsights, setAdminInsights] = useState<AdminInsight[]>([]);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [staffActions, setStaffActions] = useState<StaffActionsData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = userProfile?.role === "ADMIN" || userProfile?.role === "FOUNDER";
  const isStaff = userProfile?.role === "STAFF";
  const canSeeFinancialStats = isAdmin;
  const canSeeDueReminders = isAdmin || isStaff;

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleMarkDone = async (reminder: DueReminder) => {
    try {
      const res = await fetchWithAuth(`/api/reminders/${reminder.id}/complete`, {
        method: "PATCH",
      });
      if (res.ok) {
        setDueReminders((prev) => prev.filter((r) => r.id !== reminder.id));
        toast({
          title: "Reminder Completed",
          description: `Follow-up for ${reminder.donor.firstName} marked as done`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark reminder as complete",
        variant: "destructive",
      });
    }
  };

  const handleSnooze = async (reminder: DueReminder) => {
    try {
      const res = await fetchWithAuth(`/api/reminders/${reminder.id}/snooze`, {
        method: "PATCH",
      });
      if (res.ok) {
        setDueReminders((prev) => prev.filter((r) => r.id !== reminder.id));
        toast({
          title: "Reminder Snoozed",
          description: `Follow-up for ${reminder.donor.firstName} snoozed for 30 days`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to snooze reminder",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (reminder: DueReminder) => {
    await fetchWithAuth(`/api/reminders/${reminder.id}/log-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorId: reminder.donorId,
        donationId: reminder.donationId,
        action: "send_email",
      }),
    });
    window.location.href = `/dashboard/donors/${reminder.donorId}?tab=communication`;
  };

  const handleSendWhatsApp = async (reminder: DueReminder) => {
    const phone = reminder.donor.primaryPhone?.replace(/\D/g, "") || "";
    if (!phone) {
      toast({
        title: "No Phone Number",
        description: "This donor doesn't have a phone number on file",
        variant: "destructive",
      });
      return;
    }
    
    await fetchWithAuth(`/api/reminders/${reminder.id}/log-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorId: reminder.donorId,
        donationId: reminder.donationId,
        action: "send_whatsapp",
      }),
    });
    
    const message = `Hello ${reminder.donor.firstName}, this is a follow-up from Asha Kuteer Foundation. We hope you are doing well and would love to hear from you!`;
    try {
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
        method: "POST",
        body: JSON.stringify({ donorId: reminder.donorId, toE164: phone, message }),
      });
      if (res.ok) {
        toast({ title: "WhatsApp Sent", description: "Follow-up message sent via WhatsApp" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "WhatsApp Failed", description: err.message || "Could not send", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send WhatsApp", variant: "destructive" });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await fetchWithAuth("/api/auth/profile");
      let profile: UserProfile | null = null;
      if (profileRes.ok) {
        profile = await profileRes.json();
        setUserProfile(profile);
      }

      const userCanSeeFinancialStats = ["FOUNDER", "ADMIN"].includes(profile?.role || "");
      const userCanSeeStaffActions = ["FOUNDER", "ADMIN", "STAFF"].includes(profile?.role || "");

      if (userCanSeeFinancialStats) {
        const [statsRes, trendsRes, modeRes, topRes, recentRes, insightsRes, insightCardsRes] = await Promise.all([
          fetchWithAuth("/api/dashboard/stats"),
          fetchWithAuth("/api/dashboard/trends"),
          fetchWithAuth("/api/dashboard/mode-split"),
          fetchWithAuth("/api/dashboard/top-donors"),
          fetchWithAuth("/api/dashboard/recent-donations"),
          fetchWithAuth("/api/dashboard/insights"),
          fetchWithAuth("/api/dashboard/insight-cards"),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (trendsRes.ok) setTrends(await trendsRes.json());
        if (modeRes.ok) setModeSplit(await modeRes.json());
        if (topRes.ok) setTopDonors(await topRes.json());
        if (recentRes.ok) setRecentDonations(await recentRes.json());
        if (insightsRes.ok) setInsights(await insightsRes.json());
        if (insightCardsRes.ok) setInsightCards(await insightCardsRes.json());
      }

      const canSeeDueReminders = ["ADMIN", "STAFF"].includes(profile?.role || "");

      if (profile?.role === "ADMIN") {
        const [adminRes, staffRes, remindersRes] = await Promise.all([
          fetchWithAuth("/api/dashboard/admin-insights"),
          fetchWithAuth("/api/dashboard/staff-actions"),
          fetchWithAuth("/api/reminders/due"),
        ]);
        if (adminRes.ok) setAdminInsights(await adminRes.json());
        if (staffRes.ok) setStaffActions(await staffRes.json());
        if (remindersRes.ok) setDueReminders(await remindersRes.json());
      } else if (userCanSeeStaffActions) {
        const staffRes = await fetchWithAuth("/api/dashboard/staff-actions");
        if (staffRes.ok) setStaffActions(await staffRes.json());
        if (canSeeDueReminders) {
          const remindersRes = await fetchWithAuth("/api/reminders/due");
          if (remindersRes.ok) setDueReminders(await remindersRes.json());
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Unable to load dashboard data. Please check your connection and try again.");
      toast({
        title: "Dashboard Load Failed",
        description: "Could not fetch dashboard data. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    {
      title: "Total Donations (FY)",
      value: stats ? formatCurrency(stats.totalDonationsFY) : "—",
      description: "Current financial year",
      icon: IndianRupee,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "This Month",
      value: stats ? formatCurrency(stats.donationsThisMonth) : "—",
      description: "Monthly collections",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Active Donors",
      value: stats?.activeDonors?.toString() || "—",
      description: "Registered donors",
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-50 dark:bg-violet-950/50",
    },
    {
      title: "Beneficiaries",
      value: stats?.totalBeneficiaries?.toString() || "—",
      description: "Homes supported",
      icon: HandHeart,
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
    },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive": return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-[#5FA8A8]" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "positive": return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800";
      case "warning": return "bg-[#E6F4F1] dark:bg-[#5FA8A8]/20 border-[#5FA8A8] dark:border-[#5FA8A8]";
      default: return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-7xl mx-auto" data-testid="dashboard-loading">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80 mt-2" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-56 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96" data-testid="dashboard-error">
        <Card className="border-0 shadow-sm max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-red-50 dark:bg-red-950/30">
                <WifiOff className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold" data-testid="text-error-title">Something went wrong</h3>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-error-message">{error}</p>
            </div>
            <Button onClick={fetchData} data-testid="button-retry">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the Asha Kuteer Foundation Donor Management System
        </p>
      </div>

      {canSeeFinancialStats && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-0 shadow-sm" data-testid={`card-stat-${stat.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canSeeFinancialStats && insights.length > 0 && (
        <Card className="border-0 shadow-sm" data-testid="card-ai-insights">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-[#5FA8A8]" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </div>
            <CardDescription>Smart observations based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${getInsightBg(insight.type)}`}
                  data-testid={`insight-${idx}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                    <div>
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {canSeeFinancialStats && insightCards.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="insight-cards-grid">
          {insightCards.map((card) => {
            const colorMap = {
              warning: {
                border: 'border-l-[#5FA8A8]',
                bg: 'bg-[#E6F4F1] dark:bg-[#5FA8A8]/20',
                text: 'text-[#5FA8A8]',
                countColor: 'text-[#5FA8A8] dark:text-[#A8D5D1]',
              },
              info: {
                border: 'border-l-blue-500',
                bg: 'bg-blue-50 dark:bg-blue-950/30',
                text: 'text-blue-600',
                countColor: 'text-blue-700 dark:text-blue-400',
              },
              positive: {
                border: 'border-l-emerald-500',
                bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                text: 'text-emerald-600',
                countColor: 'text-emerald-700 dark:text-emerald-400',
              },
              urgent: {
                border: 'border-l-red-500',
                bg: 'bg-red-50 dark:bg-red-950/30',
                text: 'text-red-600',
                countColor: 'text-red-700 dark:text-red-400',
              },
            };
            const colors = colorMap[card.type];
            const iconMap: Record<string, typeof Users> = {
              follow_up_needed: Users,
              high_value: TrendingUp,
              dormant: Clock,
              pledges_due: CalendarCheck,
            };
            const IconComponent = iconMap[card.key] || Info;

            return (
              <Card
                key={card.key}
                className="border-0 shadow-sm"
                data-testid={`insight-card-${card.key}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <IconComponent className={`h-5 w-5 ${colors.text}`} />
                    </div>
                    <span className={`text-3xl font-bold ${colors.countColor}`} data-testid={`insight-count-${card.key}`}>
                      {card.count}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{card.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                  {card.details && card.details.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-muted space-y-1.5">
                      {card.details.map((detail) => (
                        <div
                          key={detail.id}
                          className="flex items-center justify-between text-xs"
                          data-testid={`insight-detail-${card.key}-${detail.id}`}
                        >
                          <span className="font-medium truncate mr-2">{detail.name}</span>
                          {detail.extra && (
                            <span className="text-muted-foreground text-right flex-shrink-0">{detail.extra}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isAdmin && adminInsights.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20" data-testid="card-admin-strategy">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Admin Strategy Panel</CardTitle>
              <Badge variant="secondary" className="text-xs">Admin Only</Badge>
            </div>
            <CardDescription>Strategic insights for organizational planning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {adminInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${getInsightBg(insight.type)}`}
                  data-testid={`admin-insight-${idx}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                    <div>
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(isAdmin || isStaff) && staffActions && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20" data-testid="card-staff-actions">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-teal-600" />
                <CardTitle className="text-lg">Next Best Actions</CardTitle>
                {isAdmin && <Badge variant="secondary" className="text-xs">Staff View</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {staffActions.summary.atRisk > 0 && (
                  <Badge variant="outline" className="text-xs border-[#5FA8A8] text-[#5FA8A8] bg-[#E6F4F1] dark:bg-[#5FA8A8]/20" data-testid="badge-at-risk">
                    {staffActions.summary.atRisk} At-Risk
                  </Badge>
                )}
                {staffActions.summary.dormant > 0 && (
                  <Badge variant="outline" className="text-xs border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30" data-testid="badge-dormant">
                    {staffActions.summary.dormant} Dormant
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>Donors requiring follow-up based on inactivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" data-testid="best-call-time">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Best Time to Call</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on donation patterns, <strong>{staffActions.bestCallTime.day}</strong> during <strong>{staffActions.bestCallTime.slot}</strong> shows highest engagement.
                    </p>
                  </div>
                </div>
              </div>

              {staffActions.followUpDonors.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Donors to Follow Up ({staffActions.followUpDonors.length})</span>
                  </div>
                  <div className="space-y-2">
                    {staffActions.followUpDonors.slice(0, 10).map((donor) => (
                      <div
                        key={donor.id}
                        className="p-4 rounded-lg bg-white/60 dark:bg-gray-900/40 border border-muted"
                        data-testid={`followup-donor-${donor.id}`}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{donor.name}</p>
                              <p className="text-xs text-muted-foreground">{donor.donorCode} • {donor.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${donor.healthStatus === 'DORMANT' ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30' : 'border-[#5FA8A8] text-[#5FA8A8] bg-[#E6F4F1] dark:bg-[#5FA8A8]/20'}`}
                              data-testid={`health-status-${donor.id}`}
                            >
                              {donor.healthStatus === 'DORMANT' ? 'Dormant' : 'At-Risk'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs" data-testid={`days-since-${donor.id}`}>
                              {donor.daysSinceLastDonation} days
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 pl-7 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Best time: <strong>{donor.bestTimeToContact}</strong></span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span data-testid={`reason-${donor.id}`}>{donor.followUpReason}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {staffActions.followUpDonors.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        + {staffActions.followUpDonors.length - 10} more donors to follow up
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">All Donors Engaged</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        No donors currently require follow-up. Great job keeping donors engaged!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canSeeDueReminders && dueReminders.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#5FA8A8]/50 to-[#7FAFD4]/50 dark:from-[#5FA8A8]/20 dark:to-[#7FAFD4]/20" data-testid="card-followups-due">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#5FA8A8]" />
                <CardTitle className="text-lg">Follow-ups Due</CardTitle>
                <Badge variant="outline" className="text-xs border-[#5FA8A8] text-[#5FA8A8] bg-[#E6F4F1] dark:bg-[#5FA8A8]/20" data-testid="badge-due-count">
                  {dueReminders.length} pending
                </Badge>
              </div>
            </div>
            <CardDescription>Scheduled reminders that need action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dueReminders.slice(0, 10).map((reminder) => {
                const daysOverdue = getDaysOverdue(reminder.dueDate);
                const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ""}`.trim();
                
                return (
                  <div
                    key={reminder.id}
                    className="p-4 rounded-lg bg-white/60 dark:bg-gray-900/40 border border-muted"
                    data-testid={`reminder-${reminder.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Bell className="h-4 w-4 text-[#5FA8A8]" />
                        <div>
                          <p className="font-medium text-sm">{donorName}</p>
                          <p className="text-xs text-muted-foreground">{reminder.donor.donorCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {daysOverdue > 0 && (
                          <Badge variant="outline" className="text-xs border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30" data-testid={`overdue-${reminder.id}`}>
                            {daysOverdue} day{daysOverdue > 1 ? "s" : ""} overdue
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs" data-testid={`due-date-${reminder.id}`}>
                          Due: {formatDate(reminder.dueDate)}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 pl-7">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span data-testid={`reason-${reminder.id}`}>{reminder.title}: {reminder.description || "Follow-up reminder"}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleSendEmail(reminder)}
                          data-testid={`button-email-${reminder.id}`}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleSendWhatsApp(reminder)}
                          data-testid={`button-whatsapp-${reminder.id}`}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => handleMarkDone(reminder)}
                          data-testid={`button-done-${reminder.id}`}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark Done
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => handleSnooze(reminder)}
                          data-testid={`button-snooze-${reminder.id}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Snooze 30d
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {dueReminders.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  + {dueReminders.length - 10} more reminders due
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canSeeFinancialStats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm" data-testid="card-donation-trends">
            <CardHeader>
              <CardTitle className="text-lg">Donation Trends</CardTitle>
              <CardDescription>Monthly donations over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), "Amount"]}
                        labelClassName="font-medium"
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-72 text-muted-foreground" data-testid="empty-donation-trends">
                  <BarChart3 className="h-10 w-10 mb-3 text-muted-foreground/50" />
                  <p className="font-medium text-sm">No Trend Data Yet</p>
                  <p className="text-xs mt-1">Donation trends will appear once donations are recorded</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm" data-testid="card-mode-split">
            <CardHeader>
              <CardTitle className="text-lg">Payment Modes</CardTitle>
              <CardDescription>Distribution by payment method (FY)</CardDescription>
            </CardHeader>
            <CardContent>
              {modeSplit.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modeSplit}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="amount"
                        nameKey="mode"
                        label={({ mode, percent }) => `${formatMode(mode)} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {modeSplit.map((entry, idx) => (
                          <Cell key={entry.mode} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-72 text-muted-foreground" data-testid="empty-payment-modes">
                  <IndianRupee className="h-10 w-10 mb-3 text-muted-foreground/50" />
                  <p className="font-medium text-sm">No Payment Data Yet</p>
                  <p className="text-xs mt-1">Payment mode distribution will appear after donations are received</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {canSeeFinancialStats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm" data-testid="card-top-donors">
            <CardHeader>
              <CardTitle className="text-lg">Top Donors</CardTitle>
              <CardDescription>Highest contributors this financial year</CardDescription>
            </CardHeader>
            <CardContent>
              {topDonors.length > 0 ? (
                <div className="space-y-3">
                  {topDonors.map((donor, idx) => (
                    <div
                      key={donor.donorId}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      data-testid={`top-donor-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{donor.name}</p>
                          <p className="text-xs text-muted-foreground">{donor.donorCode} • {donor.donationCount} donation(s)</p>
                        </div>
                      </div>
                      <p className="font-semibold text-emerald-600">{formatCurrency(donor.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground" data-testid="empty-top-donors">
                  <Users className="h-10 w-10 mb-3 text-muted-foreground/50" />
                  <p className="font-medium text-sm">No Top Donors Yet</p>
                  <p className="text-xs mt-1">Top donors will be listed once donations are recorded</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm" data-testid="card-recent-donations">
            <CardHeader>
              <CardTitle className="text-lg">Recent Donations</CardTitle>
              <CardDescription>Latest 10 donations received</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDonations.length > 0 ? (
                <div className="space-y-3">
                  {recentDonations.slice(0, 5).map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      data-testid={`recent-donation-${donation.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                          <Receipt className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{donation.donorName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(donation.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                            <span>•</span>
                            <span>{formatMode(donation.mode)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(donation.amount)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground" data-testid="empty-recent-donations">
                  <Inbox className="h-10 w-10 mb-3 text-muted-foreground/50" />
                  <p className="font-medium text-sm">No Recent Donations</p>
                  <p className="text-xs mt-1">Recent donations will appear here as they are recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
