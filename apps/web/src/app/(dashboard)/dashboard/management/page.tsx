"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import {
  Users, IndianRupee, TrendingUp, AlertTriangle,
  HandHeart, FileDown, Loader2, ClipboardList,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, Area, AreaChart, Line,
} from "recharts";
import Link from "next/link";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#6366f1",
  "#ec4899",
  "#f59e0b",
];

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
  KIND: "In-Kind",
  ANNADANAM: "Annadanam",
  GROCERIES: "Groceries",
  GROCERY: "Grocery",
  MEDICINES: "Medicines",
  RICE_BAGS: "Rice Bags",
  STATIONERY: "Stationery",
  SPORTS_KITS: "Sports Kits",
  USED_ITEMS: "Used Items",
  PREPARED_FOOD: "Prepared Food",
  OTHER: "Other",
};

interface KPIs {
  totalDonors: number;
  donationsThisMonth: number;
  donationsThisMonthCount: number;
  donationsT12: number;
  activeSponsorships: number;
  overdueSponsorships: number;
  pledgesPending: number;
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

interface TopDonor {
  donorId: string;
  donorCode: string;
  donorName: string;
  totalAmount: number;
  count: number;
  lastDonationDate: string | null;
}

interface InactiveDonor {
  donorId: string;
  donorCode: string;
  donorName: string;
  lastDonationDate: string;
  lastDonationAmount: number;
  daysSinceLastDonation: number;
  hasEmail: boolean;
  hasPhone: boolean;
}

interface DashboardData {
  kpis: KPIs;
  charts: {
    monthlyDonations: MonthlyData[];
    donationsByType: TypeData[];
    donationsByHome: HomeData[];
  };
  topDonors: TopDonor[];
  inactiveDonors: InactiveDonor[];
}

function KPICard({
  title, value, subtitle, icon: Icon, testId, variant,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  testId: string;
  variant?: "default" | "warning";
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${variant === "warning" ? "text-amber-500" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <span className="text-2xl font-bold" data-testid={`${testId}-value`}>{value}</span>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function ManagementDashboardPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  if (user && !canAccessModule(user?.role, 'management')) return <AccessDenied />;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/analytics/management");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      setData(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: "pdf" | "xlsx") => {
    setExporting(type);
    try {
      const endpoint = type === "pdf"
        ? "/api/analytics/management/export/pdf"
        : "/api/analytics/management/export/xlsx";
      const res = await fetchWithAuth(endpoint);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = type === "pdf" ? "pdf" : "xlsx";
      const name = type === "pdf" ? "board-summary" : "home-totals-risk";
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

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-20 mb-2" /><Skeleton className="h-4 w-28" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  const cashData = data.charts.donationsByType.filter((d) => d.type === "CASH");
  const inKindData = data.charts.donationsByType.filter((d) => d.type !== "CASH");
  const cashTotal = cashData.reduce((s, d) => s + d.amount, 0);
  const inKindTotal = inKindData.reduce((s, d) => s + d.amount, 0);
  const cashVsKind = [
    { name: "Cash", amount: cashTotal },
    { name: "In-Kind", amount: inKindTotal },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Management Dashboard</h1>
          <p className="text-sm text-muted-foreground">Board-ready overview of key metrics and donor health</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            data-testid="button-export-board-pdf"
          >
            {exporting === "pdf" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Board Summary PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("xlsx")}
            disabled={!!exporting}
            data-testid="button-export-home-xlsx"
          >
            {exporting === "xlsx" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Home Totals + Risk Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Donors"
          value={data.kpis.totalDonors.toLocaleString("en-IN")}
          icon={Users}
          testId="kpi-total-donors"
        />
        <KPICard
          title="Donations This Month"
          value={fmtCurrency(data.kpis.donationsThisMonth)}
          subtitle={`${data.kpis.donationsThisMonthCount} donations`}
          icon={IndianRupee}
          testId="kpi-donations-month"
        />
        <KPICard
          title="Trailing 12 Months"
          value={fmtCurrency(data.kpis.donationsT12)}
          icon={TrendingUp}
          testId="kpi-donations-t12"
        />
        <KPICard
          title="Active Sponsors"
          value={String(data.kpis.activeSponsorships)}
          icon={HandHeart}
          testId="kpi-active-sponsors"
        />
        <KPICard
          title="Overdue Sponsors"
          value={String(data.kpis.overdueSponsorships)}
          subtitle="past due this month"
          icon={AlertTriangle}
          testId="kpi-overdue-sponsors"
          variant={data.kpis.overdueSponsorships > 0 ? "warning" : "default"}
        />
        <KPICard
          title="Pledges Pending"
          value={String(data.kpis.pledgesPending)}
          icon={ClipboardList}
          testId="kpi-pledges-pending"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-2" data-testid="chart-monthly-donations">
          <CardHeader>
            <CardTitle className="text-base">Donations by Month (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.charts.monthlyDonations}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="amount"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                />
                <YAxis yAxisId="count" orientation="right" tick={{ fontSize: 11 }} />
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

        <Card data-testid="chart-cash-vs-kind">
          <CardHeader>
            <CardTitle className="text-base">Cash vs In-Kind (This FY)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={cashVsKind}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill={CHART_COLORS[0]} />
                  <Cell fill={CHART_COLORS[2]} />
                </Pie>
                <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="chart-by-home">
          <CardHeader>
            <CardTitle className="text-base">Donations by Home (This FY)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.charts.donationsByHome.map((d) => ({ ...d, label: homeLabels[d.home] || d.home }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtCurrency(v)} />
                <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                  {data.charts.donationsByHome.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card data-testid="table-top-donors">
          <CardHeader>
            <CardTitle className="text-base">Top 10 Donors This FY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground w-8">#</th>
                    <th className="pb-2 font-medium text-muted-foreground">Donor</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Amount</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Count</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Last Donation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topDonors.map((donor, i) => (
                    <tr key={donor.donorId} className="border-b last:border-0" data-testid={`row-top-donor-${i}`}>
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2">
                        <Link href={`/dashboard/donors/${donor.donorId}`} className="hover:underline">
                          <span className="font-medium">{donor.donorName}</span>
                          <span className="text-muted-foreground ml-1 text-xs">({donor.donorCode})</span>
                        </Link>
                      </td>
                      <td className="py-2 text-right font-medium">{fmtCurrency(donor.totalAmount)}</td>
                      <td className="py-2 text-right text-muted-foreground">{donor.count}</td>
                      <td className="py-2 text-right text-muted-foreground">{fmtDate(donor.lastDonationDate)}</td>
                    </tr>
                  ))}
                  {data.topDonors.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No donations this FY yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="table-donors-at-risk">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">
              Donors at Risk
              <Badge variant="secondary" className="ml-2">{data.inactiveDonors.length}</Badge>
            </CardTitle>
            <span className="text-xs text-muted-foreground">No donation for 90+ days</span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Donor</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Last Donation</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Days Inactive</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Last Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {data.inactiveDonors.slice(0, 20).map((donor, i) => (
                    <tr key={donor.donorId} className="border-b last:border-0" data-testid={`row-risk-donor-${i}`}>
                      <td className="py-2">
                        <Link href={`/dashboard/donors/${donor.donorId}`} className="hover:underline">
                          <span className="font-medium">{donor.donorName}</span>
                          <span className="text-muted-foreground ml-1 text-xs">({donor.donorCode})</span>
                        </Link>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{fmtDate(donor.lastDonationDate)}</td>
                      <td className="py-2 text-right">
                        <Badge variant={donor.daysSinceLastDonation > 180 ? "destructive" : "secondary"}>
                          {donor.daysSinceLastDonation}d
                        </Badge>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{fmtCurrency(donor.lastDonationAmount)}</td>
                    </tr>
                  ))}
                  {data.inactiveDonors.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No donors at risk</td></tr>
                  )}
                  {data.inactiveDonors.length > 20 && (
                    <tr><td colSpan={4} className="py-3 text-center text-xs text-muted-foreground">
                      ... and {data.inactiveDonors.length - 20} more (download Excel for full list)
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
