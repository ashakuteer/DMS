"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { FileSpreadsheet, FileText, Search, ChevronLeft, ChevronRight, Lock, Calendar, ArrowUpDown, CreditCard, FileBarChart, SlidersHorizontal, Save, History, Download, BarChart3 } from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface SmartReportRow {
  groupName: string;
  donorCount: number;
  totalAmount: number;
}

interface SavedReport {
  id: string;
  name: string;
  filters: any;
  groupBy: string;
  createdAt: string;
}

interface MonthlyDonation {
  id: string;
  donationDate: string;
  donorName: string;
  donorCode: string;
  donationType: string;
  donationMode: string;
  amount: any;
  receiptNumber: string | null;
  remarks: string | null;
}

interface DonorReportItem {
  id: string;
  donorCode: string;
  donorName: string;
  city: string | null;
  country: string;
  lifetimeTotal: number;
  fyTotal: number;
  donationCount: number;
  lastDonation: string | null;
  healthStatus: 'HEALTHY' | 'AT_RISK' | 'DORMANT';
}

interface ReceiptAuditItem {
  id: string;
  receiptNumber: string;
  receiptDate: string;
  donorName: string;
  donorCode: string;
  amount: any;
  paymentMode: string;
  financialYear: string;
  donationCategory: string;
  generatedBy: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PAYMENT_MODES = ['ALL', 'CASH', 'UPI', 'GPAY', 'PHONEPE', 'CHEQUE', 'BANK_TRANSFER', 'NEFT', 'RTGS', 'IMPS'];

function getFYDates(fyType: 'current' | 'last'): { start: string; end: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let fyStartYear: number;
  if (currentMonth >= 3) {
    fyStartYear = fyType === 'current' ? currentYear : currentYear - 1;
  } else {
    fyStartYear = fyType === 'current' ? currentYear - 1 : currentYear - 2;
  }

  const start = new Date(fyStartYear, 3, 1);
  const end = new Date(fyStartYear + 1, 2, 31);

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function formatAmount(amount: any): string {
  if (!amount) return '₹0';
  const num = typeof amount === 'object' && amount.toNumber ? amount.toNumber() : Number(amount);
  return `₹${num.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function HealthStatusBadge({ status }: { status: 'HEALTHY' | 'AT_RISK' | 'DORMANT' }) {
  const variants: Record<string, { class: string; label: string }> = {
    HEALTHY: { class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Healthy' },
    AT_RISK: { class: 'bg-[#E6F4F1] text-[#5FA8A8] dark:bg-[#5FA8A8]/20 dark:text-[#A8D5D1]', label: 'At-Risk' },
    DORMANT: { class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Dormant' },
  };
  const v = variants[status] || variants.DORMANT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v.class}`} data-testid={`badge-health-${status.toLowerCase()}`}>
      {v.label}
    </span>
  );
}

export default function ReportsPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("monthly");
  const [search, setSearch] = useState("");
  const [fyFilter, setFyFilter] = useState("current");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Sorting for donor report
  const [sortBy, setSortBy] = useState<'lifetime' | 'fy' | 'lastDonation'>('lifetime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Payment mode filter for receipt register
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');

  const [monthlyData, setMonthlyData] = useState<{ data: MonthlyDonation[]; pagination: PaginationInfo; summary: any } | null>(null);
  const [donorData, setDonorData] = useState<{ data: DonorReportItem[]; pagination: PaginationInfo } | null>(null);
  const [receiptData, setReceiptData] = useState<{ data: ReceiptAuditItem[]; pagination: PaginationInfo; summary: any } | null>(null);
  const [isDownloadingBoardSummary, setIsDownloadingBoardSummary] = useState(false);

  // Smart Report state
  const [smartGroupBy, setSmartGroupBy] = useState('gender');
  const [smartFilters, setSmartFilters] = useState<Record<string, string>>({});
  const [smartData, setSmartData] = useState<SmartReportRow[]>([]);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartSaving, setSmartSaving] = useState(false);
  const [reportName, setReportName] = useState('');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [smartExporting, setSmartExporting] = useState<string | null>(null);

  const isAdmin = userRole === 'ADMIN';
  const canAccessReports = userRole === 'FOUNDER' || userRole === 'ADMIN' || userRole === 'STAFF';

  useEffect(() => {
    const user = authStorage.getUser();
    setUserRole(user?.role || null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (fyFilter !== 'custom') {
      const fy = getFYDates(fyFilter as 'current' | 'last');
      setStartDate(fy.start);
      setEndDate(fy.end);
    }
  }, [fyFilter]);

  useEffect(() => {
    if (canAccessReports && startDate && endDate) {
      fetchData();
    }
  }, [activeTab, startDate, endDate, page, search, sortBy, sortOrder, paymentModeFilter, canAccessReports]);

  const fetchData = async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        page: page.toString(),
        limit: '20',
        search,
      });

      let endpoint = '';
      if (activeTab === 'monthly') {
        endpoint = 'monthly-donations';
      } else if (activeTab === 'donor') {
        if (!isAdmin) {
          setDonorData(null);
          setIsLoading(false);
          return;
        }
        endpoint = 'donors';
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
      } else if (activeTab === 'receipt') {
        if (!isAdmin) {
          setReceiptData(null);
          setIsLoading(false);
          return;
        }
        endpoint = 'receipts';
        params.append('paymentMode', paymentModeFilter);
      }

      const res = await fetchWithAuth(`/api/reports/${endpoint}?${params}`);

      if (!res.ok) {
        if (res.status === 403) {
          if (activeTab === 'donor') setDonorData(null);
          if (activeTab === 'receipt') setReceiptData(null);
        }
        throw new Error('Failed to fetch');
      }

      const data = await res.json();

      if (activeTab === 'monthly') setMonthlyData(data);
      else if (activeTab === 'donor') setDonorData(data);
      else if (activeTab === 'receipt') setReceiptData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    let endpoint = '';
    if (activeTab === 'monthly') endpoint = 'monthly-donations';
    else if (activeTab === 'donor') endpoint = 'donors';
    else if (activeTab === 'receipt') endpoint = 'receipts';

    setIsExporting(`${activeTab}-${format}`);

    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (activeTab === 'receipt') {
        params.append('paymentMode', paymentModeFilter);
      }
      const res = await fetchWithAuth(`/api/reports/${endpoint}/export/${format}?${params}`);

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${endpoint}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const toggleSort = (field: 'lifetime' | 'fy' | 'lastDonation') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const fetchSmartReport = async () => {
    setSmartLoading(true);
    try {
      const params = new URLSearchParams({ groupBy: smartGroupBy });
      Object.entries(smartFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetchWithAuth(`/api/reports?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSmartData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setSmartLoading(false);
    }
  };

  const fetchSavedReports = async () => {
    try {
      const res = await fetchWithAuth('/api/reports/history');
      if (!res.ok) return;
      setSavedReports(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) return;
    setSmartSaving(true);
    try {
      const res = await fetchWithAuth('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: reportName, filters: smartFilters, groupBy: smartGroupBy }),
      });
      if (res.ok) {
        setReportName('');
        await fetchSavedReports();
        setShowHistory(true);
      }
    } catch (e) { console.error(e); } finally { setSmartSaving(false); }
  };

  const handleSmartExport = async (format: 'excel' | 'pdf') => {
    if (userRole !== 'FOUNDER') return;
    setSmartExporting(format);
    try {
      const params = new URLSearchParams({ groupBy: smartGroupBy, format });
      Object.entries(smartFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetchWithAuth(`/api/reports/export?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-report-${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) { console.error(e); } finally { setSmartExporting(null); }
  };

  const setFilter = (key: string, value: string) => {
    setSmartFilters(prev => value ? { ...prev, [key]: value } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)));
  };

  const handleDownloadBoardSummary = async () => {
    if (!isAdmin) return;
    setIsDownloadingBoardSummary(true);
    try {
      const res = await fetchWithAuth('/api/reports/board-summary');
      if (!res.ok) throw new Error('Failed to generate board summary');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-summary-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Board summary download error:', error);
    } finally {
      setIsDownloadingBoardSummary(false);
    }
  };

  if (isLoading && !userRole) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = authStorage.getUser();
  if (user && !canAccessModule(user?.role, 'reports')) {
    return <AccessDenied />;
  }

  const currentPagination = activeTab === 'monthly' ? monthlyData?.pagination
    : activeTab === 'donor' ? donorData?.pagination
    : receiptData?.pagination;

  const isAdminOnlyTab = activeTab === 'donor' || activeTab === 'receipt';

  return (
    <div className="p-6 space-y-6" data-testid="page-reports">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and export donation reports
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="default"
              onClick={handleDownloadBoardSummary}
              disabled={isDownloadingBoardSummary}
              data-testid="button-board-summary"
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              {isDownloadingBoardSummary ? 'Generating...' : 'Board Summary'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={isExporting !== null || (isAdminOnlyTab && !isAdmin)}
            data-testid="button-export-excel"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting?.endsWith('excel') ? 'Exporting...' : 'Excel'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={isExporting !== null || (isAdminOnlyTab && !isAdmin)}
            data-testid="button-export-pdf"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExporting?.endsWith('pdf') ? 'Exporting...' : 'PDF'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Select value={fyFilter} onValueChange={(val) => { setFyFilter(val); setPage(1); }}>
                <SelectTrigger className="w-40" data-testid="select-fy">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">This FY</SelectItem>
                  <SelectItem value="last">Last FY</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              {fyFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    className="w-36"
                    data-testid="input-start-date"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    className="w-36"
                    data-testid="input-end-date"
                  />
                </div>
              )}

              {activeTab === 'donor' && isAdmin && (
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val as any); setPage(1); }}>
                  <SelectTrigger className="w-44" data-testid="select-sort">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifetime">Lifetime Total</SelectItem>
                    <SelectItem value="fy">FY Total</SelectItem>
                    <SelectItem value="lastDonation">Last Donation</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {activeTab === 'receipt' && isAdmin && (
                <Select value={paymentModeFilter} onValueChange={(val) => { setPaymentModeFilter(val); setPage(1); }}>
                  <SelectTrigger className="w-44" data-testid="select-payment-mode">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {mode === 'ALL' ? 'All Modes' : mode.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'receipt' ? 'Search receipt # or donor...' : activeTab === 'donor' ? 'Search name, phone, email...' : 'Search...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setPage(1); }}>
            <TabsList className="mb-4">
              <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly Donations</TabsTrigger>
              <TabsTrigger value="donor" data-testid="tab-donor">Donor-wise Summary</TabsTrigger>
              <TabsTrigger value="receipt" data-testid="tab-receipt">Receipt Register</TabsTrigger>
              <TabsTrigger value="smart" data-testid="tab-smart" onClick={() => { if (smartData.length === 0) fetchSmartReport(); fetchSavedReports(); }}>
                <BarChart3 className="h-3.5 w-3.5 mr-1" />Smart Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly">
              {monthlyData?.summary && (
                <div className="mb-4 flex gap-4">
                  <Badge variant="secondary" className="text-sm py-1 px-3">
                    Total: {formatAmount(monthlyData.summary.totalAmount)}
                  </Badge>
                  <Badge variant="outline" className="text-sm py-1 px-3">
                    Count: {monthlyData.summary.totalCount}
                  </Badge>
                </div>
              )}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : monthlyData?.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No donations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      monthlyData?.data.map((d) => (
                        <TableRow key={d.id} data-testid={`row-donation-${d.id}`}>
                          <TableCell>{formatDate(d.donationDate)}</TableCell>
                          <TableCell>{d.receiptNumber || '-'}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{d.donorName}</div>
                              <div className="text-xs text-muted-foreground">{d.donorCode}</div>
                            </div>
                          </TableCell>
                          <TableCell>{d.donationType}</TableCell>
                          <TableCell>{d.donationMode}</TableCell>
                          <TableCell className="text-right font-medium">{formatAmount(d.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="donor">
              {!isAdmin ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Admin Only</h3>
                  <p className="text-muted-foreground text-sm">
                    Donor-wise Summary report is restricted to Administrators only.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Donor ID / Name</TableHead>
                        <TableHead>City / Country</TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('lifetime')}>
                          <span className="flex items-center justify-end gap-1">
                            Lifetime Total
                            {sortBy === 'lifetime' && <ArrowUpDown className="h-3 w-3" />}
                          </span>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('fy')}>
                          <span className="flex items-center justify-end gap-1">
                            FY Total
                            {sortBy === 'fy' && <ArrowUpDown className="h-3 w-3" />}
                          </span>
                        </TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort('lastDonation')}>
                          <span className="flex items-center gap-1">
                            Last Donation
                            {sortBy === 'lastDonation' && <ArrowUpDown className="h-3 w-3" />}
                          </span>
                        </TableHead>
                        <TableHead>Health</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : !donorData || donorData.data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No donors found
                          </TableCell>
                        </TableRow>
                      ) : (
                        donorData.data.map((d) => (
                          <TableRow key={d.id} data-testid={`row-donor-${d.id}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{d.donorName}</div>
                                <div className="text-xs text-muted-foreground">{d.donorCode}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {d.city ? `${d.city}, ${d.country}` : d.country}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatAmount(d.lifetimeTotal)}</TableCell>
                            <TableCell className="text-right">{formatAmount(d.fyTotal)}</TableCell>
                            <TableCell className="text-right">{d.donationCount}</TableCell>
                            <TableCell>{d.lastDonation ? formatDate(d.lastDonation) : '-'}</TableCell>
                            <TableCell>
                              <HealthStatusBadge status={d.healthStatus} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="receipt">
              {!isAdmin ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Lock className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">Admin Only</h3>
                  <p className="text-muted-foreground text-sm">
                    Receipt Register (Audit Report) is restricted to Administrators only.
                  </p>
                </div>
              ) : (
                <>
                  {receiptData?.summary && (
                    <div className="mb-4 flex gap-4">
                      <Badge variant="secondary" className="text-sm py-1 px-3">
                        Total: {formatAmount(receiptData.summary.totalAmount)}
                      </Badge>
                      <Badge variant="outline" className="text-sm py-1 px-3">
                        Receipts: {receiptData.summary.totalCount}
                      </Badge>
                    </div>
                  )}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Donor Name</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Payment Mode</TableHead>
                          <TableHead>Financial Year</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Generated By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : !receiptData || receiptData.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No receipts found
                            </TableCell>
                          </TableRow>
                        ) : (
                          receiptData.data.map((d) => (
                            <TableRow key={d.id} data-testid={`row-receipt-${d.id}`}>
                              <TableCell className="font-mono">{d.receiptNumber}</TableCell>
                              <TableCell>{formatDate(d.receiptDate)}</TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{d.donorName}</div>
                                  <div className="text-xs text-muted-foreground">{d.donorCode}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">{formatAmount(d.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{d.paymentMode}</Badge>
                              </TableCell>
                              <TableCell>{d.financialYear}</TableCell>
                              <TableCell>{d.donationCategory}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{d.generatedBy}</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="smart">
              <div className="space-y-4">
                {/* Filters Section */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Filters</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Group By</label>
                      <Select value={smartGroupBy} onValueChange={setSmartGroupBy}>
                        <SelectTrigger data-testid="select-groupby"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['gender','city','state','country','profession','category','occasion'].map(g => (
                            <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
                      <Select value={smartFilters.gender || ''} onValueChange={v => setFilter('gender', v === 'ALL' ? '' : v)}>
                        <SelectTrigger data-testid="select-gender"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          {['MALE','FEMALE','OTHER'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Profession</label>
                      <Select value={smartFilters.profession || ''} onValueChange={v => setFilter('profession', v === 'ALL' ? '' : v)}>
                        <SelectTrigger data-testid="select-profession"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          {['DOCTOR','BUSINESS','IT','GOVT','OTHER'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                      <Select value={smartFilters.category || ''} onValueChange={v => setFilter('category', v === 'ALL' ? '' : v)}>
                        <SelectTrigger data-testid="select-category"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          {['GROCERIES','MEDICINES','EDUCATION','SPONSOR','OTHER'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Occasion</label>
                      <Select value={smartFilters.occasion || ''} onValueChange={v => setFilter('occasion', v === 'ALL' ? '' : v)}>
                        <SelectTrigger data-testid="select-occasion"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          {['BIRTHDAY','ANNIVERSARY','FESTIVAL','MEMORIAL','GENERAL'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Schedule Type</label>
                      <Select value={smartFilters.donationType || ''} onValueChange={v => setFilter('donationType', v === 'ALL' ? '' : v)}>
                        <SelectTrigger data-testid="select-schedule"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          {['ONE_TIME','MONTHLY','QUARTERLY'].map(t => <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">City</label>
                      <Input placeholder="Filter by city" value={smartFilters.city || ''} onChange={e => setFilter('city', e.target.value)} data-testid="input-filter-city" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">State</label>
                      <Input placeholder="Filter by state" value={smartFilters.state || ''} onChange={e => setFilter('state', e.target.value)} data-testid="input-filter-state" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Date From</label>
                      <Input type="date" value={smartFilters.dateFrom || ''} onChange={e => setFilter('dateFrom', e.target.value)} data-testid="input-datefrom" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Date To</label>
                      <Input type="date" value={smartFilters.dateTo || ''} onChange={e => setFilter('dateTo', e.target.value)} data-testid="input-dateto" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Amount (₹)</label>
                      <Input type="number" placeholder="0" value={smartFilters.minAmount || ''} onChange={e => setFilter('minAmount', e.target.value)} data-testid="input-minamount" className="h-9" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Amount (₹)</label>
                      <Input type="number" placeholder="∞" value={smartFilters.maxAmount || ''} onChange={e => setFilter('maxAmount', e.target.value)} data-testid="input-maxamount" className="h-9" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={fetchSmartReport} disabled={smartLoading} data-testid="button-run-report">
                      {smartLoading ? 'Running...' : 'Run Report'}
                    </Button>
                    <Button variant="outline" onClick={() => { setSmartFilters({}); setSmartGroupBy('gender'); setSmartData([]); }} data-testid="button-clear-filters">
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Results Table */}
                {smartData.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{smartData.length} groups</Badge>
                        <Badge variant="outline">Total: ₹{smartData.reduce((s,r)=>s+r.totalAmount,0).toLocaleString('en-IN')}</Badge>
                      </div>
                      <div className="flex gap-2">
                        {userRole === 'FOUNDER' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleSmartExport('excel')} disabled={smartExporting !== null} data-testid="button-export-smart-excel">
                              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />{smartExporting === 'excel' ? 'Exporting...' : 'Excel'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSmartExport('pdf')} disabled={smartExporting !== null} data-testid="button-export-smart-pdf">
                              <FileText className="h-3.5 w-3.5 mr-1" />{smartExporting === 'pdf' ? 'Exporting...' : 'PDF'}
                            </Button>
                          </>
                        )}
                        <div className="flex gap-1">
                          <Input placeholder="Report name..." value={reportName} onChange={e => setReportName(e.target.value)} className="h-8 w-40 text-sm" data-testid="input-report-name" />
                          <Button size="sm" onClick={handleSaveReport} disabled={smartSaving || !reportName.trim()} data-testid="button-save-report">
                            <Save className="h-3.5 w-3.5 mr-1" />{smartSaving ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setShowHistory(!showHistory); fetchSavedReports(); }} data-testid="button-show-history">
                          <History className="h-3.5 w-3.5 mr-1" />History
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{smartGroupBy.charAt(0).toUpperCase()+smartGroupBy.slice(1)}</TableHead>
                            <TableHead className="text-center">Donors</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {smartData.map((row, i) => (
                            <TableRow key={i} data-testid={`row-smart-${i}`}>
                              <TableCell className="font-medium">{row.groupName}</TableCell>
                              <TableCell className="text-center">{row.donorCount}</TableCell>
                              <TableCell className="text-right font-semibold">₹{row.totalAmount.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {smartData.length === 0 && !smartLoading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>Set filters and click <strong>Run Report</strong> to see results.</p>
                  </div>
                )}

                {/* History Panel */}
                {showHistory && (
                  <div className="border rounded-lg p-4 mt-4">
                    <h3 className="font-medium mb-3 flex items-center gap-2"><History className="h-4 w-4" />Saved Reports</h3>
                    {savedReports.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No saved reports yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {savedReports.map(r => (
                          <div key={r.id} className="flex items-center justify-between border rounded p-2" data-testid={`saved-report-${r.id}`}>
                            <div>
                              <p className="text-sm font-medium">{r.name}</p>
                              <p className="text-xs text-muted-foreground">Group by: {r.groupBy} · {new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setSmartGroupBy(r.groupBy);
                              setSmartFilters(r.filters || {});
                              setShowHistory(false);
                              fetchSmartReport();
                            }} data-testid={`button-load-report-${r.id}`}>Load</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {currentPagination && currentPagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing page {currentPagination.page} of {currentPagination.totalPages} ({currentPagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= currentPagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
