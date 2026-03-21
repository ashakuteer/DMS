"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Loader2, Save, Pencil, Banknote,
  CalendarDays, Plus, Trash2, IndianRupee, X,
  CheckCircle2, Clock,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { AccessDenied } from "@/components/access-denied";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffInfo {
  id: string;
  name: string;
  designation: string;
  home?: { name: string };
}

interface SalaryStructure {
  id: string;
  baseSalary: string;
  allowances: string;
  deductions: string;
  effectiveFrom: string | null;
  notes: string | null;
  updatedAt: string;
}

interface SalaryPayment {
  id: string;
  month: number;
  year: number;
  baseSalary: string;
  allowances: string;
  deductions: string;
  netSalary: string;
  amountPaid: string;
  paymentDate: string | null;
  paymentMode: string;
  notes: string | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PAY_MODES = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "UPI", label: "UPI" },
];

const HOME_LABELS: Record<string, string> = {
  Admin: "Administration",
  "Blind Home Begumpet": "Blind Home",
  "Girls Home Uppal": "Girls Home",
  "Old Age Home Peerzadiguda": "Old Age Home",
};

function homeLabel(name: string) { return HOME_LABELS[name] || name; }

function fmt(n: number | string | null) {
  if (n === null || n === undefined) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);
const CURRENT_MONTH = new Date().getMonth() + 1;

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffSalaryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const canEdit = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [structure, setStructure] = useState<SalaryStructure | null>(null);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>(String(CURRENT_YEAR));

  // Salary structure form
  const [editingStructure, setEditingStructure] = useState(false);
  const [savingStructure, setSavingStructure] = useState(false);
  const [structureForm, setStructureForm] = useState({
    baseSalary: "",
    allowances: "",
    deductions: "",
    effectiveFrom: "",
    notes: "",
  });

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    month: String(CURRENT_MONTH),
    year: String(CURRENT_YEAR),
    baseSalary: "",
    allowances: "",
    deductions: "",
    amountPaid: "",
    paymentDate: "",
    paymentMode: "BANK_TRANSFER",
    notes: "",
  });

  // ─── Load Data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async (year?: string) => {
    try {
      const [staffRes, structureRes, paymentsRes] = await Promise.all([
        fetchWithAuth(`/api/staff-profiles/${id}`),
        fetchWithAuth(`/api/staff-salary/${id}/structure`),
        fetchWithAuth(`/api/staff-salary/${id}/payments?year=${year || CURRENT_YEAR}`),
      ]);

      const staffData = await staffRes.json();
      const structureData = await structureRes.json();
      const paymentsData = await paymentsRes.json();

      setStaffInfo(staffData);
      setStructure(structureData?.id ? structureData : null);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);

      if (structureData?.id) {
        setStructureForm({
          baseSalary: String(Number(structureData.baseSalary)),
          allowances: String(Number(structureData.allowances)),
          deductions: String(Number(structureData.deductions)),
          effectiveFrom: structureData.effectiveFrom
            ? structureData.effectiveFrom.substring(0, 10) : "",
          notes: structureData.notes || "",
        });

        // Pre-fill payment form from structure
        setPaymentForm((prev) => ({
          ...prev,
          baseSalary: String(Number(structureData.baseSalary)),
          allowances: String(Number(structureData.allowances)),
          deductions: String(Number(structureData.deductions)),
          amountPaid: String(
            Number(structureData.baseSalary) +
            Number(structureData.allowances) -
            Number(structureData.deductions),
          ),
        }));
      }
    } catch {
      toast({ title: "Failed to load salary data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(filterYear); }, [loadData, filterYear]);

  // ─── Salary Structure ───────────────────────────────────────────────────────

  const handleSaveStructure = async () => {
    if (!structureForm.baseSalary) {
      toast({ title: "Base Salary is required", variant: "destructive" });
      return;
    }
    setSavingStructure(true);
    try {
      const res = await fetchWithAuth(`/api/staff-salary/${id}/structure`, {
        method: "POST",
        body: JSON.stringify({
          baseSalary: Number(structureForm.baseSalary),
          allowances: Number(structureForm.allowances || 0),
          deductions: Number(structureForm.deductions || 0),
          effectiveFrom: structureForm.effectiveFrom || undefined,
          notes: structureForm.notes || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Salary structure saved" });
        setEditingStructure(false);
        loadData(filterYear);
      } else {
        const err = await res.json();
        toast({ title: err.message || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setSavingStructure(false);
    }
  };

  // Compute net salary preview
  const previewNet =
    (Number(structureForm.baseSalary) || 0) +
    (Number(structureForm.allowances) || 0) -
    (Number(structureForm.deductions) || 0);

  const paymentNetPreview =
    (Number(paymentForm.baseSalary) || 0) +
    (Number(paymentForm.allowances) || 0) -
    (Number(paymentForm.deductions) || 0);

  // ─── Record Payment ─────────────────────────────────────────────────────────

  const handleRecordPayment = async () => {
    if (!paymentForm.amountPaid) {
      toast({ title: "Amount Paid is required", variant: "destructive" });
      return;
    }
    setRecordingPayment(true);
    try {
      const res = await fetchWithAuth(`/api/staff-salary/${id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          month: Number(paymentForm.month),
          year: Number(paymentForm.year),
          baseSalary: Number(paymentForm.baseSalary || 0),
          allowances: Number(paymentForm.allowances || 0),
          deductions: Number(paymentForm.deductions || 0),
          amountPaid: Number(paymentForm.amountPaid),
          paymentDate: paymentForm.paymentDate || undefined,
          paymentMode: paymentForm.paymentMode,
          notes: paymentForm.notes || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Payment recorded" });
        setShowPaymentForm(false);
        loadData(filterYear);
      } else {
        const err = await res.json();
        toast({ title: err.message || "Failed to record payment", variant: "destructive" });
      }
    } catch {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Delete this payment record? This cannot be undone.")) return;
    setDeletingId(paymentId);
    try {
      const res = await fetchWithAuth(`/api/staff-salary/payments/${paymentId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Payment deleted" });
        loadData(filterYear);
      } else {
        toast({ title: "Failed to delete payment", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (user?.role !== "FOUNDER" && user?.role !== "ADMIN") return <AccessDenied />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const netSalary = structure
    ? Number(structure.baseSalary) + Number(structure.allowances) - Number(structure.deductions)
    : null;

  return (
    <div className="p-6 max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Banknote className="h-5 w-5 text-orange-500" />
              Salary — {staffInfo?.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {staffInfo?.designation}
              {staffInfo?.home ? ` · ${homeLabel(staffInfo.home.name)}` : ""}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/staff-profiles/${id}`)}
          data-testid="button-view-profile"
        >
          View Profile
        </Button>
      </div>

      {/* ─── Salary Structure ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />Salary Structure
            </CardTitle>
            {canEdit && !editingStructure && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingStructure(true)}
                data-testid="button-edit-structure"
              >
                <Pencil className="mr-2 h-4 w-4" />
                {structure ? "Edit" : "Set Up"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingStructure ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="baseSalary">Base Salary (₹) *</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    min="0"
                    value={structureForm.baseSalary}
                    onChange={(e) => setStructureForm((p) => ({ ...p, baseSalary: e.target.value }))}
                    placeholder="e.g. 12000"
                    data-testid="input-base-salary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="allowances">Allowances (₹)</Label>
                  <Input
                    id="allowances"
                    type="number"
                    min="0"
                    value={structureForm.allowances}
                    onChange={(e) => setStructureForm((p) => ({ ...p, allowances: e.target.value }))}
                    placeholder="e.g. 2000"
                    data-testid="input-allowances"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deductions">Deductions (₹)</Label>
                  <Input
                    id="deductions"
                    type="number"
                    min="0"
                    value={structureForm.deductions}
                    onChange={(e) => setStructureForm((p) => ({ ...p, deductions: e.target.value }))}
                    placeholder="e.g. 500"
                    data-testid="input-deductions"
                  />
                </div>
              </div>

              {/* Net preview */}
              {structureForm.baseSalary && (
                <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 px-4 py-2.5 border border-orange-500/20">
                  <IndianRupee className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-sm text-muted-foreground">Net Salary:</span>
                  <span className="font-semibold text-orange-600 ml-auto">{fmt(previewNet)}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="effectiveFrom">Effective From</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={structureForm.effectiveFrom}
                    onChange={(e) => setStructureForm((p) => ({ ...p, effectiveFrom: e.target.value }))}
                    data-testid="input-effective-from"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="struct-notes">Notes</Label>
                  <Input
                    id="struct-notes"
                    value={structureForm.notes}
                    onChange={(e) => setStructureForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Optional notes"
                    data-testid="input-structure-notes"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveStructure} disabled={savingStructure} data-testid="button-save-structure">
                  {savingStructure ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savingStructure ? "Saving..." : "Save Structure"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingStructure(false)} data-testid="button-cancel-structure">
                  Cancel
                </Button>
              </div>
            </div>
          ) : structure ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <SalaryTile label="Base Salary" value={fmt(structure.baseSalary)} accent />
                <SalaryTile label="Allowances" value={`+ ${fmt(structure.allowances)}`} green />
                <SalaryTile label="Deductions" value={`- ${fmt(structure.deductions)}`} red />
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3">
                <IndianRupee className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Net Monthly Salary</p>
                  <p className="text-xl font-bold text-orange-600" data-testid="text-net-salary">{fmt(netSalary)}</p>
                </div>
                {structure.effectiveFrom && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground">Effective from</p>
                    <p className="text-sm font-medium">
                      {new Date(structure.effectiveFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
              {structure.notes && (
                <p className="text-sm text-muted-foreground">{structure.notes}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Banknote className="h-10 w-10 opacity-30" />
              <p className="text-sm">No salary structure configured yet</p>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditingStructure(true)} data-testid="button-setup-salary">
                  Set Up Salary
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Payment History ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />Payment History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterYear} onValueChange={(v) => setFilterYear(v)}>
                <SelectTrigger className="w-[110px]" data-testid="select-year-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              {canEdit && !showPaymentForm && (
                <Button size="sm" onClick={() => setShowPaymentForm(true)} data-testid="button-add-payment">
                  <Plus className="mr-2 h-4 w-4" />Record Payment
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Payment Form */}
          {showPaymentForm && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">New Payment Record</p>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPaymentForm(false)} data-testid="button-close-payment-form">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Month *</Label>
                  <Select value={paymentForm.month} onValueChange={(v) => setPaymentForm((p) => ({ ...p, month: v }))}>
                    <SelectTrigger data-testid="select-payment-month"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTH_NAMES.slice(1).map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Year *</Label>
                  <Select value={paymentForm.year} onValueChange={(v) => setPaymentForm((p) => ({ ...p, year: v }))}>
                    <SelectTrigger data-testid="select-payment-year"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Base Salary (₹)</Label>
                  <Input type="number" value={paymentForm.baseSalary} onChange={(e) => setPaymentForm((p) => ({ ...p, baseSalary: e.target.value }))} placeholder="0" data-testid="input-payment-base" />
                </div>
                <div className="space-y-1.5">
                  <Label>Allowances (₹)</Label>
                  <Input type="number" value={paymentForm.allowances} onChange={(e) => setPaymentForm((p) => ({ ...p, allowances: e.target.value }))} placeholder="0" data-testid="input-payment-allowances" />
                </div>
                <div className="space-y-1.5">
                  <Label>Deductions (₹)</Label>
                  <Input type="number" value={paymentForm.deductions} onChange={(e) => setPaymentForm((p) => ({ ...p, deductions: e.target.value }))} placeholder="0" data-testid="input-payment-deductions" />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount Paid (₹) *</Label>
                  <Input type="number" value={paymentForm.amountPaid} onChange={(e) => setPaymentForm((p) => ({ ...p, amountPaid: e.target.value }))} placeholder="Actual amount paid" data-testid="input-amount-paid" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Date</Label>
                  <Input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))} data-testid="input-payment-date" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Mode</Label>
                  <Select value={paymentForm.paymentMode} onValueChange={(v) => setPaymentForm((p) => ({ ...p, paymentMode: v }))}>
                    <SelectTrigger data-testid="select-payment-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAY_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Net preview */}
              {(paymentForm.baseSalary || paymentForm.allowances || paymentForm.deductions) && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Net Salary:</span>
                  <span className="font-semibold ml-auto">{fmt(paymentNetPreview)}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input value={paymentForm.notes} onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional note" data-testid="input-payment-notes" />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleRecordPayment} disabled={recordingPayment} data-testid="button-submit-payment">
                  {recordingPayment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {recordingPayment ? "Recording..." : "Record Payment"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPaymentForm(false)} data-testid="button-cancel-payment">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Payment List */}
          {payments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Clock className="h-8 w-8 opacity-30" />
              <p className="text-sm">No payments recorded for {filterYear}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-4 rounded-lg border p-4 hover:bg-muted/20 transition-colors" data-testid={`payment-row-${p.id}`}>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold" data-testid={`text-payment-period-${p.id}`}>
                        {MONTH_NAMES[p.month]} {p.year}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {PAY_MODES.find((m) => m.value === p.paymentMode)?.label || p.paymentMode}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Base: {fmt(p.baseSalary)}</span>
                      {Number(p.allowances) > 0 && <span className="text-green-600">+{fmt(p.allowances)}</span>}
                      {Number(p.deductions) > 0 && <span className="text-red-500">-{fmt(p.deductions)}</span>}
                      <span className="font-medium text-foreground">Net: {fmt(p.netSalary)}</span>
                    </div>
                    {p.paymentDate && (
                      <p className="text-xs text-muted-foreground">
                        Paid: {new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                    {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="font-bold text-green-600" data-testid={`text-amount-paid-${p.id}`}>{fmt(p.amountPaid)}</p>
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeletePayment(p.id)}
                        disabled={deletingId === p.id}
                        data-testid={`button-delete-payment-${p.id}`}
                      >
                        {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Year summary */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 border">
                <p className="text-sm font-medium text-muted-foreground">{filterYear} Total Paid</p>
                <p className="font-bold text-lg" data-testid="text-year-total">
                  {fmt(payments.reduce((sum, p) => sum + Number(p.amountPaid), 0))}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SalaryTile({ label, value, accent, green, red }: {
  label: string; value: string;
  accent?: boolean; green?: boolean; red?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 bg-muted/20">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-base font-semibold font-mono ${accent ? "text-foreground" : green ? "text-green-600" : red ? "text-red-500" : ""}`}>
        {value}
      </p>
    </div>
  );
}
