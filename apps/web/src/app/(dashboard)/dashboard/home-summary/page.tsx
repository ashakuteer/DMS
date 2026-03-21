"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Loader2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  HeartPulse,
  GraduationCap,
  UserPlus,
  UserMinus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { useToast } from "@/hooks/use-toast";

interface HomeStat {
  homeType: string;
  homeLabel: string;
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  inactiveBeneficiaries: number;
  healthNormal: number;
  healthSick: number;
  healthHospitalized: number;
  schoolGoing: number;
  collegeGoing: number;
  newJoinings: number;
  exits: number;
}

interface HomeSummaryData {
  month: number;
  year: number;
  monthLabel: string;
  generatedAt: string;
  homes: HomeStat[];
  totals: {
    totalBeneficiaries: number;
    totalActive: number;
    totalInactive: number;
    totalHealthNormal: number;
    totalHealthSick: number;
    totalHealthHospitalized: number;
    totalSchoolGoing: number;
    totalCollegeGoing: number;
    totalNewJoinings: number;
    totalExits: number;
  };
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authStorage.getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (typeof options.body === "string" || options.body === undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function HomeSummaryPage() {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HomeSummaryData | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  useEffect(() => {
    const user = authStorage.getUser();
    if (user) setUserRole(user.role);
  }, []);

  const years = Array.from({ length: 10 }, (_, i) => String(now.getFullYear() - i));

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/home-summary?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error("Failed to load summary");
      const result = await res.json();
      setData(result);
    } catch {
      toast({ title: "Error", description: "Failed to load home summary", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, toast]);

  useEffect(() => {
    if (userRole) fetchSummary();
  }, [userRole, fetchSummary]);

  if (userRole && !canAccessModule(userRole, "homeSummary")) {
    return <AccessDenied />;
  }

  const navigateMonth = (dir: number) => {
    let m = parseInt(selectedMonth) + dir;
    let y = parseInt(selectedYear);
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setSelectedMonth(String(m));
    setSelectedYear(String(y));
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetchWithAuth(
        `/api/home-summary/download/pdf?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `home-summary-${selectedYear}-${selectedMonth.padStart(2, "0")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await fetchWithAuth(
        `/api/home-summary/download/excel?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!res.ok) throw new Error("Failed to download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `home-summary-${selectedYear}-${selectedMonth.padStart(2, "0")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Excel downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to download Excel", variant: "destructive" });
    } finally {
      setDownloadingExcel(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" data-testid="home-summary-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Home-wise Monthly Summary</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="icon"
            variant="outline"
            onClick={() => navigateMonth(-1)}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[130px]" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[90px]" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="outline"
            onClick={() => navigateMonth(1)}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={fetchSummary} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading}
            data-testid="button-download-pdf"
          >
            {downloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadExcel}
            disabled={downloadingExcel || loading}
            data-testid="button-download-excel"
          >
            {downloadingExcel ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card data-testid="card-total-beneficiaries">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Total Beneficiaries</p>
                </div>
                <p className="text-2xl font-bold">{data.totals.totalBeneficiaries}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totals.totalActive} active, {data.totals.totalInactive} inactive
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-health-normal">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HeartPulse className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-muted-foreground">Health Normal</p>
                </div>
                <p className="text-2xl font-bold text-green-600">{data.totals.totalHealthNormal}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-health-sick">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <HeartPulse className="h-4 w-4 text-[#5FA8A8]" />
                  <p className="text-sm text-muted-foreground">Sick</p>
                </div>
                <p className="text-2xl font-bold text-[#5FA8A8]">{data.totals.totalHealthSick}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-education">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Education</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {data.totals.totalSchoolGoing + data.totals.totalCollegeGoing}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totals.totalSchoolGoing} school, {data.totals.totalCollegeGoing} college
                </p>
              </CardContent>
            </Card>
            <Card data-testid="card-movement">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Movement</p>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-lg font-bold text-green-600">+{data.totals.totalNewJoinings}</p>
                    <p className="text-xs text-muted-foreground">Joined</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">-{data.totals.totalExits}</p>
                    <p className="text-xs text-muted-foreground">Exited</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Beneficiary Count by Home
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="table-beneficiary-count">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                      <TableHead className="text-right">Inactive</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.homes.map((home) => (
                      <TableRow key={home.homeType} data-testid={`row-home-${home.homeType}`}>
                        <TableCell className="font-medium">{home.homeLabel}</TableCell>
                        <TableCell className="text-right">{home.totalBeneficiaries}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{home.activeBeneficiaries}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{home.inactiveBeneficiaries}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2" data-testid="row-total-count">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{data.totals.totalBeneficiaries}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">{data.totals.totalActive}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{data.totals.totalInactive}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <HeartPulse className="h-5 w-5" />
                Health Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="table-health-summary">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home</TableHead>
                      <TableHead className="text-right">Normal</TableHead>
                      <TableHead className="text-right">Sick</TableHead>
                      <TableHead className="text-right">Hospitalized</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.homes.map((home) => (
                      <TableRow key={home.homeType} data-testid={`row-health-${home.homeType}`}>
                        <TableCell className="font-medium">{home.homeLabel}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 no-default-hover-elevate no-default-active-elevate">{home.healthNormal}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {home.healthSick > 0 ? (
                            <Badge variant="secondary" className="bg-[#E6F4F1] text-[#5FA8A8] dark:bg-[#5FA8A8]/20 dark:text-[#A8D5D1] no-default-hover-elevate no-default-active-elevate">{home.healthSick}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {home.healthHospitalized > 0 ? (
                            <Badge variant="destructive">{home.healthHospitalized}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2" data-testid="row-total-health">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 no-default-hover-elevate no-default-active-elevate">{data.totals.totalHealthNormal}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {data.totals.totalHealthSick > 0 ? (
                          <Badge variant="secondary" className="bg-[#E6F4F1] text-[#5FA8A8] dark:bg-[#5FA8A8]/20 dark:text-[#A8D5D1] no-default-hover-elevate no-default-active-elevate">{data.totals.totalHealthSick}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.totals.totalHealthHospitalized > 0 ? (
                          <Badge variant="destructive">{data.totals.totalHealthHospitalized}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="table-education-summary">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home</TableHead>
                      <TableHead className="text-right">School Going</TableHead>
                      <TableHead className="text-right">College Going</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.homes.map((home) => (
                      <TableRow key={home.homeType} data-testid={`row-edu-${home.homeType}`}>
                        <TableCell className="font-medium">{home.homeLabel}</TableCell>
                        <TableCell className="text-right">{home.schoolGoing}</TableCell>
                        <TableCell className="text-right">{home.collegeGoing}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2" data-testid="row-total-education">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">{data.totals.totalSchoolGoing}</TableCell>
                      <TableCell className="text-right">{data.totals.totalCollegeGoing}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                New Joinings & Exits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="table-joinings-exits">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home</TableHead>
                      <TableHead className="text-right">New Joinings</TableHead>
                      <TableHead className="text-right">Exits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.homes.map((home) => (
                      <TableRow key={home.homeType} data-testid={`row-movement-${home.homeType}`}>
                        <TableCell className="font-medium">{home.homeLabel}</TableCell>
                        <TableCell className="text-right">
                          {home.newJoinings > 0 ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 no-default-hover-elevate no-default-active-elevate">+{home.newJoinings}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {home.exits > 0 ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 no-default-hover-elevate no-default-active-elevate">-{home.exits}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2" data-testid="row-total-movement">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">
                        {data.totals.totalNewJoinings > 0 ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 no-default-hover-elevate no-default-active-elevate">+{data.totals.totalNewJoinings}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {data.totals.totalExits > 0 ? (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 no-default-hover-elevate no-default-active-elevate">-{data.totals.totalExits}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            Summary generated on {new Date(data.generatedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mb-4" />
          <p>No data available for the selected period.</p>
        </div>
      )}
    </div>
  );
}
