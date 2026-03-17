"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/auth";
import {
  Users, IndianRupee, HandHeart, TrendingUp, AlertTriangle, Info,
  ArrowUpRight, Clock, Target, CalendarCheck, CheckCircle2, Bell,
  Mail, MessageCircle, Check, BarChart3, RefreshCcw, WifiOff,
  UserPlus, PlusCircle, FileText, Heart, Lightbulb, ArrowDownRight,
  Phone, Building2, Repeat, Zap, Star, ChevronRight, Activity,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stats { totalDonationsFY: number; donationsThisMonth: number; activeDonors: number; totalBeneficiaries: number; }
interface MonthlyTrend { month: string; amount: number; count: number; }
interface ModeSplit { mode: string; amount: number; count: number; }
interface TopDonor { donorId: string; donorCode: string; name: string; category: string; totalAmount: number; donationCount: number; }
interface RecentDonation { id: string; donorId: string; donorCode: string; donorName: string; amount: number; date: string; mode: string; type: string; receiptNumber: string; }
interface Insight { type: "positive" | "warning" | "info"; title: string; description: string; }
interface AdminInsight { type: string; title: string; description: string; }
interface InsightCard { key: string; title: string; count: number; description: string; type: "warning" | "info" | "positive" | "urgent"; details?: { name: string; id: string; extra?: string }[]; }
interface FollowUpDonor { id: string; name: string; donorCode: string; phone: string; daysSinceLastDonation: number; healthStatus: "AT_RISK" | "DORMANT"; bestTimeToContact: string; followUpReason: string; }
interface StaffActionsData { followUpDonors: FollowUpDonor[]; atRiskCount: number; dormantCount: number; bestCallTime: { day: string; slot: string }; summary: { total: number; atRisk: number; dormant: number }; }
interface UserProfile { id: string; name: string; email: string; role: string; }
interface DueReminder { id: string; donorId: string; donationId: string | null; type: string; title: string; description: string | null; dueDate: string; status: string; donor: { id: string; donorCode: string; firstName: string; lastName: string | null; primaryPhone: string | null; personalEmail: string | null; }; donation: { id: string; donationAmount: number; receiptNumber: string | null; donationDate: string; } | null; createdBy: { id: string; name: string; }; }
interface HomeMetric { homeType: string; homeLabel: string; beneficiaryCount: number; activeSponsorships: number; donationsReceived: number; }
interface ImpactData { summary: { totalBeneficiaries: number; totalDonors: number; activeSponsors: number; activeSponsorships: number; totalDonationsFY: number; totalCampaigns: number; }; homeMetrics: HomeMetric[]; }
interface RetentionData { summary: { totalDonors: number; repeatDonorCount: number; oneTimeDonorCount: number; lapsedDonorCount: number; overallRetentionPct: number; activeLast6Months: number; }; }

// ─── Constants ────────────────────────────────────────────────────────────────
const CHART_COLORS = ["#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];
const HOME_COLORS: Record<string, string> = {
  ORPHAN_GIRLS: "#f97316",
  BLIND_BOYS: "#3b82f6",
  OLD_AGE: "#10b981",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const formatMode = (mode: string) => {
  const map: Record<string, string> = { CASH: "Cash", UPI: "UPI", GPAY: "Google Pay", PHONEPE: "PhonePe", BANK_TRANSFER: "Bank Transfer", CHEQUE: "Cheque", ONLINE: "Online" };
  return map[mode] || mode;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const getDaysOverdue = (dueDate: string) => {
  const diff = new Date().getTime() - new Date(dueDate).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ title, value, description, icon: Icon, color, trend, highlight = false }: { title: string; value: string; description?: string; icon: React.ElementType; color: string; trend?: { value: number; label: string }; highlight?: boolean; }) {
  return (
    <Card className={highlight ? "border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600" : "border-0 shadow-sm"}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-xl ${highlight ? "bg-white/20" : color.replace("text-", "bg-").replace("-600", "-50").replace("-500", "-50") + " dark:" + color.replace("text-", "bg-").replace("-600", "-950/40").replace("-500", "-950/40")}`}>
            <Icon className={`h-4 w-4 ${highlight ? "text-white" : color}`} />
          </div>
          {trend && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend.value >= 0 ? (highlight ? "text-orange-100" : "text-emerald-600") : "text-red-500"}`}>
              {trend.value >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        <p className={`text-2xl font-bold leading-tight ${highlight ? "text-white" : "text-foreground"}`}>{value}</p>
        <p className={`text-xs mt-1 font-medium ${highlight ? "text-orange-100" : "text-muted-foreground"}`}>{title}</p>
        {description && <p className={`text-xs mt-0.5 ${highlight ? "text-orange-200" : "text-muted-foreground/70"}`}>{description}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {Icon && <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 mt-0.5"><Icon className="h-4 w-4 text-orange-600" /></div>}
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-5 px-5">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle && <CardDescription className="text-xs mt-0.5">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6" data-testid="dashboard-loading">
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [retentionData, setRetentionData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = userProfile?.role === "ADMIN";
  const isAccountant = userProfile?.role === "ACCOUNTANT";
  const isStaffOrTelecaller = ["STAFF", "TELECALLER"].includes(userProfile?.role || "");
  const canSeeFinancialStats = isAdmin || isAccountant;
  const canSeeDueReminders = isAdmin || userProfile?.role === "STAFF";

  const handleMarkDone = async (reminder: DueReminder) => {
    try {
      const res = await fetchWithAuth(`/api/reminders/${reminder.id}/complete`, { method: "PATCH" });
      if (res.ok) {
        setDueReminders((prev) => prev.filter((r) => r.id !== reminder.id));
        toast({ title: "Reminder Completed", description: `Follow-up for ${reminder.donor.firstName} marked as done` });
      }
    } catch { toast({ title: "Error", description: "Failed to mark reminder", variant: "destructive" }); }
  };

  const handleSnooze = async (reminder: DueReminder) => {
    try {
      const res = await fetchWithAuth(`/api/reminders/${reminder.id}/snooze`, { method: "PATCH" });
      if (res.ok) {
        setDueReminders((prev) => prev.filter((r) => r.id !== reminder.id));
        toast({ title: "Snoozed", description: `Snoozed for 30 days` });
      }
    } catch { toast({ title: "Error", description: "Failed to snooze", variant: "destructive" }); }
  };

  const handleSendEmail = async (reminder: DueReminder) => {
    await fetchWithAuth(`/api/reminders/${reminder.id}/log-action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ donorId: reminder.donorId, donationId: reminder.donationId, action: "send_email" }) });
    window.location.href = `/dashboard/donors/${reminder.donorId}?tab=communication`;
  };

  const handleSendWhatsApp = async (reminder: DueReminder) => {
    const phone = reminder.donor.primaryPhone?.replace(/\D/g, "") || "";
    if (!phone) { toast({ title: "No Phone", description: "Donor has no phone number", variant: "destructive" }); return; }
    await fetchWithAuth(`/api/reminders/${reminder.id}/log-action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ donorId: reminder.donorId, donationId: reminder.donationId, action: "send_whatsapp" }) });
    const message = `Hello ${reminder.donor.firstName}, this is a follow-up from Asha Kuteer Foundation. We hope you are doing well!`;
    try {
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", { method: "POST", body: JSON.stringify({ donorId: reminder.donorId, toE164: phone, message }) });
      if (res.ok) toast({ title: "WhatsApp Sent" });
      else toast({ title: "Failed", description: "Could not send WhatsApp", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to send", variant: "destructive" }); }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await fetchWithAuth("/api/auth/profile");
      let profile: UserProfile | null = null;
      if (profileRes.ok) { profile = await profileRes.json(); setUserProfile(profile); }

      const userCanSeeFinancialStats = ["ADMIN", "ACCOUNTANT"].includes(profile?.role || "");
      const userCanSeeStaffActions = ["ADMIN", "STAFF", "TELECALLER"].includes(profile?.role || "");

      if (userCanSeeFinancialStats) {
        const [statsRes, trendsRes, modeRes, topRes, recentRes, insightsRes, insightCardsRes, impactRes, retentionRes] = await Promise.all([
          fetchWithAuth("/api/dashboard/stats"),
          fetchWithAuth("/api/dashboard/trends"),
          fetchWithAuth("/api/dashboard/mode-split"),
          fetchWithAuth("/api/dashboard/top-donors"),
          fetchWithAuth("/api/dashboard/recent-donations"),
          fetchWithAuth("/api/dashboard/insights"),
          fetchWithAuth("/api/dashboard/insight-cards"),
          fetchWithAuth("/api/dashboard/impact"),
          fetchWithAuth("/api/dashboard/retention"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (trendsRes.ok) setTrends(await trendsRes.json());
        if (modeRes.ok) setModeSplit(await modeRes.json());
        if (topRes.ok) setTopDonors(await topRes.json());
        if (recentRes.ok) setRecentDonations(await recentRes.json());
        if (insightsRes.ok) setInsights(await insightsRes.json());
        if (insightCardsRes.ok) setInsightCards(await insightCardsRes.json());
        if (impactRes.ok) setImpactData(await impactRes.json());
        if (retentionRes.ok) setRetentionData(await retentionRes.json());
      }

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
        const canSee = ["ADMIN", "STAFF"].includes(profile?.role || "");
        if (canSee) {
          const remindersRes = await fetchWithAuth("/api/reminders/due");
          if (remindersRes.ok) setDueReminders(await remindersRes.json());
        }
      }
    } catch {
      setError("Unable to load dashboard data. Please check your connection.");
      toast({ title: "Load Failed", description: "Could not fetch dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <div className="flex items-center justify-center h-96" data-testid="dashboard-error">
      <Card className="border-0 shadow-sm max-w-sm w-full mx-4">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center"><div className="p-4 rounded-full bg-red-50"><WifiOff className="h-8 w-8 text-red-400" /></div></div>
          <div>
            <h3 className="text-base font-semibold" data-testid="text-error-title">Connection Error</h3>
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-error-message">{error}</p>
          </div>
          <Button onClick={fetchData} className="w-full" data-testid="button-retry"><RefreshCcw className="h-4 w-4 mr-2" />Retry</Button>
        </CardContent>
      </Card>
    </div>
  );

  // ── KPI data ────────────────────────────────────────────────────────────────
  const retentionPct = retentionData?.summary.overallRetentionPct ?? 0;
  const lapsedCount = retentionData?.summary.lapsedDonorCount ?? 0;
  const followUpCount = insightCards.find(c => c.key === "follow_up_needed")?.count ?? staffActions?.summary.atRisk ?? 0;
  const sponsoredBeneficiaries = impactData?.summary.activeSponsorships ?? 0;

  const kpiCards = [
    { title: "Total FY Donations", value: stats ? formatCurrency(stats.totalDonationsFY) : "—", icon: IndianRupee, color: "text-orange-500", highlight: true },
    { title: "This Month", value: stats ? formatCurrency(stats.donationsThisMonth) : "—", icon: TrendingUp, color: "text-blue-600" },
    { title: "Total Donors", value: impactData ? impactData.summary.totalDonors.toString() : (stats?.activeDonors?.toString() ?? "—"), icon: Users, color: "text-violet-600" },
    { title: "Active Donors", value: stats?.activeDonors?.toString() ?? "—", icon: UserPlus, color: "text-emerald-600" },
    { title: "Beneficiaries", value: stats?.totalBeneficiaries?.toString() ?? "—", icon: HandHeart, color: "text-rose-600" },
    { title: "Sponsored", value: sponsoredBeneficiaries.toString(), icon: Heart, color: "text-pink-600" },
    { title: "Retention Rate", value: `${retentionPct.toFixed(1)}%`, icon: Repeat, color: "text-teal-600" },
    { title: "Pending Follow-ups", value: followUpCount.toString(), icon: Bell, color: "text-amber-600" },
  ];

  // ── Insight styling helpers ─────────────────────────────────────────────────
  const insightStyle = (type: string) => {
    switch (type) {
      case "positive": return { border: "border-l-2 border-l-emerald-400", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /> };
      case "warning": return { border: "border-l-2 border-l-amber-400", badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40", icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" /> };
      case "urgent": return { border: "border-l-2 border-l-red-400", badge: "bg-red-50 text-red-700 dark:bg-red-950/40", icon: <Zap className="h-4 w-4 text-red-500 flex-shrink-0" /> };
      default: return { border: "border-l-2 border-l-blue-400", badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/40", icon: <Info className="h-4 w-4 text-blue-500 flex-shrink-0" /> };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a4480 50%, #1e40af 100%)" }}>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-white" />
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-white" />
          </div>
          <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 mb-4">
                <Activity className="h-3 w-3 text-orange-400" />
                <span className="text-xs font-medium text-orange-300">System Active</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Making a Difference,<br className="hidden sm:block" /> Together.
              </h1>
              <p className="text-blue-200 mt-3 text-sm leading-relaxed max-w-xl">
                Welcome to the Asha Kuteer Foundation Donor Management System. Track donations, donors, sponsorships, homes, and impact from one place.
              </p>
              {canSeeFinancialStats && stats && (
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-blue-200 text-xs">FY Total: <strong className="text-white">{formatCurrency(stats.totalDonationsFY)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-400" />
                    <span className="text-blue-200 text-xs">This Month: <strong className="text-white">{formatCurrency(stats.donationsThisMonth)}</strong></span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 md:flex-col lg:flex-row">
              <Link href="/dashboard/donors/new" data-testid="button-hero-add-donor">
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-900/30 gap-2 w-full sm:w-auto">
                  <UserPlus className="h-4 w-4" />Add Donor
                </Button>
              </Link>
              <Link href="/dashboard/donations" data-testid="button-hero-add-donation">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-2 w-full sm:w-auto bg-white/5">
                  <PlusCircle className="h-4 w-4" />Add Donation
                </Button>
              </Link>
              <Link href="/dashboard/beneficiaries" data-testid="button-hero-beneficiaries">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-2 w-full sm:w-auto bg-white/5">
                  <HandHeart className="h-4 w-4" />Beneficiaries
                </Button>
              </Link>
              <Link href="/dashboard/reports" data-testid="button-hero-reports">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-2 w-full sm:w-auto bg-white/5">
                  <FileText className="h-4 w-4" />Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ────────────────────────────────────────────────────── */}
        {canSeeFinancialStats && (
          <section>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4">
              {kpiCards.slice(0, 4).map((card) => (
                <KpiCard key={card.title} {...card} highlight={card.highlight} />
              ))}
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 mt-4">
              {kpiCards.slice(4).map((card) => (
                <KpiCard key={card.title} {...card} />
              ))}
            </div>
          </section>
        )}

        {/* ── CHARTS ROW ───────────────────────────────────────────────────── */}
        {canSeeFinancialStats && (
          <section>
            <SectionHeader title="Donation Analytics" subtitle="Trends and payment distribution" icon={BarChart3} />
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartCard title="Monthly Donation Trend" subtitle="Last 12 months collection overview">
                  {trends.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-50" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                          <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} className="text-muted-foreground" width={45} />
                          <Tooltip formatter={(v: number) => [formatCurrency(v), "Amount"]} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                          <Line type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: "#ea580c" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground" data-testid="empty-donation-trends">
                      <BarChart3 className="h-10 w-10 mb-3 opacity-30" /><p className="text-sm font-medium">No Data Yet</p>
                      <p className="text-xs mt-1 opacity-70">Trends appear once donations are recorded</p>
                    </div>
                  )}
                </ChartCard>
              </div>
              <ChartCard title="Payment Modes" subtitle="Current FY distribution">
                {modeSplit.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={modeSplit} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="amount" nameKey="mode">
                          {modeSplit.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                        <Legend formatter={(v) => formatMode(v)} wrapperStyle={{ fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-muted-foreground" data-testid="empty-payment-modes">
                    <IndianRupee className="h-10 w-10 mb-3 opacity-30" /><p className="text-sm font-medium">No Data Yet</p>
                  </div>
                )}
              </ChartCard>
            </div>
          </section>
        )}

        {/* ── HOME-WISE PERFORMANCE ─────────────────────────────────────────── */}
        {canSeeFinancialStats && impactData && impactData.homeMetrics.length > 0 && (
          <section data-testid="section-home-performance">
            <SectionHeader title="Home-wise Performance" subtitle="Impact and donations across all Asha Kuteer homes this FY" icon={Building2} />
            <div className="grid gap-4 md:grid-cols-3">
              {impactData.homeMetrics.map((home) => {
                const color = HOME_COLORS[home.homeType] || "#6366f1";
                const totalBens = home.beneficiaryCount;
                const sponsored = home.activeSponsorships;
                const unsponsored = Math.max(0, totalBens - sponsored);
                const pct = totalBens > 0 ? Math.round((sponsored / totalBens) * 100) : 0;
                return (
                  <Card key={home.homeType} className="border-0 shadow-sm overflow-hidden" data-testid={`home-card-${home.homeType}`}>
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-sm text-foreground leading-tight">{home.homeLabel}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{totalBens} beneficiaries</p>
                        </div>
                        <div className="p-2 rounded-xl" style={{ backgroundColor: color + "20" }}>
                          <Building2 className="h-4 w-4" style={{ color }} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Sponsorship Coverage</span>
                            <span className="font-semibold" style={{ color }}>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" style={{ "--progress-color": color } as any} />
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="text-center p-2 rounded-lg bg-muted/40">
                            <p className="text-base font-bold text-foreground">{sponsored}</p>
                            <p className="text-xs text-muted-foreground">Sponsored</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/40">
                            <p className="text-base font-bold text-foreground">{unsponsored}</p>
                            <p className="text-xs text-muted-foreground">Unsponsored</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/40">
                            <p className="text-base font-bold text-foreground" style={{ color }}>{home.donationsReceived > 0 ? `₹${Math.round(home.donationsReceived / 1000)}k` : "—"}</p>
                            <p className="text-xs text-muted-foreground">Donations</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* ── RETENTION + SMART INSIGHTS ───────────────────────────────────── */}
        {canSeeFinancialStats && (
          <section>
            <div className="grid gap-5 lg:grid-cols-2">

              {/* Donor Intelligence */}
              <div>
                <SectionHeader title="Donor Intelligence" subtitle="Retention health and engagement metrics" icon={Repeat} />
                <div className="space-y-3">
                  {retentionData && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Repeat Donors", value: retentionData.summary.repeatDonorCount, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                        { label: "Lapsed Donors", value: retentionData.summary.lapsedDonorCount, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
                        { label: "One-time Only", value: retentionData.summary.oneTimeDonorCount, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
                        { label: "Active (6 months)", value: retentionData.summary.activeLast6Months, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                      ].map(({ label, value, color, bg }) => (
                        <div key={label} className={`rounded-xl p-3.5 ${bg}`}>
                          <p className={`text-xl font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {insightCards.length > 0 && (
                    <div className="space-y-2">
                      {insightCards.map((card) => {
                        const style = insightStyle(card.type);
                        const iconMap: Record<string, React.ElementType> = { follow_up_needed: Phone, high_value: Star, dormant: Clock, pledges_due: CalendarCheck };
                        const IconComp = iconMap[card.key] || Info;
                        return (
                          <div key={card.key} className={`flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border ${style.border}`} data-testid={`insight-card-${card.key}`}>
                            <div className="p-1.5 rounded-lg bg-muted/60 flex-shrink-0"><IconComp className="h-3.5 w-3.5 text-muted-foreground" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold" data-testid={`insight-count-${card.key}`}>{card.count}</span>
                                <span className="text-sm font-medium text-foreground truncate">{card.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{card.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Insights */}
              <div>
                <SectionHeader title="Smart Insights" subtitle="AI-powered observations and action items" icon={Lightbulb} />
                <div className="space-y-2.5">
                  {[...insights.slice(0, 4), ...adminInsights.slice(0, 3)].map((insight, idx) => {
                    const style = insightStyle(insight.type);
                    return (
                      <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl bg-card border border-border ${style.border}`} data-testid={`insight-${idx}`}>
                        <div className="mt-0.5">{style.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{insight.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                        </div>
                      </div>
                    );
                  })}
                  {insights.length === 0 && adminInsights.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Insights will appear as data grows</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FOLLOW-UPS DUE ───────────────────────────────────────────────── */}
        {canSeeDueReminders && dueReminders.length > 0 && (
          <section data-testid="card-followups-due">
            <SectionHeader title="Follow-ups Due" subtitle={`${dueReminders.length} scheduled follow-ups need action`} icon={Bell} />
            <div className="space-y-2.5">
              {dueReminders.slice(0, 6).map((reminder) => {
                const daysOverdue = getDaysOverdue(reminder.dueDate);
                const donorName = `${reminder.donor.firstName} ${reminder.donor.lastName || ""}`.trim();
                return (
                  <Card key={reminder.id} className="border-0 shadow-sm" data-testid={`reminder-${reminder.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30"><Bell className="h-4 w-4 text-orange-500" /></div>
                          <div>
                            <p className="text-sm font-semibold">{donorName}</p>
                            <p className="text-xs text-muted-foreground">{reminder.donor.donorCode} · {reminder.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {daysOverdue > 0 && <Badge variant="outline" className="text-xs border-red-400 text-red-600 bg-red-50" data-testid={`overdue-${reminder.id}`}>{daysOverdue}d overdue</Badge>}
                          <Badge variant="secondary" className="text-xs" data-testid={`due-date-${reminder.id}`}>Due {formatDate(reminder.dueDate)}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 ml-11 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSendEmail(reminder)} data-testid={`button-email-${reminder.id}`}><Mail className="h-3 w-3" />Email</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleSendWhatsApp(reminder)} data-testid={`button-whatsapp-${reminder.id}`}><MessageCircle className="h-3 w-3" />WhatsApp</Button>
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleMarkDone(reminder)} data-testid={`button-done-${reminder.id}`}><Check className="h-3 w-3" />Done</Button>
                        <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => handleSnooze(reminder)} data-testid={`button-snooze-${reminder.id}`}><Clock className="h-3 w-3" />Snooze</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {dueReminders.length > 6 && <p className="text-xs text-muted-foreground text-center py-1">+ {dueReminders.length - 6} more follow-ups</p>}
            </div>
          </section>
        )}

        {/* ── STAFF NEXT BEST ACTIONS ──────────────────────────────────────── */}
        {(isAdmin || isStaffOrTelecaller) && staffActions && staffActions.followUpDonors.length > 0 && (
          <section data-testid="card-staff-actions">
            <SectionHeader title="Next Best Actions" subtitle="Donors requiring follow-up based on inactivity patterns" icon={Target} />
            <div className="grid gap-3 md:grid-cols-2">
              {staffActions.followUpDonors.slice(0, 6).map((donor) => (
                <Card key={donor.id} className="border-0 shadow-sm" data-testid={`followup-donor-${donor.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${donor.healthStatus === "DORMANT" ? "bg-red-50 dark:bg-red-950/30" : "bg-amber-50 dark:bg-amber-950/30"}`}>
                          <Phone className={`h-4 w-4 ${donor.healthStatus === "DORMANT" ? "text-red-500" : "text-amber-500"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{donor.name}</p>
                          <p className="text-xs text-muted-foreground">{donor.donorCode} · {donor.phone}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${donor.healthStatus === "DORMANT" ? "border-red-400 text-red-600 bg-red-50" : "border-amber-400 text-amber-600 bg-amber-50"}`} data-testid={`health-status-${donor.id}`}>
                        {donor.healthStatus === "DORMANT" ? "Dormant" : "At-Risk"} · {donor.daysSinceLastDonation}d
                      </Badge>
                    </div>
                    <div className="mt-2.5 ml-11 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Best time:</span> {donor.bestTimeToContact}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {staffActions.followUpDonors.length > 6 && <p className="text-xs text-muted-foreground text-center mt-2">+ {staffActions.followUpDonors.length - 6} more donors to follow up</p>}
          </section>
        )}

        {/* ── RECENT ACTIVITY ──────────────────────────────────────────────── */}
        {canSeeFinancialStats && (
          <section>
            <SectionHeader title="Recent Activity" subtitle="Latest donations and top contributors" icon={Activity} />
            <div className="grid gap-5 lg:grid-cols-2">

              {/* Recent Donations */}
              <ChartCard title="Recent Donations" subtitle="Latest transactions">
                {recentDonations.length > 0 ? (
                  <div className="space-y-2.5" data-testid="recent-donations-list">
                    {recentDonations.slice(0, 7).map((donation) => (
                      <Link key={donation.id} href={`/dashboard/donors/${donation.donorId}`}>
                        <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`donation-row-${donation.id}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center flex-shrink-0">
                              <IndianRupee className="h-3.5 w-3.5 text-orange-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{donation.donorName}</p>
                              <p className="text-xs text-muted-foreground">{donation.donorCode} · {formatMode(donation.mode)}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-semibold text-emerald-600">{formatCurrency(donation.amount)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(donation.date)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link href="/dashboard/donations">
                      <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-orange-600 hover:text-orange-700 cursor-pointer font-medium">
                        View all donations <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground" data-testid="empty-recent-donations">
                    <IndianRupee className="h-8 w-8 mb-2 opacity-30" /><p className="text-sm">No recent donations</p>
                  </div>
                )}
              </ChartCard>

              {/* Top Donors */}
              <ChartCard title="Top Donors This FY" subtitle="Highest contributors by total donation amount">
                {topDonors.length > 0 ? (
                  <div className="space-y-2.5" data-testid="top-donors-list">
                    {topDonors.slice(0, 7).map((donor, idx) => (
                      <Link key={donor.donorId} href={`/dashboard/donors/${donor.donorId}`}>
                        <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`top-donor-${donor.donorId}`}>
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40" : idx === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-800" : idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40" : "bg-muted text-muted-foreground"}`}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{donor.name}</p>
                            <p className="text-xs text-muted-foreground">{donor.donorCode} · {donor.donationCount} donation{donor.donationCount !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-orange-600">{formatCurrency(donor.totalAmount)}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link href="/dashboard/donors">
                      <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-orange-600 hover:text-orange-700 cursor-pointer font-medium">
                        View all donors <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground" data-testid="empty-top-donors">
                    <Users className="h-8 w-8 mb-2 opacity-30" /><p className="text-sm">No donor data yet</p>
                  </div>
                )}
              </ChartCard>
            </div>
          </section>
        )}

        {/* ── STAFF-ONLY VIEW ───────────────────────────────────────────────── */}
        {!canSeeFinancialStats && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/30 mb-4"><Activity className="h-10 w-10 text-blue-400" /></div>
            <h3 className="text-lg font-semibold">Welcome to Asha Kuteer</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm">Use the sidebar navigation to access your assigned modules and manage your daily tasks.</p>
            <Link href="/dashboard/daily-actions" className="mt-4">
              <Button className="gap-2"><CheckCircle2 className="h-4 w-4" />View Daily Actions</Button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
