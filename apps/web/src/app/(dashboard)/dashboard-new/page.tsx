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
  Clock, Target, CalendarCheck, CheckCircle2, Bell,
  Mail, MessageCircle, Check, BarChart3, RefreshCcw, WifiOff,
  Heart, ChevronRight, Building2, Repeat, Zap, Sparkles,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useTranslation } from "react-i18next";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats { totalDonationsFY: number; donationsThisMonth: number; activeDonors: number; totalBeneficiaries: number; }
interface MonthlyTarget { raised: number; count: number; totalMonthlyDonors: number; target: number; remaining: number; progressPct: number; achieved: boolean; }
interface MonthlyTrend { month: string; amount: number; count: number; }
interface ModeSplit { mode: string; amount: number; count: number; }
interface InsightCard { key: string; title: string; count: number; description: string; type: "warning" | "info" | "positive" | "urgent"; }
interface StaffActionsData { followUpDonors: unknown[]; atRiskCount: number; dormantCount: number; bestCallTime: { day: string; slot: string }; summary: { total: number; atRisk: number; dormant: number }; }
interface UserProfile { id: string; name: string; email: string; role: string; }
interface DueReminder { id: string; donorId: string; donationId: string | null; type: string; title: string; description: string | null; dueDate: string; status: string; donor: { id: string; donorCode: string; firstName: string; lastName: string | null; primaryPhone: string | null; }; donation: { id: string; donationAmount: number; receiptNumber: string | null; donationDate: string; } | null; createdBy: { id: string; name: string; }; }
interface HomeMetric { homeType: string; homeLabel: string; beneficiaryCount: number; activeSponsorships: number; donationsReceived: number; }
interface ImpactData { summary: { totalBeneficiaries: number; totalDonors: number; activeSponsors: number; activeSponsorships: number; totalDonationsFY: number; totalCampaigns: number; }; homeMetrics: HomeMetric[]; }
interface RetentionData { summary: { totalDonors: number; repeatDonorCount: number; oneTimeDonorCount: number; lapsedDonorCount: number; overallRetentionPct: number; activeLast6Months: number }; }
interface Insight { type: "positive" | "warning" | "info"; title: string; description: string; }
interface AdminInsight { type: string; title: string; description: string; }
interface LocationBucket { key: string; label: string; count: number; description: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY_TEAL = "#5FA8A8";
const DARK_TEAL    = "#2C7A7A";
const LIGHT_BG     = "#F4FAFA";
const LIGHT_BORDER = "#E6F4F4";
const ICON_BG      = "rgba(95,168,168,0.10)";
const CHART_COLORS = [PRIMARY_TEAL, "#4A9090", "#6BBEBE", DARK_TEAL, "#3A7A7A", "#7BBABA"];
const GEO_COLORS   = [PRIMARY_TEAL, DARK_TEAL, "#4A9090", "#6BBEBE"];
const HOME_COLORS: Record<string, string> = {
  ORPHAN_HOME:    PRIMARY_TEAL,
  OLD_AGE_HOME:   DARK_TEAL,
  WOMENS_SHELTER: "#4A9090",
  TRIBAL_SCHOOL:  "#6BBEBE",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ userProfile, monthlyTarget, loading }: {
  userProfile: UserProfile | null; monthlyTarget: MonthlyTarget | null; loading: boolean;
}) {
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  const firstName = userProfile?.name?.split(" ")[0] ?? "Founder";
  const dayStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const monthName = now.toLocaleString("en-IN", { month: "long" });
  const progressPct = monthlyTarget?.progressPct ?? 0;
  const achieved    = monthlyTarget?.achieved ?? false;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: `linear-gradient(130deg, ${DARK_TEAL} 0%, ${PRIMARY_TEAL} 100%)`, boxShadow: "0 8px 32px rgba(44,122,122,0.28)" }}
      data-testid="hero-banner-new"
    >
      <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-10" style={{ background: "#ffffff" }} />
      <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full opacity-10" style={{ background: "#ffffff" }} />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm font-medium mb-1">{dayStr}</p>
            <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-1">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-white/80 text-sm">Asha Kuteer Foundation — New Dashboard</p>
          </div>
          <div
            className="sm:w-80 rounded-xl p-5 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-white/80" />
                <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">{monthName} Target</span>
              </div>
              {loading ? (
                <Skeleton className="h-5 w-16 rounded-full bg-white/20" />
              ) : achieved ? (
                <Badge className="bg-white/25 text-white border-0 text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Achieved
                </Badge>
              ) : (
                <span className="text-white font-bold text-sm">{progressPct}%</span>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 bg-white/20 rounded" />
                <Skeleton className="h-2 w-full bg-white/20 rounded-full" />
                <Skeleton className="h-4 w-40 bg-white/20 rounded" />
              </div>
            ) : monthlyTarget ? (
              <>
                <div className="flex items-baseline gap-1.5 mb-2.5">
                  <span className="text-white text-xl font-black">{fmt(monthlyTarget.raised)}</span>
                  <span className="text-white/60 text-sm">/ {fmt(monthlyTarget.target)}</span>
                </div>
                <div className="h-2 rounded-full mb-2.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(progressPct, 100)}%`, background: achieved ? "#ffffff" : "rgba(255,255,255,0.85)" }}
                  />
                </div>
                <p className="text-white/75 text-xs">
                  <span className="text-white font-semibold">{monthlyTarget.count}</span> of{" "}
                  <span className="text-white font-semibold">{monthlyTarget.totalMonthlyDonors}</span> monthly donors paid
                  {!achieved && monthlyTarget.remaining > 0 && (
                    <> · <span className="text-white font-semibold">{fmt(monthlyTarget.remaining)}</span> remaining</>
                  )}
                  {achieved && <span className="ml-1"><Sparkles className="inline h-3 w-3" /></span>}
                </p>
              </>
            ) : (
              <p className="text-white/60 text-xs">No monthly target data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, highlight = false }: {
  title: string; value: string; icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <Card
      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={
        highlight
          ? { background: `linear-gradient(135deg, ${DARK_TEAL}, ${PRIMARY_TEAL})`, border: "none", boxShadow: "0 4px 16px rgba(44,122,122,0.28)" }
          : { background: "#FFFFFF", border: `1px solid ${LIGHT_BORDER}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }
      }
    >
      <CardContent className="p-5">
        <div className="inline-flex p-2 rounded-xl mb-3" style={{ background: highlight ? "rgba(255,255,255,0.18)" : ICON_BG }}>
          <Icon className="h-4 w-4" style={{ color: highlight ? "#ffffff" : PRIMARY_TEAL }} />
        </div>
        <p className={`text-2xl font-bold leading-tight ${highlight ? "text-white" : "text-[#1E293B]"}`}>{value}</p>
        <p className={`text-xs mt-1 font-medium ${highlight ? "text-white/75" : "text-[#64748B]"}`}>{title}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      {Icon && (
        <div className="p-2 rounded-xl mt-0.5 flex-shrink-0" style={{ background: ICON_BG }}>
          <Icon className="h-4 w-4" style={{ color: PRIMARY_TEAL }} />
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold" style={{ color: DARK_TEAL }}>{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card style={{ border: `1px solid ${LIGHT_BORDER}`, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
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
    case "positive": return { border: `border-l-2 border-l-[${PRIMARY_TEAL}]`, icon: <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: PRIMARY_TEAL }} /> };
    case "warning":  return { border: `border-l-2 border-l-[${PRIMARY_TEAL}]`, icon: <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: PRIMARY_TEAL }} /> };
    case "urgent":   return { border: `border-l-2 border-l-[${DARK_TEAL}]`,    icon: <Zap className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: DARK_TEAL }} /> };
    default:         return { border: `border-l-2 border-l-[${PRIMARY_TEAL}]`, icon: <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: PRIMARY_TEAL }} /> };
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardNewPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyTarget, setMonthlyTarget] = useState<MonthlyTarget | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [modeSplit, setModeSplit] = useState<ModeSplit[]>([]);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [staffActions, setStaffActions] = useState<StaffActionsData | null>(null);
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [retentionData, setRetentionData] = useState<RetentionData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [adminInsights, setAdminInsights] = useState<AdminInsight[]>([]);
  const [geoData, setGeoData] = useState<LocationBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();

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
      setLoadError(false);
      try {
        const [profileData, summaryData] = await Promise.all([
          safeFetch<UserProfile>("/api/auth/profile"),
          safeFetch<{
            stats: Stats | null;
            monthlyTarget: MonthlyTarget | null;
            trends: MonthlyTrend[] | null;
            modeSplit: ModeSplit[] | null;
            insightCards: InsightCard[] | null;
            impact: ImpactData | null;
            retention: RetentionData | null;
            staffActions: StaffActionsData | null;
            adminInsights: AdminInsight[] | null;
            reminders: DueReminder[] | null;
            insights: Insight[] | null;
          }>("/api/dashboard/summary"),
        ]);

        if (profileData) setUserProfile(profileData);
        if (summaryData) {
          if (summaryData.stats)          setStats(summaryData.stats);
          if (summaryData.monthlyTarget)  setMonthlyTarget(summaryData.monthlyTarget);
          if (summaryData.trends)         setTrends(summaryData.trends);
          if (summaryData.modeSplit)      setModeSplit(summaryData.modeSplit);
          if (summaryData.insightCards)   setInsightCards(summaryData.insightCards);
          if (summaryData.impact)         setImpactData(summaryData.impact);
          if (summaryData.retention)      setRetentionData(summaryData.retention);
          if (summaryData.staffActions)   setStaffActions(summaryData.staffActions);
          if (summaryData.reminders)      setDueReminders(summaryData.reminders);
          if (summaryData.insights)       setInsights(summaryData.insights);
          if (summaryData.adminInsights)  setAdminInsights(summaryData.adminInsights);
        }
      } catch {
        setLoadError(true);
        toast({ title: "Dashboard load failed", description: "Could not connect to the server.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const categories = [
      { key: "HYDERABAD",       label: "Hyderabad",     description: "City donors"       },
      { key: "TELANGANA_OTHER", label: "Telangana",     description: "Outside Hyderabad" },
      { key: "INDIA_OTHER",     label: "India (Other)", description: "Outside Telangana" },
      { key: "INTERNATIONAL",   label: "International", description: "Outside India"     },
    ];
    Promise.all(
      categories.map((c) =>
        fetchWithAuth(`/api/donors?locationCategory=${c.key}&limit=1`)
          .then((r) => r.json())
          .then((d) => ({ ...c, count: d.total ?? 0 }))
          .catch(() => ({ ...c, count: 0 }))
      )
    ).then((results) => { setGeoData(results); setGeoLoading(false); });
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-sm w-full mx-4" style={{ border: `1px solid ${LIGHT_BORDER}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-red-50"><WifiOff className="h-8 w-8 text-red-400" /></div>
            </div>
            <div>
              <h3 className="text-base font-semibold">{t("home.connection_error")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("home.connection_error_desc")}</p>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCcw className="h-4 w-4 mr-2" />{t("home.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const retentionPct    = retentionData?.summary.overallRetentionPct ?? 0;
  const sponsoredCount  = impactData?.summary.activeSponsorships ?? 0;
  const totalDonors     = impactData?.summary.totalDonors ?? stats?.activeDonors ?? 0;
  const followUpCount   = insightCards.find(c => c.key === "follow_up_needed")?.count ?? staffActions?.summary.total ?? 0;

  return (
    <div className="min-h-screen" style={{ background: LIGHT_BG }}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
        <HeroBanner userProfile={userProfile} monthlyTarget={monthlyTarget} loading={loading} />

        {/* ── 2. KPI ROW (6 cards) ──────────────────────────────────────────── */}
        <section data-testid="section-kpi-new">
          <SectionHeader title="Key Metrics" subtitle="Live snapshot of foundation performance" icon={BarChart3} />
          {loading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <KpiCard
                title="Total FY Donations"
                value={stats ? fmt(stats.totalDonationsFY) : "—"}
                icon={IndianRupee}
                highlight
              />
              <KpiCard
                title="Active Donors"
                value={totalDonors > 0 ? totalDonors.toString() : (stats?.activeDonors?.toString() ?? "—")}
                icon={Users}
              />
              <KpiCard
                title="Monthly Donors"
                value={monthlyTarget ? monthlyTarget.totalMonthlyDonors.toString() : "—"}
                icon={Repeat}
              />
              <KpiCard
                title="Beneficiaries"
                value={stats?.totalBeneficiaries?.toString() ?? "—"}
                icon={HandHeart}
              />
              <KpiCard
                title="Active Sponsors"
                value={sponsoredCount > 0 ? sponsoredCount.toString() : "—"}
                icon={Heart}
              />
              <KpiCard
                title="Retention Rate"
                value={retentionPct > 0 ? `${retentionPct.toFixed(1)}%` : "—"}
                icon={TrendingUp}
              />
            </div>
          )}
        </section>

        {/* ── 3. MONTHLY TREND + PIE CHART ──────────────────────────────────── */}
        {(loading || trends.length > 0 || modeSplit.length > 0) && (
          <section data-testid="section-charts-new">
            <SectionHeader title="Donation Analytics" subtitle="Trends and payment breakdown for this financial year" icon={BarChart3} />
            {loading ? (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2"><Skeleton className="h-72 rounded-2xl" /></div>
                <Skeleton className="h-72 rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">

                {/* Monthly Trend */}
                <div className="lg:col-span-2">
                  <ChartCard title="Monthly Trend" subtitle="Last 12 months">
                    {trends.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-50" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                            <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={45} />
                            <Tooltip
                              formatter={(v: number) => [fmt(v), "Amount"]}
                              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }}
                            />
                            <Line
                              type="monotone"
                              dataKey="amount"
                              stroke={PRIMARY_TEAL}
                              strokeWidth={2.5}
                              dot={{ fill: PRIMARY_TEAL, strokeWidth: 0, r: 3 }}
                              activeDot={{ r: 5, fill: DARK_TEAL }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No trend data yet</p>
                        <p className="text-xs mt-1 opacity-60">Appears once donations are recorded</p>
                      </div>
                    )}
                  </ChartCard>
                </div>

                {/* Pie Chart */}
                <ChartCard title="Payment Modes" subtitle="FY distribution">
                  {modeSplit.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={modeSplit}
                            cx="50%" cy="45%"
                            innerRadius={50} outerRadius={80}
                            paddingAngle={3}
                            dataKey="amount" nameKey="mode"
                          >
                            {modeSplit.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip
                            formatter={(v: number) => fmt(v)}
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }}
                          />
                          <Legend formatter={(v) => fmtMode(v)} wrapperStyle={{ fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                      <IndianRupee className="h-10 w-10 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No payment data yet</p>
                    </div>
                  )}
                </ChartCard>

              </div>
            )}
          </section>
        )}

        {/* ── 4. HOME-WISE PERFORMANCE ──────────────────────────────────────── */}
        {loading ? (
          <section>
            <SectionHeader title="Home-wise Performance" subtitle="Beneficiary and sponsorship breakdown by home" icon={Building2} />
            <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
          </section>
        ) : impactData && impactData.homeMetrics.length > 0 ? (
          <section data-testid="section-home-performance-new">
            <SectionHeader title="Home-wise Performance" subtitle="Beneficiary and sponsorship breakdown by home" icon={Building2} />
            <div className="grid gap-4 md:grid-cols-3">
              {impactData.homeMetrics.map((home) => {
                const color = HOME_COLORS[home.homeType] ?? PRIMARY_TEAL;
                const pct = home.beneficiaryCount > 0 ? Math.round((home.activeSponsorships / home.beneficiaryCount) * 100) : 0;
                const unsponsored = Math.max(0, home.beneficiaryCount - home.activeSponsorships);
                return (
                  <Card
                    key={home.homeType}
                    className="overflow-hidden"
                    style={{ border: `1px solid ${LIGHT_BORDER}`, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
                    data-testid={`home-card-new-${home.homeType}`}
                  >
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">{home.homeLabel}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{home.beneficiaryCount} beneficiaries</p>
                        </div>
                        <div className="p-2 rounded-xl" style={{ backgroundColor: color + "1A" }}>
                          <Building2 className="h-4 w-4" style={{ color }} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Sponsorship coverage</span>
                            <span className="font-semibold" style={{ color }}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 rounded-xl bg-muted/50">
                            <p className="text-base font-bold">{home.activeSponsorships}</p>
                            <p className="text-xs text-muted-foreground">Sponsored</p>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-muted/50">
                            <p className="text-base font-bold">{unsponsored}</p>
                            <p className="text-xs text-muted-foreground">Unspon.</p>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-muted/50">
                            <p className="text-base font-bold" style={{ color }}>
                              {home.donationsReceived > 0 ? `₹${Math.round(home.donationsReceived / 1000)}k` : "—"}
                            </p>
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

        {/* ── 5. RETENTION + DONOR DISTRIBUTION ────────────────────────────── */}
        <section data-testid="section-retention-geo-new">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Retention */}
            <div>
              <SectionHeader title="Donor Retention" subtitle="Health of your donor base" icon={Repeat} />
              {loading ? (
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
              ) : retentionData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Repeat Donors",     value: retentionData.summary.repeatDonorCount,  color: PRIMARY_TEAL, bg: ICON_BG },
                      { label: "Lapsed Donors",     value: retentionData.summary.lapsedDonorCount,  color: DARK_TEAL,    bg: LIGHT_BORDER },
                      { label: "Active (6 mo)",     value: retentionData.summary.activeLast6Months, color: DARK_TEAL,    bg: LIGHT_BORDER },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className="rounded-2xl p-4" style={{ background: bg }}>
                        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                  {retentionPct > 0 && (
                    <div className="rounded-2xl p-4" style={{ border: `1px solid ${LIGHT_BORDER}`, background: "#fff" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Overall Retention Rate</span>
                        <span className="text-lg font-bold" style={{ color: DARK_TEAL }}>{retentionPct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: LIGHT_BORDER }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(retentionPct, 100)}%`, background: PRIMARY_TEAL }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Insight Cards */}
                  {insightCards.length > 0 && (
                    <div className="space-y-2">
                      {insightCards.slice(0, 3).map((card) => {
                        const s = insightStyle(card.type);
                        const iconMap: Record<string, React.ElementType> = {
                          follow_up_needed: Bell,
                          high_value: Heart,
                          dormant: Clock,
                          pledges_due: CalendarCheck,
                        };
                        const IconComp = iconMap[card.key] ?? Info;
                        return (
                          <div
                            key={card.key}
                            className={`flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/50 ${s.border}`}
                            data-testid={`insight-card-new-${card.key}`}
                          >
                            <div className="p-1.5 rounded-lg bg-muted/60 flex-shrink-0">
                              <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
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
                  {/* Smart Insights */}
                  {[...insights.slice(0, 2), ...adminInsights.slice(0, 1)].map((insight, idx) => {
                    const s = insightStyle(insight.type);
                    return (
                      <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/50 ${s.border}`}>
                        {s.icon}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{insight.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No retention data available.</p>
              )}
            </div>

            {/* Donor Distribution */}
            <div>
              <SectionHeader title="Donor Distribution" subtitle="Geographic breakdown of all donors" icon={Users} />
              {geoLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {geoData.map((b, i) => {
                    const color = GEO_COLORS[i] ?? PRIMARY_TEAL;
                    return (
                      <Card
                        key={b.key}
                        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        style={{ border: `1px solid ${color}28`, background: `${color}0D`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
                      >
                        <CardContent className="p-5">
                          <div className="inline-flex p-2 rounded-xl mb-3" style={{ background: `${color}22` }}>
                            <Building2 className="h-4 w-4" style={{ color }} />
                          </div>
                          <p className="text-2xl font-bold leading-tight text-[#1E293B]" data-testid={`geo-count-new-${b.key}`}>{b.count}</p>
                          <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{b.label}</p>
                          <p className="text-xs text-[#64748B] mt-0.5">{b.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Follow-up count callout */}
              {!loading && followUpCount > 0 && (
                <div
                  className="mt-4 rounded-2xl p-5 flex items-center justify-between"
                  style={{ background: `rgba(44,122,122,0.13)`, border: `1.5px solid ${PRIMARY_TEAL}`, boxShadow: `0 2px 10px rgba(44,122,122,0.14)` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ background: `rgba(44,122,122,0.16)` }}>
                      <Bell className="h-5 w-5" style={{ color: DARK_TEAL }} />
                    </div>
                    <div>
                      <p className="text-base font-bold" style={{ color: DARK_TEAL }}>{followUpCount} Pending Follow-ups</p>
                      <p className="text-xs font-medium" style={{ color: PRIMARY_TEAL }}>Donors needing attention</p>
                    </div>
                  </div>
                  <Link href="/dashboard/reminders">
                    <Button size="sm" className="text-xs h-8 font-semibold gap-1" style={{ background: DARK_TEAL, color: "#fff", border: "none" }}>
                      View <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── 5. FOLLOW-UP LIST ─────────────────────────────────────────────── */}
        {(loading || dueReminders.length > 0) && (
          <section data-testid="section-followups-new">
            <SectionHeader
              title="Follow-ups Due"
              subtitle="Donors requiring contact — mark done or snooze"
              icon={Bell}
            />
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : dueReminders.length === 0 ? (
              <Card style={{ border: `1px solid ${LIGHT_BORDER}` }}>
                <CardContent className="p-10 text-center">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: PRIMARY_TEAL }} />
                  <p className="text-sm font-medium text-muted-foreground">All follow-ups are clear</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {dueReminders.slice(0, 8).map((r) => {
                  const name = [r.donor.firstName, r.donor.lastName].filter(Boolean).join(" ");
                  const overdue = daysOverdue(r.dueDate);
                  return (
                    <Card
                      key={r.id}
                      style={{ border: `1px solid ${LIGHT_BORDER}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
                      data-testid={`followup-new-${r.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ background: ICON_BG }}>
                              <Bell className="h-4 w-4" style={{ color: PRIMARY_TEAL }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{name}</p>
                              <p className="text-xs text-muted-foreground">{r.donor.donorCode} · {r.title}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {overdue > 0 && (
                              <Badge variant="outline" className="text-xs border-red-300 text-red-600 bg-red-50">{overdue}d overdue</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">Due {fmtDate(r.dueDate)}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 ml-11 flex-wrap">
                          <Button
                            size="sm" variant="outline" className="h-7 text-xs gap-1"
                            onClick={() => window.location.href = `/dashboard/donors/${r.donorId}?tab=communication`}
                          >
                            <Mail className="h-3 w-3" />Email
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleWhatsApp(r)}>
                            <MessageCircle className="h-3 w-3" />WhatsApp
                          </Button>
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleMarkDone(r)}>
                            <Check className="h-3 w-3" />Done
                          </Button>
                          <Button size="sm" variant="secondary" className="h-7 text-xs gap-1" onClick={() => handleSnooze(r)}>
                            <Clock className="h-3 w-3" />Snooze
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {dueReminders.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{dueReminders.length - 8} more follow-ups
                  </p>
                )}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
