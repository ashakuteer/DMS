"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useTranslation } from "react-i18next";
import {
  Users, IndianRupee, TrendingUp, TrendingDown,
  AlertTriangle, Calendar, HandHeart, FileDown,
  Loader2, ExternalLink, Copy, Mail, Check,
  ArrowUpRight, ArrowDownRight, Filter,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, Area, AreaChart,
} from "recharts";
import Link from "next/link";

const CHART_COLORS = [
  "#5FA8A8",
  "#7FAFD4",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
  "#6366f1",
  "#ec4899",
];

const CARD_STYLES: React.CSSProperties[] = [
  { background: "linear-gradient(135deg, #5FA8A8, #6FAFD4)", border: "none", boxShadow: "0 6px 18px rgba(95,168,168,0.25)" },
  { background: "linear-gradient(135deg, #5FA8A8, #6FAFD4)", border: "none", boxShadow: "0 6px 18px rgba(95,168,168,0.25)" },
  { background: "#FFFFFF", border: "1px solid #EEF2F7", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  { background: "#FFFFFF", border: "1px solid #EEF2F7", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
];
const CARD_STYLE_STANDARD: React.CSSProperties = { background: "#FFFFFF", border: "1px solid #EEF2F7", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const homeLabels: Record<string, string> = {
  GIRLS_HOME: "Girls Home",
  BLIND_BOYS_HOME: "Blind Boys Home",
  OLD_AGE_HOME: "Old Age Home",
  GENERAL: "General",
  UNSPECIFIED: "Not Specified",
  ORPHAN_GIRLS: "Girls Home",
  BLIND_BOYS: "Blind Boys Home",
  OLD_AGE: "Old Age Home",
};

const typeLabels: Record<string, string> = {
  CASH: "Cash",
  ANNADANAM: "Annadanam",
  GROCERIES: "Groceries",
  GROCERY: "Grocery",
  MEDICINES: "Medicines",
  RICE_BAGS: "Rice Bags",
  STATIONERY: "Stationery",
  SPORTS_KITS: "Sports Kits",
  USED_ITEMS: "Used Items",
  PREPARED_FOOD: "Prepared Food",
  KIND: "In-Kind",
  OTHER: "Other",
};

const occasionLabels: Record<string, string> = {
  DOB_SELF: "Birthday",
  DOB_SPOUSE: "Spouse Birthday",
  DOB_CHILD: "Child Birthday",
  ANNIVERSARY: "Anniversary",
  DEATH_ANNIVERSARY: "Death Anniversary",
  OTHER: "Other",
};

interface Summary {
  totalDonors: number;
  donationsThisMonth: number;
  donationsThisMonthTrend: number | null;
  donationsT12: number;
  donationCountThisMonth: number;
  donationCountTrend: number | null;
  activeSponsorships: number;
  activeSponsorshipsMonthlyTotal: number;
  overdueSponsorships: number;
  pledgesPendingCount: number;
  pledgesPendingAmount: number;
  donorsWithSpecialDaysNext30: number;
  donorsAtRisk: number;
}

interface MonthlyData {
  month: string;
  amount: number;
  count: number;
}

interface TypeData {
  type: string;
  amount: number;
  count: number;
}

interface HomeData {
  home: string;
  amount: number;
  count: number;
}

interface SponsorshipDueChart {
  month: string;
  activeDue: number;
  overdue: number;
}

interface Charts {
  monthlyDonations: MonthlyData[];
  donationsByType: TypeData[];
  donationsByHome: HomeData[];
  sponsorshipsDue: SponsorshipDueChart[];
}

interface TopDonor {
  donorId: string;
  donorCode: string;
  donorName: string;
  totalAmount: number;
  count: number;
  lastDonationDate: string | null;
}

interface AtRiskDonor {
  donorId: string;
  donorCode: string;
  donorName: string;
  lastDonationDate: string;
  expectedNextDate: string;
  riskLevel: string;
  overdueDays: number;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

interface PledgeItem {
  id: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  pledgeType: string;
  amount: number | null;
  quantity: string | null;
  expectedDate: string;
  status: string;
  notes: string | null;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

interface SponsorshipDue {
  id: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryCode: string;
  homeType: string;
  amount: number;
  dueDay: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  status: string;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

interface SpecialDay {
  id: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  type: string;
  relatedPersonName: string | null;
  date: string;
  month: number;
  day: number;
  assignedStaff: string | null;
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
      data-testid="trend-badge"
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(Math.round(value))}%
    </span>
  );
}

function KPICard({
  title, value, subtitle, trend, icon: Icon, testId, cardStyle,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number | null;
  icon: React.ElementType;
  testId: string;
  cardStyle?: React.CSSProperties;
}) {
  const isGradient = cardStyle && typeof cardStyle.background === "string" && cardStyle.background.includes("5FA8A8") && cardStyle.background.includes("135deg");
  return (
    <Card data-testid={testId} style={cardStyle} className="border-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${isGradient ? "text-white/80" : "text-muted-foreground"}`}>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${isGradient ? "text-white/70" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`text-2xl font-bold ${isGradient ? "text-white" : ""}`} data-testid={`${testId}-value`}>{value}</span>
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
        {subtitle && <p className={`text-xs mt-1 ${isGradient ? "text-white/70" : "text-muted-foreground"}`}>{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function WhatsAppCopyButton({ phone, message, testId }: { phone?: string; message: string; testId: string }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    if (phone) {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={handleClick} data-testid={testId}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <SiWhatsapp className="h-3.5 w-3.5" />}
    </Button>
  );
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [activeTab, setActiveTab] = useState("top");
  const [segmentData, setSegmentData] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingSegment, setLoadingSegment] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const defaultFrom = new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()).toISOString().split("T")[0];
  const defaultTo = new Date().toISOString().split("T")[0];
  const [exportFrom, setExportFrom] = useState(defaultFrom);
  const [exportTo, setExportTo] = useState(defaultTo);
  const [exportHome, setExportHome] = useState("all");
  const [exportType, setExportType] = useState("all");

  // Fetch functions defined with useCallback before useEffect so closure captures them correctly
  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const res = await fetchWithAuth("/api/analytics/summary");
      if (res.status === 401) throw new Error("Session expired. Please log in again.");
      if (res.status === 403) throw new Error("You do not have permission to view analytics.");
      if (!res.ok) throw new Error(`Failed to fetch summary (${res.status})`);
      setSummary(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Analytics Error", description: err.message });
    } finally {
      setLoadingSummary(false);
    }
  }, [toast]);

  const fetchCharts = useCallback(async () => {
    setLoadingCharts(true);
    try {
      const res = await fetchWithAuth("/api/analytics/charts");
      if (res.status === 401) throw new Error("Session expired. Please log in again.");
      if (res.status === 403) throw new Error("You do not have permission to view analytics.");
      if (!res.ok) throw new Error(`Failed to fetch charts (${res.status})`);
      setCharts(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Analytics Error", description: err.message });
    } finally {
      setLoadingCharts(false);
    }
  }, [toast]);

  const fetchSegment = useCallback(async (segment: string) => {
    setLoadingSegment(true);
    try {
      const res = await fetchWithAuth(`/api/analytics/segments?segment=${segment}`);
      if (!res.ok) throw new Error(`Failed to fetch segment data (${res.status})`);
      setSegmentData(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Analytics Error", description: err.message });
    } finally {
      setLoadingSegment(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSummary();
    fetchCharts();
  }, [fetchSummary, fetchCharts]);

  useEffect(() => {
    fetchSegment(activeTab);
  }, [activeTab, fetchSegment]);

  if (user && !canAccessModule(user?.role, 'analytics')) return <AccessDenied />;

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const endpoint = type === "pdf" ? "/api/analytics/export/pdf" : `/api/analytics/export/xlsx?type=${type === "risk-xlsx" ? "risk" : "donations"}`;
      const res = await fetchWithAuth(endpoint);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = type === "pdf" ? "pdf" : "xlsx";
      const name = type === "risk-xlsx" ? "donors-at-risk" : type === "pdf" ? "analytics-summary" : "donations-analytics";
      a.download = `${name}-${new Date().toISOString().split("T")[0]}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Export complete", description: "File downloaded successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export failed", description: err.message });
    } finally {
      setExporting(null);
    }
  };

  const handleDonationsExport = async () => {
    setExporting("donations-xlsx");
    setShowExportModal(false);
    try {
      const params = new URLSearchParams();
      if (exportFrom) params.set("from", exportFrom);
      if (exportTo) params.set("to", exportTo);
      if (exportHome !== "all") params.set("home", exportHome);
      if (exportType !== "all") params.set("type", exportType);
      const res = await fetchWithAuth(`/api/analytics/donations/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `donations-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Export complete", description: "Donations Excel downloaded." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export failed", description: err.message });
    } finally {
      setExporting(null);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-md border bg-popover p-2 text-popover-foreground shadow-md text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {typeof p.value === "number" && p.name !== "Count" ? fmtCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-analytics-title">{t("analytics.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("analytics.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            data-testid="button-export-pdf"
          >
            {exporting === "pdf" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            {t("analytics.export_summary_pdf")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            disabled={!!exporting}
            data-testid="button-export-donations-xlsx"
          >
            {exporting === "donations-xlsx" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            {t("analytics.export_donations_excel")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("risk-xlsx")}
            disabled={!!exporting}
            data-testid="button-export-risk-xlsx"
          >
            {exporting === "risk-xlsx" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            {t("analytics.export_at_risk_excel")}
          </Button>
        </div>
      </div>

      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-24 mb-2" /><Skeleton className="h-4 w-32" /></CardContent></Card>
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KPICard title={t("analytics.total_donors")} value={summary.totalDonors.toLocaleString("en-IN")} icon={Users} testId="kpi-total-donors" cardStyle={CARD_STYLES[0]} />
          <KPICard
            title={t("analytics.donations_this_month")}
            value={fmtCurrency(summary.donationsThisMonth)}
            trend={summary.donationsThisMonthTrend}
            subtitle={t("analytics.vs_last_month")}
            icon={IndianRupee}
            testId="kpi-donations-month"
            cardStyle={CARD_STYLES[1]}
          />
          <KPICard title={t("analytics.trailing_12_months")} value={fmtCurrency(summary.donationsT12)} icon={TrendingUp} testId="kpi-donations-t12" cardStyle={CARD_STYLES[2]} />
          <KPICard
            title={t("analytics.donation_count")}
            value={summary.donationCountThisMonth.toLocaleString("en-IN")}
            trend={summary.donationCountTrend}
            subtitle={t("analytics.this_month")}
            icon={IndianRupee}
            testId="kpi-donation-count"
            cardStyle={CARD_STYLES[3]}
          />
          <KPICard
            title={t("analytics.active_sponsorships")}
            value={String(summary.activeSponsorships)}
            subtitle={`${fmtCurrency(summary.activeSponsorshipsMonthlyTotal)}/mo`}
            icon={HandHeart}
            testId="kpi-active-sponsorships"
            cardStyle={CARD_STYLE_STANDARD}
          />
          <KPICard
            title={t("analytics.overdue_sponsorships")}
            value={String(summary.overdueSponsorships)}
            subtitle={t("analytics.past_due_this_month")}
            icon={AlertTriangle}
            testId="kpi-overdue-sponsorships"
            cardStyle={CARD_STYLE_STANDARD}
          />
          <KPICard
            title={t("analytics.pledges_pending")}
            value={String(summary.pledgesPendingCount)}
            subtitle={fmtCurrency(summary.pledgesPendingAmount)}
            icon={Calendar}
            testId="kpi-pledges-pending"
            cardStyle={CARD_STYLE_STANDARD}
          />
          <KPICard
            title={t("analytics.special_days_30d")}
            value={String(summary.donorsWithSpecialDaysNext30)}
            subtitle={t("analytics.donors_with_upcoming_events")}
            icon={Calendar}
            testId="kpi-special-days"
            cardStyle={CARD_STYLE_STANDARD}
          />
          <KPICard
            title={t("analytics.donors_at_risk")}
            value={String(summary.donorsAtRisk)}
            subtitle={t("analytics.need_re_engagement")}
            icon={AlertTriangle}
            testId="kpi-at-risk"
            cardStyle={CARD_STYLE_STANDARD}
          />
        </div>
      )}

      {loadingCharts ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="lg:col-span-2" data-testid="chart-monthly-donations">
            <CardHeader>
              <CardTitle className="text-base">{t("analytics.donations_by_month")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={charts.monthlyDonations}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="amount"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis yAxisId="count" orientation="right" className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    yAxisId="amount"
                    type="monotone"
                    dataKey="amount"
                    name="Amount"
                    stroke={CHART_COLORS[0]}
                    fill={CHART_COLORS[0]}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="count"
                    name="Count"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="chart-donations-type">
            <CardHeader>
              <CardTitle className="text-base">{t("analytics.donations_by_type_fy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={charts.donationsByType.map((d) => ({ ...d, label: typeLabels[d.type] || d.type }))}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {charts.donationsByType.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="chart-donations-home">
            <CardHeader>
              <CardTitle className="text-base">{t("analytics.donations_by_home_fy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.donationsByHome.map((d) => ({ ...d, label: homeLabels[d.home] || d.home }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                  <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                    {charts.donationsByHome.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2" data-testid="chart-sponsorships-due">
            <CardHeader>
              <CardTitle className="text-base">{t("analytics.sponsorships_due_vs_overdue")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={charts.sponsorshipsDue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activeDue" name="Active Due" stackId="a" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" stackId="a" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card data-testid="card-segments">
        <CardHeader>
          <CardTitle className="text-base">{t("analytics.donor_segments")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="top" data-testid="tab-top-donors">{t("analytics.tab_top_donors")}</TabsTrigger>
              <TabsTrigger value="risk" data-testid="tab-at-risk">{t("analytics.tab_at_risk")}</TabsTrigger>
              <TabsTrigger value="pledges" data-testid="tab-pledges">{t("analytics.tab_pledges")}</TabsTrigger>
              <TabsTrigger value="sponsorships" data-testid="tab-sponsorships">{t("analytics.tab_sponsorships")}</TabsTrigger>
              <TabsTrigger value="specialdays" data-testid="tab-special-days">{t("analytics.tab_special_days")}</TabsTrigger>
            </TabsList>

            {loadingSegment ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <TabsContent value="top">
                  <TopDonorsTable data={segmentData as TopDonor[]} />
                </TabsContent>
                <TabsContent value="risk">
                  <AtRiskTable data={segmentData as AtRiskDonor[]} />
                </TabsContent>
                <TabsContent value="pledges">
                  <PledgesTable data={segmentData as PledgeItem[]} />
                </TabsContent>
                <TabsContent value="sponsorships">
                  <SponsorshipsDueTable data={segmentData as SponsorshipDue[]} />
                </TabsContent>
                <TabsContent value="specialdays">
                  <SpecialDaysTable data={segmentData as SpecialDay[]} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-export-donations">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("analytics.export_donations_title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="export-from">{t("analytics.export_from")}</Label>
                <Input
                  id="export-from"
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  data-testid="input-export-from"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="export-to">{t("analytics.export_to")}</Label>
                <Input
                  id="export-to"
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  data-testid="input-export-to"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("analytics.export_home")}</Label>
              <Select value={exportHome} onValueChange={setExportHome}>
                <SelectTrigger data-testid="select-export-home">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("analytics.export_all_homes")}</SelectItem>
                  <SelectItem value="GIRLS_HOME">Girls Home</SelectItem>
                  <SelectItem value="BLIND_BOYS_HOME">Blind Boys Home</SelectItem>
                  <SelectItem value="OLD_AGE_HOME">Old Age Home</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("analytics.export_type")}</Label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger data-testid="select-export-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("analytics.export_all_types")}</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="GROCERIES">Groceries</SelectItem>
                  <SelectItem value="RICE_BAGS">Rice Bags</SelectItem>
                  <SelectItem value="STATIONERY">Stationery</SelectItem>
                  <SelectItem value="MEDICINES">Medicines</SelectItem>
                  <SelectItem value="ANNADANAM">Annadanam</SelectItem>
                  <SelectItem value="SPORTS_KITS">Sports Kits</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExportModal(false)} data-testid="button-export-cancel">
              {t("analytics.export_cancel")}
            </Button>
            <Button onClick={handleDonationsExport} data-testid="button-export-download">
              <FileDown className="h-4 w-4 mr-2" />
              {t("analytics.export_download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TopDonorsTable({ data }: { data: TopDonor[] }) {
  const { t } = useTranslation();
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-top-donors">{t("analytics.no_data")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-top-donors">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">#</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.donor")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{t("analytics.amount")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{t("analytics.count")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.last_donation")}</th>
            <th className="pb-2 font-medium text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.donorId} className="border-b last:border-0" data-testid={`row-top-donor-${i}`}>
              <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
              <td className="py-2.5 pr-4">
                <div className="font-medium">{d.donorName}</div>
                <div className="text-xs text-muted-foreground">{d.donorCode}</div>
              </td>
              <td className="py-2.5 pr-4 text-right font-medium">{fmtCurrency(d.totalAmount)}</td>
              <td className="py-2.5 pr-4 text-right">{d.count}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(d.lastDonationDate)}</td>
              <td className="py-2.5">
                <Link href={`/dashboard/donors/${d.donorId}`}>
                  <Button variant="ghost" size="sm" data-testid={`button-view-donor-${i}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AtRiskTable({ data }: { data: AtRiskDonor[] }) {
  const { t } = useTranslation();
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-risk">{t("analytics.no_data")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-at-risk">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.donor")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.last_donation")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("common.expected_next", "Expected Next")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.risk_score")}</th>
            <th className="pb-2 font-medium text-muted-foreground">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.donorId} className="border-b last:border-0" data-testid={`row-risk-donor-${i}`}>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${d.donorId}`} className="hover:underline">
                  <div className="font-medium">{d.donorName}</div>
                  <div className="text-xs text-muted-foreground">{d.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(d.lastDonationDate)}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(d.expectedNextDate)}</td>
              <td className="py-2.5 pr-4">
                <Badge
                  variant={d.riskLevel === "High" ? "destructive" : d.riskLevel === "Medium" ? "secondary" : "outline"}
                  data-testid={`badge-risk-${i}`}
                >
                  {d.riskLevel}
                </Badge>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {d.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={`Dear ${d.donorName}, we hope you're doing well! We miss your generous support at Asha Kuteer Foundation. Your contributions make a real difference in the lives of our beneficiaries. Would you like to continue supporting our cause?`}
                      testId={`button-wa-risk-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${d.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-risk-${i}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PledgesTable({ data }: { data: PledgeItem[] }) {
  const { t } = useTranslation();
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-pledges">{t("analytics.no_data")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-pledges">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.donor")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.export_type")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{t("analytics.amount")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.due_date")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.status")}</th>
            <th className="pb-2 font-medium text-muted-foreground">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.id ?? `${p.donorId}-${i}`} className="border-b last:border-0" data-testid={`row-pledge-${i}`}>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${p.donorId}`} className="hover:underline">
                  <div className="font-medium">{p.donorName}</div>
                  <div className="text-xs text-muted-foreground">{p.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4">{p.pledgeType}</td>
              <td className="py-2.5 pr-4 text-right font-medium">
                {p.amount ? fmtCurrency(p.amount) : p.quantity || "-"}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(p.expectedDate)}</td>
              <td className="py-2.5 pr-4">
                <Badge variant={p.status === "PENDING" ? "secondary" : "outline"} data-testid={`badge-pledge-${i}`}>
                  {p.status}
                </Badge>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {p.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={`Dear ${p.donorName}, this is a gentle reminder about your pledge of ${p.amount ? fmtCurrency(p.amount) : p.quantity} to Asha Kuteer Foundation, due on ${fmtDate(p.expectedDate)}. We appreciate your generous commitment!`}
                      testId={`button-wa-pledge-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${p.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-pledge-${i}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SponsorshipsDueTable({ data }: { data: SponsorshipDue[] }) {
  const { t } = useTranslation();
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-sponsorships">{t("analytics.no_data")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-sponsorships-due">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.donor")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("beneficiaries.title")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.home")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{t("analytics.amount")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">{t("analytics.due_date")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.status")}</th>
            <th className="pb-2 font-medium text-muted-foreground">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr
              key={s.id}
              className={`border-b last:border-0 ${s.isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""}`}
              data-testid={`row-sponsorship-${i}`}
            >
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${s.donorId}`} className="hover:underline">
                  <div className="font-medium">{s.donorName}</div>
                  <div className="text-xs text-muted-foreground">{s.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/beneficiaries/${s.beneficiaryId}`} className="hover:underline">
                  <div>{s.beneficiaryName}</div>
                  <div className="text-xs text-muted-foreground">{s.beneficiaryCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{homeLabels[s.homeType] || s.homeType}</td>
              <td className="py-2.5 pr-4 text-right font-medium">{fmtCurrency(s.amount)}</td>
              <td className="py-2.5 pr-4 text-right">{s.dueDay}</td>
              <td className="py-2.5 pr-4">
                <Badge
                  variant={s.isOverdue ? "destructive" : "secondary"}
                  data-testid={`badge-sponsorship-${i}`}
                >
                  {s.status === "OVERDUE" ? "Overdue" : "Due Soon"}
                </Badge>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {s.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={`Dear ${s.donorName}, this is a gentle reminder that your monthly sponsorship of ${fmtCurrency(s.amount)} for ${s.beneficiaryName} is due on the ${s.dueDay}${s.dueDay === 1 ? "st" : s.dueDay === 2 ? "nd" : s.dueDay === 3 ? "rd" : "th"} of this month. Thank you for your continued support!`}
                      testId={`button-wa-sponsorship-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${s.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-sponsorship-${i}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpecialDaysTable({ data }: { data: SpecialDay[] }) {
  const { t } = useTranslation();
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-special-days">{t("analytics.no_data")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-special-days">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.donor")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.date")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("analytics.event_type")}</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">{t("common.assigned_staff", "Assigned Staff")}</th>
            <th className="pb-2 font-medium text-muted-foreground">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={s.id} className="border-b last:border-0" data-testid={`row-special-day-${i}`}>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${s.donorId}`} className="hover:underline">
                  <div className="font-medium">{s.donorName}</div>
                  <div className="text-xs text-muted-foreground">{s.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4">{fmtDate(s.date)}</td>
              <td className="py-2.5 pr-4">
                <Badge variant="outline" data-testid={`badge-special-${i}`}>
                  {occasionLabels[s.type] || s.type}
                  {s.relatedPersonName ? ` (${s.relatedPersonName})` : ""}
                </Badge>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{s.assignedStaff || "-"}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {s.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={
                        s.type === "DOB_SELF"
                          ? `Dear ${s.donorName}, wishing you a very Happy Birthday! May this special day bring you joy and blessings. Thank you for your wonderful support to Asha Kuteer Foundation.`
                          : s.type === "ANNIVERSARY"
                          ? `Dear ${s.donorName}, wishing you a very Happy Anniversary! May your bond grow stronger with each year. Thank you for your continued generosity to Asha Kuteer Foundation.`
                          : s.type === "DEATH_ANNIVERSARY"
                          ? `Dear ${s.donorName}, we remember ${s.relatedPersonName || "your loved one"} today with great respect. Our thoughts are with you and your family.`
                          : `Dear ${s.donorName}, we hope you have a wonderful day! Best wishes from Asha Kuteer Foundation.`
                      }
                      testId={`button-wa-special-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${s.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-special-${i}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
