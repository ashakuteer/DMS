"use client";

import { useEffect, useState } from "react";
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
  Heart, Lightbulb,
  Phone, Building2, Repeat, Zap, Star, Sparkles,
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
interface Insight { type: "positive" | "warning" | "info"; title: string; description: string; }
interface AdminInsight { type: string; title: string; description: string; }
interface InsightCard { key: string; title: string; count: number; description: string; type: "warning" | "info" | "positive" | "urgent"; }
interface UserProfile { id: string; name: string; email: string; role: string; }
interface DueReminder { id: string; donorId: string; donationId: string | null; type: string; title: string; description: string | null; dueDate: string; status: string; donor: { id: string; donorCode: string; firstName: string; lastName: string | null; primaryPhone: string | null; }; donation: { id: string; donationAmount: number; receiptNumber: string | null; donationDate: string; } | null; createdBy: { id: string; name: string; }; }
interface HomeMetric { homeType: string; homeLabel: string; beneficiaryCount: number; activeSponsorships: number; donationsReceived: number; }
interface ImpactData { summary: { totalBeneficiaries: number; totalDonors: number; activeSponsors: number; activeSponsorships: number; totalDonationsFY: number; totalCampaigns: number; }; homeMetrics: HomeMetric[]; }
interface RetentionData { summary: { totalDonors: number; repeatDonorCount: number; oneTimeDonorCount: number; lapsedDonorCount: number; overallRetentionPct: number; activeLast6Months: number }; }

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIMARY_TEAL  = "#5FA8A8";
const DARK_TEAL     = "#2C7A7A";
const LIGHT_BG      = "#F4FAFA";
const LIGHT_BORDER  = "#E6F4F4";
const ICON_BG       = "rgba(95,168,168,0.10)";
const CHART_COLORS  = [PRIMARY_TEAL, "#4A9090", "#6BBEBE", DARK_TEAL, "#3A7A7A", "#7BBABA"];
const HOME_COLORS: Record<string, string> = {
  ORPHAN_GIRLS: PRIMARY_TEAL,
  BLIND_BOYS:   DARK_TEAL,
  OLD_AGE:      "#4A9090",
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
function HeroBanner({
  userProfile,
  monthlyTarget,
  loading,
}: {
  userProfile: UserProfile | null;
  monthlyTarget: MonthlyTarget | null;
  loading: boolean;
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
      style={{
        background: `linear-gradient(130deg, ${DARK_TEAL} 0%, ${PRIMARY_TEAL} 100%)`,
        boxShadow: `0 8px 32px rgba(44,122,122,0.28)`,
      }}
      data-testid="hero-banner"
    >
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full opacity-10" style={{ background: "#ffffff" }} />
      <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full opacity-10" style={{ background: "#ffffff" }} />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">

          {/* Left — Greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm font-medium mb-1">{dayStr}</p>
            <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-1">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-white/80 text-sm">Asha Kuteer Foundation — NGO Dashboard</p>
          </div>

          {/* Right — Monthly Target mini card */}
          <div
            className="sm:w-80 rounded-xl p-5 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-white/80" />
                <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                  {monthName} Target
                </span>
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
                    style={{
                      width: `${Math.min(progressPct, 100)}%`,
                      background: achieved ? "#ffffff" : "rgba(255,255,255,0.85)",
                    }}
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
          ? { background: `linear-gradient(135deg, ${DARK_TEAL}, ${PRIMARY_TEAL})`, border: "none", boxShadow: `0 4px 16px rgba(44,122,122,0.28)` }
          : { background: "#FFFFFF", border: `1px solid ${LIGHT_BORDER}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }
      }
    >
      <CardContent className="p-5">
        <div
          className="inline-flex p-2 rounded-xl mb-3"
          style={{ background: highlight ? "rgba(255,255,255,0.18)" : ICON_BG }}
        >
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

// ─── Donor Distribution ───────────────────────────────────────────────────────
interface LocationBucket { key: string; label: string; count: number; description: string; }

function DonorDistributionSection({ loading }: { loading: boolean }) {
  const [buckets, setBuckets] = useState<LocationBucket[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const categories = [
      { key: "HYDERABAD",      label: "Hyderabad",       description: "City donors"         },
      { key: "TELANGANA_OTHER", label: "Telangana",       description: "Outside Hyderabad"   },
      { key: "INDIA_OTHER",    label: "India (Other)",   description: "Outside Telangana"   },
      { key: "INTERNATIONAL",  label: "International",   description: "Outside India"        },
    ];
    Promise.all(
      categories.map((c) =>
        fetchWithAuth(`/api/donors?locationCategory=${c.key}&limit=1`)
          .then((r) => r.json())
          .then((d) => ({ ...c, count: d.total ?? 0 }))
          .catch(() => ({ ...c, count: 0 }))
      )
    ).then((results) => { setBuckets(results); setFetching(false); });
  }, []);

  const geoColors = [PRIMARY_TEAL, DARK_TEAL, "#4A9090", "#6BBEBE"];

  return (
    <section>
      <SectionHeader title="Donor Distribution" subtitle="Geographic breakdown of all donors" icon={Users} />
      {loading || fetching ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {buckets.map((b, i) => {
            const color = geoColors[i] ?? PRIMARY_TEAL;
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
                  <p className="text-2xl font-bold leading-tight text-[#1E293B]" data-testid={`distribution-count-${b.key}`}>{b.count}</p>
                  <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{b.label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{b.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [monthlyTarget, setMonthlyTarget] = useState<MonthlyTarget | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [modeSplit, setModeSplit] = useState<ModeSplit[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [adminInsights, setAdminInsights] = useState<AdminInsight[]>([]);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [retentionData, setRetentionData] = useState<RetentionData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(true);
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
      setSlowLoading(true);
      setLoadError(false);
      try {
        const [profileData, summaryData] = await Promise.all([
          safeFetch<UserProfile>("/api/auth/profile"),
          safeFetch<{
            stats: Stats | null;
            monthlyTarget: MonthlyTarget | null;
            trends: MonthlyTrend[] | null;
            modeSplit: ModeSplit[] | null;
            insights: Insight[] | null;
            insightCards: InsightCard[] | null;
            impact: ImpactData | null;
            retention: RetentionData | null;
            adminInsights: AdminInsight[] | null;
            reminders: DueReminder[] | null;
          }>("/api/dashboard/summary"),
        ]);

        if (profileData) setUserProfile(profileData);

        if (summaryData) {
          if (summaryData.stats)           setStats(summaryData.stats);
          if (summaryData.monthlyTarget)   setMonthlyTarget(summaryData.monthlyTarget);
          if (summaryData.trends)          setTrends(summaryData.trends);
          if (summaryData.modeSplit)       setModeSplit(summaryData.modeSplit);
          if (summaryData.insights)        setInsights(summaryData.insights);
          if (summaryData.insightCards)    setInsightCards(summaryData.insightCards);
          if (summaryData.impact)          setImpactData(summaryData.impact);
          if (summaryData.retention)       setRetentionData(summaryData.retention);
          if (summaryData.adminInsights)   setAdminInsights(summaryData.adminInsights);
          if (summaryData.reminders)       setDueReminders(summaryData.reminders);
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

  const retentionPct  = retentionData?.summary.overallRetentionPct ?? 0;
  const sponsoredCount = impactData?.summary.activeSponsorships ?? 0;
  const totalDonors   = impactData?.summary.totalDonors ?? stats?.activeDonors ?? 0;

  return (
    <div className="min-h-screen" style={{ background: LIGHT_BG }}>
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* ── HERO BANNER ───────────────────────────────────────────────────── */}
        <HeroBanner
          userProfile={userProfile}
          monthlyTarget={monthlyTarget}
          loading={loading}
        />

        {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title={t("home.key_metrics")} subtitle={t("home.key_metrics_subtitle")} icon={BarChart3} />
          {loading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <KpiCard title={t("home.total_fy_donations")} value={stats ? fmt(stats.totalDonationsFY) : "—"} icon={IndianRupee} highlight />
                <KpiCard title={t("home.active_donors")} value={totalDonors > 0 ? totalDonors.toString() : (stats?.activeDonors?.toString() ?? "—")} icon={Users} />
                <KpiCard title={t("home.monthly_donors")} value={monthlyTarget ? monthlyTarget.totalMonthlyDonors.toString() : "—"} icon={Repeat} />
                <KpiCard title={t("home.total_beneficiaries")} value={stats?.totalBeneficiaries?.toString() ?? "—"} icon={HandHeart} />
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <KpiCard title={t("home.active_sponsors")} value={sponsoredCount > 0 ? sponsoredCount.toString() : "—"} icon={Heart} />
                <KpiCard title={t("home.retention_rate")} value={retentionPct > 0 ? `${retentionPct.toFixed(1)}%` : "—"} icon={TrendingUp} />
              </div>
            </div>
          )}
        </section>

        {/* ── DONOR DISTRIBUTION ────────────────────────────────────────────── */}
        <DonorDistributionSection loading={loading} />

        {/* ── CHARTS ────────────────────────────────────────────────────────── */}
        {(loading || trends.length > 0 || modeSplit.length > 0) && (
          <section>
            <SectionHeader title={t("home.donation_analytics")} subtitle={t("home.donation_analytics_subtitle")} icon={BarChart3} />
            {loading ? (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2"><Skeleton className="h-72 rounded-2xl" /></div>
                <Skeleton className="h-72 rounded-2xl" />
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ChartCard title={t("home.monthly_trend_chart")} subtitle={t("home.last_12_months")}>
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
                            <Line type="monotone" dataKey="amount" stroke={PRIMARY_TEAL} strokeWidth={2.5} dot={{ fill: PRIMARY_TEAL, strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: DARK_TEAL }} />
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
                <ChartCard title={t("home.payment_modes")} subtitle={t("home.fy_distribution")}>
                  {modeSplit.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={modeSplit} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="amount" nameKey="mode">
                            {modeSplit.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
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

        {/* ── HOME-WISE PERFORMANCE ─────────────────────────────────────────── */}
        {loading || slowLoading ? (
          <section>
            <SectionHeader title={t("home.home_performance")} subtitle={t("home.home_performance_subtitle")} icon={Building2} />
            <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
          </section>
        ) : impactData && impactData.homeMetrics.length > 0 ? (
          <section data-testid="section-home-performance">
            <SectionHeader title={t("home.home_performance")} subtitle={t("home.home_performance_subtitle")} icon={Building2} />
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
                    data-testid={`home-card-${home.homeType}`}
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

        {/* ── DONOR INTELLIGENCE + SMART INSIGHTS ──────────────────────────── */}
        {(loading || slowLoading || insights.length > 0 || insightCards.length > 0 || retentionData !== null || adminInsights.length > 0) && (
          <section>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <SectionHeader title={t("home.donor_intelligence")} subtitle={t("home.donor_intelligence_subtitle")} icon={Repeat} />
                {loading || slowLoading ? (
                  <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {retentionData && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { labelKey: "home.repeat_donors_count", value: retentionData.summary.repeatDonorCount,  color: PRIMARY_TEAL, bg: ICON_BG },
                          { labelKey: "home.lapsed_donors_count", value: retentionData.summary.lapsedDonorCount,  color: DARK_TEAL,    bg: LIGHT_BORDER },
                          { labelKey: "home.one_time_only",       value: retentionData.summary.oneTimeDonorCount, color: PRIMARY_TEAL, bg: ICON_BG },
                          { labelKey: "home.active_6mo",         value: retentionData.summary.activeLast6Months,  color: DARK_TEAL,    bg: LIGHT_BORDER },
                        ].map(({ labelKey, value, color, bg }) => (
                          <div key={labelKey} className="rounded-2xl p-3.5" style={{ background: bg }}>
                            <p className="text-xl font-bold" style={{ color }}>{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t(labelKey)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {insightCards.map((card) => {
                      const s = insightStyle(card.type);
                      const iconMap: Record<string, React.ElementType> = { follow_up_needed: Phone, high_value: Star, dormant: Clock, pledges_due: CalendarCheck };
                      const IconComp = iconMap[card.key] ?? Info;
                      return (
                        <div
                          key={card.key}
                          className={`flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/50 ${s.border}`}
                          data-testid={`insight-card-${card.key}`}
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
              </div>

              <div>
                <SectionHeader title={t("home.smart_insights")} subtitle={t("home.smart_insights_subtitle")} icon={Lightbulb} />
                {loading ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
                ) : (
                  <div className="space-y-2.5">
                    {[...insights.slice(0, 4), ...adminInsights.slice(0, 3)].map((insight, idx) => {
                      const s = insightStyle(insight.type);
                      return (
                        <div key={idx} className={`flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/50 ${s.border}`}>
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
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-20" />
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
            <SectionHeader
              title={t("home.followups_due")}
              subtitle={`${dueReminders.length} scheduled follow-up${dueReminders.length !== 1 ? "s" : ""} need action`}
              icon={Bell}
            />
            <div className="space-y-2.5">
              {dueReminders.slice(0, 6).map((r) => {
                const overdue = daysOverdue(r.dueDate);
                const name = [r.donor.firstName, r.donor.lastName].filter(Boolean).join(" ");
                return (
                  <Card
                    key={r.id}
                    style={{ border: `1px solid ${LIGHT_BORDER}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
                    data-testid={`reminder-${r.id}`}
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
                        <div className="flex gap-2">
                          {overdue > 0 && (
                            <Badge variant="outline" className="text-xs border-red-300 text-red-600 bg-red-50">{overdue}d overdue</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">Due {fmtDate(r.dueDate)}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 ml-11 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => window.location.href = `/dashboard/donors/${r.donorId}?tab=communication`}>
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
              {dueReminders.length > 6 && (
                <p className="text-xs text-muted-foreground text-center">+{dueReminders.length - 6} more follow-ups</p>
              )}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
