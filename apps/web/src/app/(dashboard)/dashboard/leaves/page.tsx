"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, CalendarOff, Plus, X, CheckCircle2, XCircle,
  Clock, Search, Trash2, CalendarDays, Users,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAVE_TYPES: Record<string, string> = {
  CASUAL: "Casual Leave",
  SICK: "Sick Leave",
  EARNED: "Earned Leave",
  UNPAID: "Unpaid Leave",
};

const LEAVE_STATUSES: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "Pending",  color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  APPROVED: { label: "Approved", color: "text-green-600 bg-green-50 border-green-200" },
  REJECTED: { label: "Rejected", color: "text-red-600 bg-red-50 border-red-200" },
};

const HOME_LABELS: Record<string, string> = {
  Admin: "Administration",
  "Blind Home Begumpet": "Blind Home",
  "Girls Home Uppal": "Girls Home",
  "Old Age Home Peerzadiguda": "Old Age Home",
};
function homeLabel(name: string) { return HOME_LABELS[name] || name; }

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Home { id: string; name: string }
interface StaffOption { id: string; name: string; designation: string; home?: Home }

interface Leave {
  id: string;
  staffId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  staff: {
    id: string;
    name: string;
    designation: string;
    home: Home | null;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffLeavesPage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const canManage = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterHome, setFilterHome] = useState("ALL");
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR));
  const [search, setSearch] = useState("");

  // Add form
  const [form, setForm] = useState({
    staffId: "",
    type: "CASUAL",
    startDate: "",
    endDate: "",
    days: "1",
    reason: "",
  });

  // Approve/Reject notes
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});

  // ─── Load ──────────────────────────────────────────────────────────────────

  const loadLeaves = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ year: filterYear });
    if (filterStatus !== "ALL") params.set("status", filterStatus);
    if (filterType !== "ALL") params.set("type", filterType);
    if (filterHome !== "ALL") params.set("homeId", filterHome);

    fetchWithAuth(`/api/staff-leaves?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLeaves(d); })
      .catch(() => toast({ title: "Failed to load leave records", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [filterStatus, filterType, filterHome, filterYear]);

  useEffect(() => { loadLeaves(); }, [loadLeaves]);

  useEffect(() => {
    Promise.all([
      fetchWithAuth("/api/staff-profiles").then((r) => r.json()),
      fetchWithAuth("/api/homes").then((r) => r.json()),
    ]).then(([staff, homesData]) => {
      if (Array.isArray(staff)) setStaffList(staff);
      if (Array.isArray(homesData)) setHomes(homesData);
    }).catch(() => {});
  }, []);

  // Auto-compute days when dates change
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end >= start) {
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setForm((p) => ({ ...p, days: String(diff) }));
      }
    }
  }, [form.startDate, form.endDate]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.staffId || !form.startDate || !form.endDate) {
      toast({ title: "Staff, start date and end date are required", variant: "destructive" });
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast({ title: "End date must be after start date", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/staff-leaves", {
        method: "POST",
        body: JSON.stringify({
          staffId: form.staffId,
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          days: Number(form.days),
          reason: form.reason || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Leave request added" });
        setShowForm(false);
        setForm({ staffId: "", type: "CASUAL", startDate: "", endDate: "", days: "1", reason: "" });
        loadLeaves();
      } else {
        const err = await res.json();
        toast({ title: err.message || "Failed to add leave", variant: "destructive" });
      }
    } catch {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionId(id);
    try {
      const res = await fetchWithAuth(`/api/staff-leaves/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes: actionNotes[id] || undefined }),
      });
      if (res.ok) {
        toast({ title: status === "APPROVED" ? "Leave approved" : "Leave rejected" });
        loadLeaves();
      } else {
        toast({ title: "Action failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this leave record?")) return;
    setActionId(id);
    try {
      const res = await fetchWithAuth(`/api/staff-leaves/${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Leave deleted" }); loadLeaves(); }
      else toast({ title: "Delete failed", variant: "destructive" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────

  const filtered = leaves.filter((l) =>
    !search ||
    l.staff.name.toLowerCase().includes(search.toLowerCase()) ||
    l.staff.designation.toLowerCase().includes(search.toLowerCase()),
  );

  const pending = leaves.filter((l) => l.status === "PENDING").length;
  const approved = leaves.filter((l) => l.status === "APPROVED").length;
  const totalDays = leaves.filter((l) => l.status === "APPROVED").reduce((s, l) => s + l.days, 0);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarOff className="h-6 w-6 text-orange-500" />
            Staff Leaves
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage leave requests and track attendance
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)} data-testid="button-add-leave">
            <Plus className="mr-2 h-4 w-4" />Add Leave Request
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending Approval</p>
                <p className="text-xl font-bold" data-testid="text-pending">{pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approved ({filterYear})</p>
                <p className="text-xl font-bold" data-testid="text-approved">{approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Days Off ({filterYear})</p>
                <p className="text-xl font-bold" data-testid="text-total-days">{totalDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Leave Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Leave Request</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)} data-testid="button-close-form">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">

              <div className="space-y-1.5">
                <Label>Staff Member *</Label>
                <Select value={form.staffId} onValueChange={(v) => setForm((p) => ({ ...p, staffId: v }))}>
                  <SelectTrigger data-testid="select-staff"><SelectValue placeholder="Select staff member" /></SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.designation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Leave Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAVE_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  data-testid="input-start-date"
                />
              </div>

              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  data-testid="input-end-date"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Number of Days</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.days}
                  onChange={(e) => setForm((p) => ({ ...p, days: e.target.value }))}
                  data-testid="input-days"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Reason for leave"
                  data-testid="input-reason"
                />
              </div>

            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting} data-testid="button-submit-leave">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {submitting ? "Saving..." : "Add Leave Request"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-form">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {Object.entries(LEAVE_STATUSES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-type">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {Object.entries(LEAVE_TYPES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterHome} onValueChange={setFilterHome}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-home">
            <SelectValue placeholder="All Homes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Homes</SelectItem>
            {homes.map((h) => <SelectItem key={h.id} value={h.id}>{homeLabel(h.name)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[100px]" data-testid="select-filter-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Leave Records Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Users className="h-10 w-10 opacity-30" />
          <p>No leave records found</p>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              Add First Leave Request
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((leave) => {
            const statusInfo = LEAVE_STATUSES[leave.status] || { label: leave.status, color: "" };
            return (
              <Card key={leave.id} data-testid={`leave-card-${leave.id}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">

                    {/* Left: Staff + leave info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold" data-testid={`text-staff-name-${leave.id}`}>
                          {leave.staff.name}
                        </p>
                        <span className="text-xs text-muted-foreground">{leave.staff.designation}</span>
                        {leave.staff.home && (
                          <span className="text-xs text-muted-foreground">{homeLabel(leave.staff.home.name)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap text-sm">
                        <Badge variant="outline" className="text-xs">
                          {LEAVE_TYPES[leave.type] || leave.type}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(leave.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {" — "}
                          {new Date(leave.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="font-medium">
                          {leave.days} {leave.days === 1 ? "day" : "days"}
                        </span>
                      </div>

                      {leave.reason && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-reason-${leave.id}`}>
                          {leave.reason}
                        </p>
                      )}
                      {leave.notes && (
                        <p className="text-xs text-muted-foreground italic">Note: {leave.notes}</p>
                      )}
                    </div>

                    {/* Right: Status + Actions */}
                    <div className="flex items-start gap-3 flex-col sm:flex-row sm:items-center shrink-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                        data-testid={`badge-status-${leave.id}`}
                      >
                        {statusInfo.label}
                      </span>

                      {canManage && leave.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={actionNotes[leave.id] || ""}
                            onChange={(e) => setActionNotes((p) => ({ ...p, [leave.id]: e.target.value }))}
                            placeholder="Admin note (optional)"
                            className="text-xs h-7 w-36"
                            data-testid={`input-note-${leave.id}`}
                          />
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction(leave.id, "APPROVED")}
                            disabled={actionId === leave.id}
                            data-testid={`button-approve-${leave.id}`}
                          >
                            {actionId === leave.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={() => handleAction(leave.id, "REJECTED")}
                            disabled={actionId === leave.id}
                            data-testid={`button-reject-${leave.id}`}
                          >
                            {actionId === leave.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          </Button>
                        </div>
                      )}

                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(leave.id)}
                          disabled={actionId === leave.id}
                          data-testid={`button-delete-${leave.id}`}
                        >
                          {actionId === leave.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
