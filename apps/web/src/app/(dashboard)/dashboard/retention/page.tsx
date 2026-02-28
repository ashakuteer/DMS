"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  UserMinus,
  UserPlus,
  Repeat,
  TrendingUp,
  TrendingDown,
  Loader2,
  Download,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RetentionData {
  summary: {
    totalDonors: number;
    donorsWhoEverDonated: number;
    repeatDonorCount: number;
    oneTimeDonorCount: number;
    neverDonatedCount: number;
    lapsedDonorCount: number;
    activeLast6Months: number;
    activeLast12Months: number;
    overallRetentionPct: number;
  };
  retentionOverTime: {
    month: string;
    totalDonors: number;
    activeDonors: number;
    retentionPct: number;
    newDonors: number;
    returningDonors: number;
  }[];
  repeatDonors: {
    id: string;
    donorCode: string;
    name: string;
    totalDonations: number;
    totalAmount: number;
    firstDonation: string;
    lastDonation: string;
    avgFrequencyDays: number;
  }[];
  lapsedDonors: {
    id: string;
    donorCode: string;
    name: string;
    totalDonations: number;
    totalAmount: number;
    lastDonation: string;
    daysSinceLastDonation: number;
  }[];
}

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#94a3b8"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RetentionAnalyticsPage() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"repeat" | "lapsed">("repeat");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth("/api/dashboard/retention");
        if (!res.ok) throw new Error("Failed to fetch retention data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportRepeat = () => {
    if (!data) return;
    exportToCSV(
      "repeat_donors.csv",
      [
        "Donor Code",
        "Name",
        "Total Donations",
        "Total Amount",
        "First Donation",
        "Last Donation",
        "Avg Frequency (Days)",
      ],
      data.repeatDonors.map((d) => [
        d.donorCode,
        d.name,
        d.totalDonations,
        d.totalAmount,
        formatDate(d.firstDonation),
        formatDate(d.lastDonation),
        d.avgFrequencyDays,
      ]),
    );
  };

  const handleExportLapsed = () => {
    if (!data) return;
    exportToCSV(
      "lapsed_donors.csv",
      [
        "Donor Code",
        "Name",
        "Total Donations",
        "Total Amount",
        "Last Donation",
        "Days Since Last",
      ],
      data.lapsedDonors.map((d) => [
        d.donorCode,
        d.name,
        d.totalDonations,
        d.totalAmount,
        formatDate(d.lastDonation),
        d.daysSinceLastDonation,
      ]),
    );
  };

  const handleExportRetention = () => {
    if (!data) return;
    exportToCSV(
      "retention_over_time.csv",
      [
        "Month",
        "Total Donors",
        "Active Donors",
        "Retention %",
        "New Donors",
        "Returning Donors",
      ],
      data.retentionOverTime.map((d) => [
        d.month,
        d.totalDonors,
        d.activeDonors,
        d.retentionPct,
        d.newDonors,
        d.returningDonors,
      ]),
    );
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-96"
        data-testid="loading-spinner"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex items-center justify-center h-96"
        data-testid="error-message"
      >
        <p className="text-destructive">{error || "Failed to load data"}</p>
      </div>
    );
  }

  const { summary } = data;

  const segmentData = [
    { name: "Repeat Donors", value: summary.repeatDonorCount },
    { name: "One-Time Donors", value: summary.oneTimeDonorCount },
    { name: "Never Donated", value: summary.neverDonatedCount },
    { name: "Lapsed (6mo+)", value: summary.lapsedDonorCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-page-title"
          >
            Donor Retention Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track repeat donors, identify lapsed supporters, and monitor retention trends
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportRetention}
          data-testid="button-export-retention"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Trends
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-repeat-donors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Repeat Donors</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.repeatDonorCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.overallRetentionPct}% retention rate
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                <Repeat className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-one-time-donors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">One-Time Donors</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.oneTimeDonorCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  of {summary.donorsWhoEverDonated} who donated
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-lapsed-donors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Lapsed Donors</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.lapsedDonorCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  no donation in 6+ months
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center flex-shrink-0">
                <UserMinus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-donors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Active (Last 6mo)</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.activeLast6Months}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.activeLast12Months} active in 12mo
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
                <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" data-testid="card-retention-trend">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Retention Rate Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.retentionOverTime}>
                  <defs>
                    <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Retention"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="retentionPct"
                    stroke="#10b981"
                    fill="url(#retGrad)"
                    strokeWidth={2}
                    name="Retention %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-donor-segments">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Donor Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {segmentData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {segmentData.map((seg, i) => (
                <div key={seg.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{seg.name}</span>
                  <span className="font-medium">{seg.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-monthly-activity">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            Monthly Donor Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.retentionOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="newDonors"
                  fill="#3b82f6"
                  name="New Donors"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="returningDonors"
                  fill="#10b981"
                  name="Returning Donors"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-donor-lists">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === "repeat" ? "default" : "outline"}
                onClick={() => setActiveTab("repeat")}
                data-testid="button-tab-repeat"
              >
                <Repeat className="h-4 w-4 mr-2" />
                Repeat Donors ({data.repeatDonors.length})
              </Button>
              <Button
                variant={activeTab === "lapsed" ? "default" : "outline"}
                onClick={() => setActiveTab("lapsed")}
                data-testid="button-tab-lapsed"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Lapsed Donors ({data.lapsedDonors.length})
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={
                activeTab === "repeat" ? handleExportRepeat : handleExportLapsed
              }
              data-testid="button-export-list"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "repeat" ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Donations</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>First Donation</TableHead>
                    <TableHead>Last Donation</TableHead>
                    <TableHead className="text-right">Avg Interval</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.repeatDonors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No repeat donors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.repeatDonors.map((donor) => (
                      <TableRow
                        key={donor.id}
                        data-testid={`row-repeat-donor-${donor.id}`}
                      >
                        <TableCell>
                          <Badge variant="secondary">{donor.donorCode}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {donor.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {donor.totalDonations}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(donor.totalAmount)}
                        </TableCell>
                        <TableCell>{formatDate(donor.firstDonation)}</TableCell>
                        <TableCell>{formatDate(donor.lastDonation)}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {donor.avgFrequencyDays}d
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Past Donations</TableHead>
                    <TableHead className="text-right">Total Given</TableHead>
                    <TableHead>Last Donation</TableHead>
                    <TableHead className="text-right">Days Since</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lapsedDonors.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground py-8"
                      >
                        No lapsed donors found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.lapsedDonors.map((donor) => (
                      <TableRow
                        key={donor.id}
                        data-testid={`row-lapsed-donor-${donor.id}`}
                      >
                        <TableCell>
                          <Badge variant="secondary">{donor.donorCode}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {donor.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {donor.totalDonations}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(donor.totalAmount)}
                        </TableCell>
                        <TableCell>{formatDate(donor.lastDonation)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {donor.daysSinceLastDonation}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              donor.daysSinceLastDonation > 365
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {donor.daysSinceLastDonation > 365
                              ? "At Risk"
                              : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
