"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  HandHeart,
  Heart,
  TrendingUp,
  TrendingDown,
  Home,
  IndianRupee,
  Loader2,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Star,
  Activity,
  Zap,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

interface ImpactData {
  summary: {
    totalBeneficiaries: number;
    totalDonors: number;
    activeSponsors: number;
    activeSponsorships: number;
    totalDonationsFY: number;
    totalCampaigns: number;
  };
  growth: {
    newBeneficiariesThisMonth: number;
    newDonorsThisMonth: number;
    beneficiaryGrowthPct: number;
    donorGrowthPct: number;
  };
  monthlyGrowth: {
    month: string;
    beneficiaries: number;
    donors: number;
    sponsorships: number;
    donations: number;
  }[];
  homeMetrics: {
    homeType: string;
    homeLabel: string;
    beneficiaryCount: number;
    activeSponsorships: number;
    donationsReceived: number;
  }[];
}

const HOME_COLORS: Record<string, string> = {
  ORPHAN_GIRLS: "#5FA8A8",
  BLIND_BOYS: "#7FAFD4",
  OLD_AGE: "#8b5cf6",
};

const PIE_COLORS = ["#5FA8A8", "#7FAFD4", "#8b5cf6", "#10b981", "#6366f1"];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatCompact = (amount: number) => {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
};

function GrowthIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span
      className={`inline-flex items-center text-xs font-medium ${
        isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
      data-testid="growth-indicator"
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDownRight className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

interface SegmentationData {
  championDonors: number;
  majorDonors: number;
  activeDonors: number;
  smallDonors: number;
  total: number;
}

export default function ImpactDashboardPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segmentation, setSegmentation] = useState<SegmentationData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchWithAuth("/api/dashboard/impact");
        if (!res.ok) throw new Error("Failed to load impact data");
        setData(await res.json());
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchWithAuth("/api/analytics/donor-segmentation")
      .then((r) => r.json())
      .then(setSegmentation)
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">{error || "No data available"}</p>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Beneficiaries Supported",
      value: data.summary.totalBeneficiaries.toLocaleString("en-IN"),
      subtitle: `+${data.growth.newBeneficiariesThisMonth} this month`,
      growth: data.growth.beneficiaryGrowthPct,
      icon: HandHeart,
      cardBg: "linear-gradient(135deg, #5FA8A8, #7FAFD4)",
      isGradient: true,
    },
    {
      title: "Total Donors",
      value: data.summary.totalDonors.toLocaleString("en-IN"),
      subtitle: `+${data.growth.newDonorsThisMonth} this month`,
      growth: data.growth.donorGrowthPct,
      icon: Users,
      cardBg: "linear-gradient(135deg, #5FA8A8, #7FAFD4)",
      isGradient: true,
    },
    {
      title: "Active Sponsors",
      value: data.summary.activeSponsors.toLocaleString("en-IN"),
      subtitle: `${data.summary.activeSponsorships} sponsorships`,
      growth: 0,
      icon: Heart,
      cardBg: "linear-gradient(135deg, #E6F4F4, #EEF6FB)",
      isGradient: false,
    },
    {
      title: "Donations (FY)",
      value: formatCurrency(data.summary.totalDonationsFY),
      subtitle: `${data.summary.totalCampaigns} campaigns`,
      growth: 0,
      icon: IndianRupee,
      cardBg: "linear-gradient(135deg, #E6F4F4, #EEF6FB)",
      isGradient: false,
    },
  ];

  const pieData = data.homeMetrics.map((h) => ({
    name: h.homeLabel,
    value: h.beneficiaryCount,
  }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          NGO Impact Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of organizational impact across homes, donors, and beneficiaries
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            data-testid={`card-kpi-${card.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
            className="border-0 transition-shadow hover:shadow-md"
            style={card.isGradient
              ? { background: card.cardBg, boxShadow: "0 4px 12px rgba(95,168,168,0.25)" }
              : { background: card.cardBg, border: "1px solid #D1E3E3", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }
            }
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${card.isGradient ? "text-white/80" : "text-muted-foreground"}`}>
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.isGradient ? "text-white" : ""}`}>{card.value}</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${card.isGradient ? "text-white/70" : "text-muted-foreground"}`}>
                      {card.subtitle}
                    </p>
                    <GrowthIndicator value={card.growth} />
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${card.isGradient ? "bg-white/20" : "bg-white/60"}`}>
                  <card.icon className={`h-6 w-6 ${card.isGradient ? "text-white" : "text-[#5FA8A8]"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-growth-trends">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Monthly Growth Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlyGrowth}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradBeneficiaries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5FA8A8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5FA8A8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDonors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7FAFD4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7FAFD4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSponsorships" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="beneficiaries"
                    name="Beneficiaries"
                    stroke="#5FA8A8"
                    fill="url(#gradBeneficiaries)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="donors"
                    name="Donors"
                    stroke="#7FAFD4"
                    fill="url(#gradDonors)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="sponsorships"
                    name="Sponsorships"
                    stroke="#8b5cf6"
                    fill="url(#gradSponsorships)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-donation-trends">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <IndianRupee className="h-4 w-4" />
              Monthly Donation Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyGrowth}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatCompact}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Donations"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Bar
                    dataKey="donations"
                    name="Donations"
                    fill="#5FA8A8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" data-testid="card-home-metrics">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4" />
              Home-wise Impact Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.homeMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No home data available yet
              </p>
            ) : (
              <div className="space-y-4">
                {data.homeMetrics.map((home) => {
                  const color = HOME_COLORS[home.homeType] || "#6b7280";
                  return (
                    <div
                      key={home.homeType}
                      className="p-4 rounded-lg border"
                      data-testid={`home-metric-${home.homeType.toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-sm">
                            {home.homeLabel}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {home.beneficiaryCount} beneficiaries
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Beneficiaries
                          </p>
                          <p className="text-lg font-semibold">
                            {home.beneficiaryCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Sponsorships
                          </p>
                          <p className="text-lg font-semibold">
                            {home.activeSponsorships}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Donations (FY)
                          </p>
                          <p className="text-lg font-semibold">
                            {formatCompact(home.donationsReceived)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-home-distribution">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Beneficiary Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No data available
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_entry, index) => (
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
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div data-testid="section-donor-insights">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Donor Insights</h2>
          <p className="text-sm text-muted-foreground">
            Donor segmentation by lifetime contribution
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Champion Donors",
              value: segmentation?.championDonors ?? "-",
              description: "₹1L+ lifetime",
              icon: Trophy,
              color: "text-purple-600",
              bg: "bg-purple-50 dark:bg-purple-950/50",
              testId: "card-segment-champion",
            },
            {
              label: "Major Donors",
              value: segmentation?.majorDonors ?? "-",
              description: "₹50K–1L lifetime",
              icon: Star,
              color: "text-[#5FA8A8]",
              bg: "bg-[#E6F4F1] dark:bg-[#5FA8A8]/20",
              testId: "card-segment-major",
            },
            {
              label: "Active Donors",
              value: segmentation?.activeDonors ?? "-",
              description: "₹10K–50K lifetime",
              icon: Activity,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/50",
              testId: "card-segment-active",
            },
            {
              label: "Small Donors",
              value: segmentation?.smallDonors ?? "-",
              description: "Under ₹10K lifetime",
              icon: Zap,
              color: "text-green-600",
              bg: "bg-green-50 dark:bg-green-950/50",
              testId: "card-segment-small",
            },
          ].map((seg) => (
            <Card key={seg.label} data-testid={seg.testId}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {seg.label}
                    </p>
                    <p className="text-2xl font-bold">
                      {segmentation ? seg.value.toLocaleString("en-IN") : (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground inline" />
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seg.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${seg.bg}`}>
                    <seg.icon className={`h-6 w-6 ${seg.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {segmentation && segmentation.total > 0 && (
          <Card className="mt-4" data-testid="card-segment-distribution">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Donor Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Champion", count: segmentation.championDonors, color: "bg-purple-500" },
                  { label: "Major", count: segmentation.majorDonors, color: "bg-[#E6F4F1]0" },
                  { label: "Active", count: segmentation.activeDonors, color: "bg-blue-500" },
                  { label: "Small", count: segmentation.smallDonors, color: "bg-green-500" },
                ].map((tier) => {
                  const pct = segmentation.total > 0
                    ? Math.round((tier.count / segmentation.total) * 100)
                    : 0;
                  return (
                    <div key={tier.label} className="flex items-center gap-3">
                      <span className="w-16 text-sm text-muted-foreground shrink-0">
                        {tier.label}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tier.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-sm text-right text-muted-foreground shrink-0">
                        {tier.count.toLocaleString("en-IN")} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
