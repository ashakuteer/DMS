"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/auth";
import {
  Users, IndianRupee, HandHeart, TrendingUp, AlertTriangle, Info,
  ArrowUpRight, Clock, Target, CalendarCheck, CheckCircle2, Bell,
  Mail, MessageCircle, Check, BarChart3, RefreshCcw, WifiOff,
  UserPlus, PlusCircle, FileText, Heart, Lightbulb, ChevronRight,
  Activity, Phone, Building2, Repeat, Zap, Star, Sparkles,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats { totalDonationsFY: number; donationsThisMonth: number; activeDonors: number; totalBeneficiaries: number; }
interface MonthlyTarget { raised: number; count: number; totalMonthlyDonors: number; target: number; remaining: number; progressPct: number; achieved: boolean; }
interface MonthlyTrend { month: string; amount: number; count: number; }
interface ModeSplit { mode: string; amount: number; count: number; }
interface TopDonor { donorId: string; donorCode: string; name: string; category: string; totalAmount: number; donationCount: number; }
interface RecentDonation { id: string; donorId: string; donorCode: string; donorName: string; amount: number; date: string; mode: string; type: string; receiptNumber: string; }
interface Insight { type: "positive" | "warning" | "info"; title: string; description: string; }
interface AdminInsight { type: string; title: string; description: string; }
interface InsightCard { key: string; title: string; count: number; description: string; type: "warning" | "info" | "positive" | "urgent"; }
interface FollowUpDonor { id: string; name: string; donorCode: string; phone: string; daysSinceLastDonation: number; healthStatus: "AT_RISK" | "DORMANT"; bestTimeToContact: string; followUpReason: string; }
interface StaffActionsData { followUpDonors: FollowUpDonor[]; atRiskCount: number; dormantCount: number; bestCallTime: { day: string; slot: string }; summary: { total: number; atRisk: number; dormant: number }; }
interface UserProfile { id: string; name: string; email: string; role: string; }
interface DueReminder { id: string; donorId: string; donationId: string | null; type: string; title: string; description: string | null; dueDate: string; status: string; donor: { id: string; donorCode: string; firstName: string; lastName: string | null; primaryPhone: string | null; }; donation: { id: string; donationAmount: number; receiptNumber: string | null; donationDate: string; } | null; createdBy: { id: string; name: string; }; }
interface HomeMetric { homeType: string; homeLabel: string; beneficiaryCount: number; activeSponsorships: number; donationsReceived: number; }
interface ImpactData { summary: { totalBeneficiaries: number; totalDonors: number; activeSponsors: number; activeSponsorships: number; totalDonationsFY: number; totalCampaigns: number; }; homeMetrics: HomeMetric[]; }
interface RetentionData { summary: { totalDonors: number; repeatDonorCount: number; oneTimeDonorCount: number; lapsedDonorCount: number; overallRetentionPct: number; activeLast6Months: number }; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CHART_COLORS = ["#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];
const HOME_COLORS: Record<string, string> = { ORPHAN_GIRLS: "#f97316", BLIND_BOYS: "#3b82f6", OLD_AGE: "#10b981" };

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtMode = (m: string) =>
  ({ CASH: "Cash", UPI: "UPI", GPAY: "GPay", PHONEPE: "PhonePe", BANK_TRANSFER: "Bank Transfer", CHEQUE: "Cheque", ONLINE: "Online" }[m] ?? m);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const daysOverdue = (d: string) =>
  Math.max(0, Math.ceil((Date.now() - new Date(d).getTime()) / 86400000));

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetchWithAuth(url);
    if (res.ok) return res.json() as Promise<T>;
    return null;
  } catch { return null; }
}

// ─── NGO Hero Illustration ────────────────────────────────────────────────────
function HeroIllustration() {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-xl">
      {/* Photo — natural colors, no overlays */}
      <img
        src="/brand/hands-together.jpg"
        alt="Community hands joined together — unity and support"
        className="w-full h-full object-cover object-center"
      />

      {/* Floating heart badge */}
      <div
        className="absolute top-3 right-3 flex items-center justify-center rounded-full shadow-lg z-10"
        style={{ width: 44, height: 44, background: "linear-gradient(135deg, #f97316, #ea580c)" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, color, highlight }: {
  title: string; value: string; icon: React.ElementType; color: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600" : "border-0 shadow-sm"}>
      <CardContent className="p-5">
        <div className={`inline-flex p-2 rounded-xl mb-3 ${highlight ? "bg-white/20" : "bg-muted/60"}`}>
          <Icon className={`h-4 w-4 ${highlight ? "text-white" : color}`} />
        </div>
        <p className={`text-2xl font-bold leading-tight ${highlight ? "text-white" : "text-foreground"}`}>{value}</p>
        <p className={`text-xs mt-1 font-medium ${highlight ? "text-orange-100" : "text-muted-foreground"}`}>{title}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {Icon && <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 mt-0.5 flex-shrink-0"><Icon className="h-4 w-4 text-orange-500" /></div>}
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

function insightStyle(type: string) {
  switch (type) {
    case "positive": return { border: "border-l-2 border-l-emerald-400", icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" /> };
    case "warning": return { border: "border-l-2 border-l-amber-400", icon: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" /> };
    case "urgent": return { border: "border-l-2 border-l-red-400", icon: <Zap className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" /> };
    default: return { border: "border-l-2 border-l-blue-400", icon: <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" /> };
  }
}

// ─── Monthly Target Card ──────────────────────────────────────────────────────
function MonthlyTargetCard({ data, loading }: { data: MonthlyTarget | null; loading: boolean }) {
  const now = new Date();
  const monthName = now.toLocaleString("en-IN", { month: "long" });

  if (loading) return <Skeleton className="h-44 rounded-2xl" />;
  if (!data) return null;

  const { raised, count, totalMonthlyDonors, target, remaining, progressPct, achieved } = data;
  const pendingDonors = totalMonthlyDonors - count;

  return (
    <Card className="border-0 shadow-md overflow-hidden" data-testid="monthly-target-card">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-950/40">
                <Target className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Monthly Donor Target</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{monthName} — From monthly recurring donors</p>
          </div>
          {achieved ? (
            <Badge className="bg-emerald-500 text-white border-0 gap-1 flex-shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Target Achieved!
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 flex-shrink-0">
              {progressPct}% of goal
            </Badge>
          )}
        </div>

        {/* Big numbers row */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-2xl font-black text-orange-600">{fmt(raised)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Raised this month</p>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{fmt(target)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly goal</p>
          </div>
          <div>
            <p className={`text-2xl font-black ${achieved ? "text-emerald-600" : "text-rose-500"}`}>{achieved ? "✓ Done" : fmt(remaining)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{achieved ? "Goal reached" : "Still needed"}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{progressPct}% complete</span>
            <span>{fmt(raised)} / {fmt(target)}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${achieved ? "bg-emerald-500" : "bg-gradient-to-r from-orange-400 to-orange-600"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Donor stats row */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-muted-foreground"><strong className="text-foreground">{count}</strong> of <strong className="text-foreground">{totalMonthlyDonors}</strong> monthly donors paid</span>
          </div>
          {pendingDonors > 0 && (
            <Link href="/dashboard/donors?frequency=MONTHLY" className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium ml-auto">
              {pendingDonors} still pending <ChevronRight className="h-3 w-3" />
            </Link>
          )}
          {achieved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium ml-auto">
              <Sparkles className="h-3 w-3" /> Congratulations!
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyTarget, setMonthlyTarget] = useState<MonthlyTarget | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [modeSplit, setModeSplit] = useState<ModeSplit[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [adminInsights, setAdminInsights] = useState<AdminInsight[]>([]);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [staffActions, setStaffActions] = useState<StaffActionsData | null>(null);
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [retentionData, setRetentionData] = useState<RetentionData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();

  const role = userProfile?.role ?? "";
  const isActionRole = ["ADMIN", "STAFF", "TELECALLER"].includes(role);

  const handleMarkDone = async (r: DueReminder) => {
    try {
      const res = await fetchWithAuth(`/api/reminders/${r.id}/complete`, { method: "PATCH" });
      if (res.ok) {
        setDueReminders((prev) => prev.filter((x) => x.id !== r.id));
        toast({ title: "Done", description: `Follow-up for ${r.donor.firstName} marked complete` });
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleSnooze = async (r: DueReminder) => {
    try {
      const res = await fetchWithAuth(`/api/reminders/${r.id}/snooze`, { method: "PATCH" });
      if (res.ok) {
        setDueReminders((prev) => prev.filter((x) => x.id !== r.id));
        toast({ title: "Snoozed 30 days" });
      }
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const handleWhatsApp = async (r: DueReminder) => {
    const phone = r.donor.primaryPhone?.replace(/\D/g, "") ?? "";
    if (!phone) { toast({ title: "No phone number", variant: "destructive" }); return; }
    try {
      const res = await fetchWithAuth("/api/communications/whatsapp/send-freeform", {
        method: "POST",
        body: JSON.stringify({ donorId: r.donorId, toE164: phone, message: `Hello ${r.donor.firstName}, this is a follow-up from Asha Kuteer Foundation. We hope you are doing well!` }),
      });
      toast(res.ok ? { title: "WhatsApp sent" } : { title: "Failed to send", variant: "destructive" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSlowLoading(true);
      setLoadError(false);
      try {
        // Single request — backend runs all sections in parallel
        const [profileData, summaryData] = await Promise.all([
          safeFetch<UserProfile>("/api/auth/profile"),
          safeFetch<{
            stats: Stats | null;
            monthlyTarget: MonthlyTarget | null;
            trends: MonthlyTrend[] | null;
            modeSplit: ModeSplit[] | null;
            topDonors: TopDonor[] | null;
            recentDonations: RecentDonation[] | null;
            insights: Insight[] | null;
            insightCards: InsightCard[] | null;
            impact: ImpactData | null;
            retention: RetentionData | null;
            staffActions: StaffActionsData | null;
            adminInsights: AdminInsight[] | null;
            reminders: DueReminder[] | null;
          }>("/api/dashboard/summary"),
        ]);

        if (profileData) setUserProfile(profileData);

        if (summaryData) {
          if (summaryData.stats) setStats(summaryData.stats);
          if (summaryData.monthlyTarget) setMonthlyTarget(summaryData.monthlyTarget);
          if (summaryData.trends) setTrends(summaryData.trends);
          if (summaryData.modeSplit) setModeSplit(summaryData.modeSplit);
          if (summaryData.topDonors) setTopDonors(summaryData.topDonors);
          if (summaryData.recentDonations) setRecentDonations(summaryData.recentDonations);
          if (summaryData.insights) setInsights(summaryData.insights);
          if (summaryData.insightCards) setInsightCards(summaryData.insightCards);
          if (summaryData.impact) setImpactData(summaryData.impact);
          if (summaryData.retention) setRetentionData(summaryData.retention);
          if (summaryData.staffActions) setStaffActions(summaryData.staffActions);
          if (summaryData.adminInsights) setAdminInsights(summaryData.adminInsights);
          if (summaryData.reminders) setDueReminders(summaryData.reminders);
        }
      } catch {
        setLoadError(true);
        toast({ title: "Dashboard load failed", description: "Could not connect to the server.", variant: "destructive" });
      } finally {
        setLoading(false);
        setSlowLoading(false);
      }
    };
    load();
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="border-0 shadow-sm max-w-sm w-full mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center"><div className="p-4 rounded-full bg-red-50"><WifiOff className="h-8 w-8 text-red-400" /></div></div>
            <div>
              <h3 className="text-base font-semibold">Connection Error</h3>
              <p className="text-sm text-muted-foreground mt-1">Could not connect to the server. Please try again.</p>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full"><RefreshCcw className="h-4 w-4 mr-2" />Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const retentionPct = retentionData?.summary.overallRetentionPct ?? 0;
  const sponsoredCount = impactData?.summary.activeSponsorships ?? 0;
  const followUpCount = insightCards.find(c => c.key === "follow_up_needed")?.count ?? staffActions?.summary.total ?? 0;
  const totalDonors = impactData?.summary.totalDonors ?? stats?.activeDonors ?? 0;

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f2847 0%, #1a4480 45%, #1d4ed8 100%)" }}
        >
          {/* Background depth circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white opacity-[0.03]" />
            <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-400 opacity-[0.04]" />
            <div className="absolute -bottom-16 right-1/4 w-64 h-64 rounded-full bg-white opacity-[0.03]" />
            <div className="absolute top-6 right-56 w-2 h-2 rounded-full bg-orange-400 opacity-40" />
            <div className="absolute bottom-8 left-16 w-1.5 h-1.5 rounded-full bg-orange-300 opacity-30" />
            <div className="absolute top-16 left-1/2 w-1 h-1 rounded-full bg-white opacity-25" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-10 px-8 md:px-12 py-12 md:py-16">
            {/* Left: Text */}
            <div className="flex-1 min-w-0">
              <h1
                className="font-black text-white tracking-tight"
                style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.5rem)", lineHeight: 1.12 }}
              >
                Making a<br />
                <span style={{ color: "#fb923c" }}>Difference,</span><br />
                Together.
              </h1>
              <p className="mt-5 max-w-lg" style={{ color: "rgba(219,234,254,0.9)", fontSize: "1.05rem", lineHeight: 1.8 }}>
                Welcome to{" "}
                <strong className="text-white font-semibold">Asha Kuteer Foundation</strong>{" "}
                Donor Management System.{" "}
                <span style={{ color: "rgba(191,219,254,0.85)" }}>
                  Track donors, donations, sponsorships, homes, and impact — all in one place.
                </span>
              </p>
            </div>

            {/* Right: Photo with soft glow */}
            <div className="relative w-full md:w-[380px] lg:w-[440px] flex-shrink-0">
              {/* Warm glow halo behind image */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ margin: "-12px", background: "radial-gradient(ellipse at center, rgba(251,146,60,0.18) 0%, transparent 70%)", filter: "blur(16px)" }}
              />
              <div className="relative h-[240px] md:h-[290px]">
                <HeroIllustration />
              </div>
            </div>
          </div>
        </div>

        {/* ── MONTHLY DONOR TARGET ──────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Monthly Donor Target"
            subtitle={`₹3,00,000 / month from recurring monthly donors — ${new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })}`}
            icon={Target}
          />
          <MonthlyTargetCard data={monthlyTarget} loading={loading} />
        </section>

        {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Key Metrics" subtitle="Financial year and current month overview" icon={BarChart3} />
          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <KpiCard title="Total FY Donations" value={stats ? fmt(stats.totalDonationsFY) : "—"} icon={IndianRupee} color="text-orange-500" highlight />
                <KpiCard title="This Month" value={stats ? fmt(stats.donationsThisMonth) : "—"} icon={TrendingUp} color="text-blue-600" />
                <KpiCard title="Total Donors" value={totalDonors > 0 ? totalDonors.toString() : (stats?.activeDonors?.toString() ?? "—")} icon={Users} color="text-violet-600" />
                <KpiCard title="Monthly Donors" value={monthlyTarget ? monthlyTarget.totalMonthlyDonors.toString() : "—"} icon={Repeat} color="text-teal-600" />
              </div>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <KpiCard title="Beneficiaries" value={stats?.totalBeneficiaries?.toString() ?? "—"} icon={HandHeart} color="text-rose-600" />
                <KpiCard title="Active Sponsors" value={sponsoredCount > 0 ? sponsoredCount.toString() : "—"} icon={Heart} color="text-pink-600" />
                <KpiCard title="Retention Rate" value={retentionPct > 0 ? `${retentionPct.toFixed(1)}%` : "—"} icon={Repeat} color="text-emerald-600" />
                <KpiCard title="Pending Follow-ups" value={followUpCount > 0 ? followUpCount.toString() : "—"} icon={Bell} color="text-amber-600" />
              </div>
            </div>
          )}
        </section>


        {/* ── CHARTS ────────────────────────────────────────────────────────── */}
        {(loading || trends.length > 0 || modeSplit.length > 0) && (
          <section>
            <SectionHeader title="Donation Analytics" subtitle="Trends and payment distribution" icon={BarChart3} />
            {loading ? (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2"><Skeleton className="h-72 rounded-xl" /></div>
                <Skeleton className="h-72 rounded-xl" />
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ChartCard title="Monthly Donation Trend" subtitle="Last 12 months">
                    {trends.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-50" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={45} />
                            <Tooltip formatter={(v: number) => [fmt(v), "Amount"]} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                            <Line type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: "#ea580c" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mb-3 opacity-25" />
                        <p className="text-sm font-medium">No trend data yet</p>
                        <p className="text-xs mt-1 opacity-60">Appears once donations are recorded</p>
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
                            {modeSplit.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                          <Legend formatter={(v) => fmtMode(v)} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                      <IndianRupee className="h-10 w-10 mb-3 opacity-25" />
                      <p className="text-sm font-medium">No payment data yet</p>
                    </div>
                  )}
                </ChartCard>
              </div>
            )}
          </section>
        )}

        {/* ── HOME-WISE PERFORMANCE ─────────────────────────────────────────── */}
        {loading || slowLoading ? (
          <section>
            <SectionHeader title="Home-wise Performance" subtitle="Impact across all homes" icon={Building2} />
            <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
          </section>
        ) : impactData && impactData.homeMetrics.length > 0 ? (
          <section data-testid="section-home-performance">
            <SectionHeader title="Home-wise Performance" subtitle="Impact and donations across all Asha Kuteer homes this FY" icon={Building2} />
            <div className="grid gap-4 md:grid-cols-3">
              {impactData.homeMetrics.map((home) => {
                const color = HOME_COLORS[home.homeType] ?? "#6366f1";
                const pct = home.beneficiaryCount > 0 ? Math.round((home.activeSponsorships / home.beneficiaryCount) * 100) : 0;
                const unsponsored = Math.max(0, home.beneficiaryCount - home.activeSponsorships);
                return (
                  <Card key={home.homeType} className="border-0 shadow-sm overflow-hidden" data-testid={`home-card-${home.homeType}`}>
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">{home.homeLabel}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{home.beneficiaryCount} beneficiaries</p>
                        </div>
                        <div className="p-2 rounded-xl" style={{ backgroundColor: color + "20" }}>
                          <Building2 className="h-4 w-4" style={{ color }} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Sponsorship</span>
                            <span className="font-semibold" style={{ color }}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-base font-bold">{home.activeSponsorships}</p>
                            <p className="text-xs text-muted-foreground">Sponsored</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-base font-bold">{unsponsored}</p>
                            <p className="text-xs text-muted-foreground">Unspon.</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-base font-bold" style={{ color }}>{home.donationsReceived > 0 ? `₹${Math.round(home.donationsReceived / 1000)}k` : "—"}</p>
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
        ) : null}

        {/* ── DONOR INTELLIGENCE + SMART INSIGHTS ──────────────────────────── */}
        {(loading || slowLoading || insights.length > 0 || insightCards.length > 0 || retentionData !== null || adminInsights.length > 0) && (
          <section>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <SectionHeader title="Donor Intelligence" subtitle="Retention and engagement" icon={Repeat} />
                {loading || slowLoading ? (
                  <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {retentionData && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Repeat Donors", value: retentionData.summary.repeatDonorCount, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                          { label: "Lapsed Donors", value: retentionData.summary.lapsedDonorCount, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
                          { label: "One-time Only", value: retentionData.summary.oneTimeDonorCount, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
                          { label: "Active (6 mo)", value: retentionData.summary.activeLast6Months, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                        ].map(({ label, value, color, bg }) => (
                          <div key={label} className={`rounded-xl p-3.5 ${bg}`}>
                            <p className={`text-xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {insightCards.map((card) => {
                      const s = insightStyle(card.type);
                      const iconMap: Record<string, React.ElementType> = { follow_up_needed: Phone, high_value: Star, dormant: Clock, pledges_due: CalendarCheck };
                      const IconComp = iconMap[card.key] ?? Info;
                      return (
                        <div key={card.key} className={`flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60 ${s.border}`} data-testid={`insight-card-${card.key}`}>
                          <div className="p-1.5 rounded-lg bg-muted/60 flex-shrink-0"><IconComp className="h-3.5 w-3.5 text-muted-foreground" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{card.count}</span>
                              <span className="text-sm font-medium truncate">{card.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <SectionHeader title="Smart Insights" subtitle="AI-powered observations for action" icon={Lightbulb} />
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
                ) : (
                  <div className="space-y-2.5">
                    {[...insights.slice(0, 4), ...adminInsights.slice(0, 3)].map((insight, idx) => {
                      const s = insightStyle(insight.type);
                      return (
                        <div key={idx} className={`flex items-start gap-3 p-4 rounded-xl bg-card border border-border/60 ${s.border}`}>
                          {s.icon}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.description}</p>
                          </div>
                        </div>
                      );
                    })}
                    {insights.length === 0 && adminInsights.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-25" />
                        <p className="text-sm">Insights appear as data grows</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── FOLLOW-UPS DUE ────────────────────────────────────────────────── */}
        {dueReminders.length > 0 && (
          <section data-testid="section-followups">
            <SectionHeader title="Follow-ups Due" subtitle={`${dueReminders.length} scheduled follow-ups need action`} icon={Bell} />
            <div className="space-y-2.5">
              {dueReminders.slice(0, 6).map((r) => {
                const overdue = daysOverdue(r.dueDate);
                const name = [r.donor.firstName, r.donor.lastName].filter(Boolean).join(" ");
                return (
                  <Card key={r.id} className="border-0 shadow-sm" data-testid={`reminder-${r.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30"><Bell className="h-4 w-4 text-orange-500" /></div>
                          <div>
                            <p className="text-sm font-semibold">{name}</p>
                            <p className="text-xs text-muted-foreground">{r.donor.donorCode} · {r.title}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {overdue > 0 && <Badge variant="outline" className="text-xs border-red-400 text-red-600 bg-red-50">{overdue}d overdue</Badge>}
                          <Badge variant="secondary" className="text-xs">Due {fmtDate(r.dueDate)}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 ml-11 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => window.location.href = `/dashboard/donors/${r.donorId}?tab=communication`}><Mail className="h-3 w-3" />Email</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleWhatsApp(r)}><MessageCircle className="h-3 w-3" />WhatsApp</Button>
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleMarkDone(r)}><Check className="h-3 w-3" />Done</Button>
                        <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => handleSnooze(r)}><Clock className="h-3 w-3" />Snooze</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {dueReminders.length > 6 && <p className="text-xs text-muted-foreground text-center">+{dueReminders.length - 6} more follow-ups</p>}
            </div>
          </section>
        )}

        {/* ── NEXT BEST ACTIONS ─────────────────────────────────────────────── */}
        {isActionRole && staffActions && staffActions.followUpDonors.length > 0 && (
          <section data-testid="section-staff-actions">
            <SectionHeader title="Next Best Actions" subtitle="Donors to follow up based on inactivity" icon={Target} />
            <div className="grid gap-3 md:grid-cols-2">
              {staffActions.followUpDonors.slice(0, 6).map((d) => (
                <Card key={d.id} className="border-0 shadow-sm" data-testid={`followup-donor-${d.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${d.healthStatus === "DORMANT" ? "bg-red-50 dark:bg-red-950/30" : "bg-amber-50 dark:bg-amber-950/30"}`}>
                          <Phone className={`h-4 w-4 ${d.healthStatus === "DORMANT" ? "text-red-500" : "text-amber-500"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.donorCode} · {d.phone}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${d.healthStatus === "DORMANT" ? "border-red-400 text-red-600 bg-red-50" : "border-amber-400 text-amber-600 bg-amber-50"}`}>
                        {d.healthStatus === "DORMANT" ? "Dormant" : "At-Risk"} · {d.daysSinceLastDonation}d
                      </Badge>
                    </div>
                    <div className="mt-2.5 ml-11 text-xs text-muted-foreground">
                      Best time: <span className="font-medium text-foreground">{d.bestTimeToContact}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── RECENT ACTIVITY ───────────────────────────────────────────────── */}
        {(loading || recentDonations.length > 0 || topDonors.length > 0) && (
          <section>
            <SectionHeader title="Recent Activity" subtitle="Latest donations and top contributors" icon={Activity} />
            {loading ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <ChartCard title="Recent Donations" subtitle="Latest transactions">
                  {recentDonations.length > 0 ? (
                    <div className="space-y-1" data-testid="recent-donations-list">
                      {recentDonations.slice(0, 7).map((d) => (
                        <Link key={d.id} href={`/dashboard/donors/${d.donorId}`}>
                          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`donation-row-${d.id}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center flex-shrink-0">
                                <IndianRupee className="h-3.5 w-3.5 text-orange-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{d.donorName}</p>
                                <p className="text-xs text-muted-foreground">{d.donorCode} · {fmtMode(d.mode)}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="text-sm font-semibold text-emerald-600">{fmt(d.amount)}</p>
                              <p className="text-xs text-muted-foreground">{fmtDate(d.date)}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      <Link href="/dashboard/donations">
                        <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-orange-600 hover:text-orange-700 cursor-pointer font-medium rounded-lg hover:bg-orange-50/50 transition-colors">
                          View all donations <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <IndianRupee className="h-8 w-8 mb-2 opacity-25" /><p className="text-sm">No recent donations</p>
                    </div>
                  )}
                </ChartCard>

                <ChartCard title="Top Donors This FY" subtitle="Highest contributors">
                  {topDonors.length > 0 ? (
                    <div className="space-y-1" data-testid="top-donors-list">
                      {topDonors.slice(0, 7).map((d, idx) => (
                        <Link key={d.donorId} href={`/dashboard/donors/${d.donorId}`}>
                          <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group" data-testid={`top-donor-${d.donorId}`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-gray-100 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}`}>{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{d.name}</p>
                              <p className="text-xs text-muted-foreground">{d.donorCode} · {d.donationCount} donation{d.donationCount !== 1 ? "s" : ""}</p>
                            </div>
                            <p className="text-sm font-semibold text-orange-600 flex-shrink-0">{fmt(d.totalAmount)}</p>
                          </div>
                        </Link>
                      ))}
                      <Link href="/dashboard/donors">
                        <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-orange-600 hover:text-orange-700 cursor-pointer font-medium rounded-lg hover:bg-orange-50/50 transition-colors">
                          View all donors <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Users className="h-8 w-8 mb-2 opacity-25" /><p className="text-sm">No donor data yet</p>
                    </div>
                  )}
                </ChartCard>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
