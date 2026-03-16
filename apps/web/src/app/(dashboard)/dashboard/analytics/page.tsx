"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { Users, IndianRupee, TrendingUp, AlertTriangle, Calendar, HandHeart, FileDown, Loader2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, Area, AreaChart,
} from "recharts";
import { Summary, Charts, TopDonor, AtRiskDonor, PledgeItem, SponsorshipDue, SpecialDay } from "./_components/types";
import { CHART_COLORS, fmtCurrency, fmtDate, homeLabels, typeLabels } from "./_components/helpers";
import { KPICard } from "./_components/KPICard";
import { ExportDialog } from "./_components/ExportDialog";
import { TopDonorsTable } from "./_components/TopDonorsTable";
import { AtRiskTable } from "./_components/AtRiskTable";
import { PledgesTable } from "./_components/PledgesTable";
import { SponsorshipsDueTable } from "./_components/SponsorshipsDueTable";
import { SpecialDaysTable } from "./_components/SpecialDaysTable";

export default function AnalyticsPage() {
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

  useEffect(() => {
    fetchSummary();
    fetchCharts();
  }, []);

  useEffect(() => {
    fetchSegment(activeTab);
  }, [activeTab]);

  if (user && !canAccessModule(user?.role, 'analytics')) return <AccessDenied />;

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetchWithAuth("/api/analytics/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      setSummary(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchCharts = async () => {
    setLoadingCharts(true);
    try {
      const res = await fetchWithAuth("/api/analytics/charts");
      if (!res.ok) throw new Error("Failed to fetch charts");
      setCharts(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoadingCharts(false);
    }
  };

  const fetchSegment = async (segment: string) => {
    setLoadingSegment(true);
    try {
      const res = await fetchWithAuth(`/api/analytics/segments?segment=${segment}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      setSegmentData(await res.json());
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoadingSegment(false);
    }
  };

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
          <h1 className="text-2xl font-bold" data-testid="text-analytics-title">Donor Engagement Analytics</h1>
          <p className="text-sm text-muted-foreground">Board-ready insights and donor intelligence</p>
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
            Summary PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportModal(true)}
            disabled={!!exporting}
            data-testid="button-export-donations-xlsx"
          >
            {exporting === "donations-xlsx" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Donations Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("risk-xlsx")}
            disabled={!!exporting}
            data-testid="button-export-risk-xlsx"
          >
            {exporting === "risk-xlsx" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            At Risk Excel
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
          <KPICard title="Total Donors" value={summary.totalDonors.toLocaleString("en-IN")} icon={Users} testId="kpi-total-donors" />
          <KPICard
            title="Donations This Month"
            value={fmtCurrency(summary.donationsThisMonth)}
            trend={summary.donationsThisMonthTrend}
            subtitle="vs last month"
            icon={IndianRupee}
            testId="kpi-donations-month"
          />
          <KPICard title="Trailing 12 Months" value={fmtCurrency(summary.donationsT12)} icon={TrendingUp} testId="kpi-donations-t12" />
          <KPICard
            title="Donation Count"
            value={summary.donationCountThisMonth.toLocaleString("en-IN")}
            trend={summary.donationCountTrend}
            subtitle="this month"
            icon={IndianRupee}
            testId="kpi-donation-count"
          />
          <KPICard
            title="Active Sponsorships"
            value={String(summary.activeSponsorships)}
            subtitle={`${fmtCurrency(summary.activeSponsorshipsMonthlyTotal)}/mo`}
            icon={HandHeart}
            testId="kpi-active-sponsorships"
          />
          <KPICard
            title="Overdue Sponsorships"
            value={String(summary.overdueSponsorships)}
            subtitle="past due this month"
            icon={AlertTriangle}
            testId="kpi-overdue-sponsorships"
          />
          <KPICard
            title="Pledges Pending"
            value={String(summary.pledgesPendingCount)}
            subtitle={fmtCurrency(summary.pledgesPendingAmount)}
            icon={Calendar}
            testId="kpi-pledges-pending"
          />
          <KPICard
            title="Special Days (30d)"
            value={String(summary.donorsWithSpecialDaysNext30)}
            subtitle="donors with upcoming events"
            icon={Calendar}
            testId="kpi-special-days"
          />
          <KPICard
            title="Donors At Risk"
            value={String(summary.donorsAtRisk)}
            subtitle="need re-engagement"
            icon={AlertTriangle}
            testId="kpi-at-risk"
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
              <CardTitle className="text-base">Donations by Month (Last 12 Months)</CardTitle>
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
              <CardTitle className="text-base">Donations by Type (This FY)</CardTitle>
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
              <CardTitle className="text-base">Donations by Home (This FY)</CardTitle>
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
              <CardTitle className="text-base">Sponsorships Due vs Overdue (Last 6 Months)</CardTitle>
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
          <CardTitle className="text-base">Donor Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="top" data-testid="tab-top-donors">Top Donors (FY)</TabsTrigger>
              <TabsTrigger value="risk" data-testid="tab-at-risk">Donors At Risk</TabsTrigger>
              <TabsTrigger value="pledges" data-testid="tab-pledges">Pledges Due</TabsTrigger>
              <TabsTrigger value="sponsorships" data-testid="tab-sponsorships">Sponsorships Due</TabsTrigger>
              <TabsTrigger value="specialdays" data-testid="tab-special-days">Special Days</TabsTrigger>
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

      <ExportDialog
        open={showExportModal}
        onOpenChange={setShowExportModal}
        from={exportFrom}
        setFrom={setExportFrom}
        to={exportTo}
        setTo={setExportTo}
        home={exportHome}
        setHome={setExportHome}
        type={exportType}
        setType={setExportType}
        onExport={handleDonationsExport}
      />
    </div>
  );
}
