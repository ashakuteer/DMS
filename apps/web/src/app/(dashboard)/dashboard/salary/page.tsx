"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Banknote, Search, ExternalLink, AlertCircle,
  TrendingUp, Users, IndianRupee,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/access-denied";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Home { id: string; name: string }

interface PayrollEntry {
  id: string;
  name: string;
  designation: string;
  home: Home | null;
  baseSalary: number | null;
  allowances: number | null;
  deductions: number | null;
  netSalary: number | null;
  hasSalary: boolean;
  lastPayment: {
    month: number;
    year: number;
    amountPaid: string;
    paymentDate: string | null;
    paymentMode: string;
  } | null;
}

const HOME_LABELS: Record<string, string> = {
  Admin: "Administration",
  "Blind Home Begumpet": "Blind Home",
  "Girls Home Uppal": "Girls Home",
  "Old Age Home Peerzadiguda": "Old Age Home",
};

function homeLabel(name: string) { return HOME_LABELS[name] || name; }

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PAY_MODE_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CHEQUE: "Cheque",
  UPI: "UPI",
};

function fmt(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SalaryOverviewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();

  const [data, setData] = useState<PayrollEntry[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterHome, setFilterHome] = useState("ALL");

  useEffect(() => {
    fetchWithAuth("/api/homes")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setHomes(d); })
      .catch(() => {});
  }, []);

  const loadData = (homeId?: string) => {
    setLoading(true);
    const params = homeId && homeId !== "ALL" ? `?homeId=${homeId}` : "";
    fetchWithAuth(`/api/staff-salary/overview${params}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setData(d); })
      .catch(() => toast({ title: "Failed to load payroll data", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleHomeFilter = (v: string) => {
    setFilterHome(v);
    loadData(v === "ALL" ? undefined : v);
  };

  const filtered = data.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.designation.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPayroll = data.reduce((sum, e) => sum + (e.netSalary ?? 0), 0);
  const withSalary = data.filter((e) => e.hasSalary).length;
  const pendingSetup = data.filter((e) => !e.hasSalary).length;

  if (user?.role !== "FOUNDER" && user?.role !== "ADMIN") return <AccessDenied />;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Banknote className="h-6 w-6 text-[#5FA8A8]" />
            Staff Salary
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage salary structures and track monthly payments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#E6F4F1]0/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-[#5FA8A8]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Monthly Payroll</p>
                <p className="text-xl font-bold" data-testid="text-total-payroll">{fmt(totalPayroll)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Salary Configured</p>
                <p className="text-xl font-bold" data-testid="text-with-salary">{withSalary} staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Setup</p>
                <p className="text-xl font-bold" data-testid="text-pending-setup">{pendingSetup} staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or designation..."
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={filterHome} onValueChange={handleHomeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-home">
            <SelectValue placeholder="All Homes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Homes</SelectItem>
            {homes.map((h) => (
              <SelectItem key={h.id} value={h.id}>{homeLabel(h.name)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Users className="h-10 w-10 opacity-30" />
          <p>No staff found</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Home</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Base</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Allowances</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Deductions</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Salary</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Last Payment</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors" data-testid={`row-staff-${entry.id}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[160px]" data-testid={`text-name-${entry.id}`}>{entry.name}</div>
                        <div className="text-xs text-muted-foreground">{entry.designation}</div>
                        {!entry.hasSalary && (
                          <Badge variant="outline" className="text-xs mt-1 border-yellow-400 text-yellow-600">
                            Not configured
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {entry.home ? homeLabel(entry.home.name) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono" data-testid={`text-base-${entry.id}`}>
                        {fmt(entry.baseSalary)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-green-600 hidden sm:table-cell">
                        {entry.allowances !== null ? `+${fmt(entry.allowances)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-red-500 hidden sm:table-cell">
                        {entry.deductions !== null ? `-${fmt(entry.deductions)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold font-mono" data-testid={`text-net-${entry.id}`}>
                        {fmt(entry.netSalary)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {entry.lastPayment ? (
                          <div>
                            <div className="font-medium">{MONTH_NAMES[entry.lastPayment.month]} {entry.lastPayment.year}</div>
                            <div className="text-xs text-muted-foreground">
                              {fmt(Number(entry.lastPayment.amountPaid))} · {PAY_MODE_LABELS[entry.lastPayment.paymentMode] || entry.lastPayment.paymentMode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">No payments yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                          data-testid={`button-manage-${entry.id}`}
                        >
                          <Link href={`/dashboard/staff-profiles/${entry.id}/salary`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
