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
  Loader2, ClipboardCheck, Plus, X, CheckCircle2, Users,
  Clock, AlertCircle, CalendarDays, Pencil, Trash2, Save,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const ATTENDANCE_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  PRESENT:  { label: "Present",  color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  ABSENT:   { label: "Absent",   color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  HALF_DAY: { label: "Half Day", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" },
  LEAVE:    { label: "Leave",    color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
};

const HOME_LABELS: Record<string, string> = {
  Admin: "Administration",
  "Blind Home Begumpet": "Blind Home",
  "Girls Home Uppal": "Girls Home",
  "Old Age Home Peerzadiguda": "Old Age Home",
};
const homeLabel = (name: string) => HOME_LABELS[name] || name;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Home { id: string; name: string }
interface StaffOption { id: string; name: string; designation: string; home?: Home }

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
  createdAt: string;
  staff: { id: string; name: string; designation: string; home: Home | null };
}

interface TodaySummary {
  date: string;
  PRESENT: number;
  ABSENT: number;
  HALF_DAY: number;
  LEAVE: number;
  total: number;
}

interface BulkEntry {
  staffId: string;
  status: string;
  checkIn: string;
  checkOut: string;
  notes: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const canManage = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [homes, setHomes] = useState<Home[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterHome, setFilterHome] = useState("ALL");
  const [filterStaff, setFilterStaff] = useState("ALL");

  // Bulk entry state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkDate, setBulkDate] = useState(todayStr());
  const [bulkEntries, setBulkEntries] = useState<BulkEntry[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Single add form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    staffId: "", date: todayStr(), status: "PRESENT",
    checkIn: "", checkOut: "", notes: "",
  });

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ status: string; checkIn: string; checkOut: string; notes: string }>({
    status: "PRESENT", checkIn: "", checkOut: "", notes: "",
  });

  // ─── Load ────────────────────────────────────────────────────────────────

  const loadRecords = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDate) params.set("date", filterDate);
    if (filterHome !== "ALL") params.set("homeId", filterHome);
    if (filterStaff !== "ALL") params.set("staffId", filterStaff);

    fetchWithAuth(`/api/staff-attendance?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRecords(d); })
      .catch(() => toast({ title: "Failed to load attendance", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [filterDate, filterHome, filterStaff]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  useEffect(() => {
    // Today's summary
    fetchWithAuth("/api/staff-attendance/today-summary")
      .then((r) => r.json())
      .then((d) => { if (d?.date) setTodaySummary(d); })
      .catch(() => {});

    // Staff + homes
    Promise.all([
      fetchWithAuth("/api/staff-profiles").then((r) => r.json()),
      fetchWithAuth("/api/homes").then((r) => r.json()),
    ]).then(([staff, homesData]) => {
      if (Array.isArray(staff)) setStaffList(staff);
      if (Array.isArray(homesData)) setHomes(homesData);
    }).catch(() => {});
  }, []);

  // Populate bulk entries when staff loads or bulk date changes
  useEffect(() => {
    if (!showBulk || staffList.length === 0) return;
    setBulkEntries(
      staffList.map((s) => ({
        staffId: s.id,
        status: "PRESENT",
        checkIn: "",
        checkOut: "",
        notes: "",
      }))
    );
  }, [showBulk, staffList, bulkDate]);

  // ─── Single add ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.staffId || !form.date) {
      toast({ title: "Staff and date are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/staff-attendance", {
        method: "POST",
        body: JSON.stringify({
          staffId: form.staffId,
          date: form.date,
          status: form.status,
          checkIn: form.checkIn || undefined,
          checkOut: form.checkOut || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        toast({ title: "Attendance recorded" });
        setShowForm(false);
        setForm({ staffId: "", date: todayStr(), status: "PRESENT", checkIn: "", checkOut: "", notes: "" });
        loadRecords();
        refreshSummary();
      } else {
        const err = await res.json();
        toast({ title: err.message || "Failed to record attendance", variant: "destructive" });
      }
    } catch {
      toast({ title: "An error occurred", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Bulk entry ───────────────────────────────────────────────────────────

  const handleBulkSubmit = async () => {
    setBulkSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/staff-attendance/bulk", {
        method: "POST",
        body: JSON.stringify({
          date: bulkDate,
          entries: bulkEntries.map((e) => ({
            staffId: e.staffId,
            status: e.status,
            checkIn: e.checkIn || undefined,
            checkOut: e.checkOut || undefined,
            notes: e.notes || undefined,
          })),
        }),
      });
      if (res.ok) {
        const result = await res.json();
        toast({ title: `Attendance saved: ${result.created} records` });
        setShowBulk(false);
        loadRecords();
        refreshSummary();
      } else {
        toast({ title: "Bulk entry failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const updateBulkEntry = (staffId: string, field: keyof BulkEntry, value: string) => {
    setBulkEntries((prev) => prev.map((e) => e.staffId === staffId ? { ...e, [field]: value } : e));
  };

  // ─── Edit / Delete ────────────────────────────────────────────────────────

  const startEdit = (r: AttendanceRecord) => {
    setEditId(r.id);
    setEditData({
      status: r.status,
      checkIn: r.checkIn ? r.checkIn.slice(0, 5) : "",
      checkOut: r.checkOut ? r.checkOut.slice(0, 5) : "",
      notes: r.notes || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editId) return;
    setActionId(editId);
    try {
      const res = await fetchWithAuth(`/api/staff-attendance/${editId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editData.status,
          checkIn: editData.checkIn || null,
          checkOut: editData.checkOut || null,
          notes: editData.notes || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Attendance updated" });
        setEditId(null);
        loadRecords();
        refreshSummary();
      } else {
        toast({ title: "Update failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this attendance record?")) return;
    setActionId(id);
    try {
      const res = await fetchWithAuth(`/api/staff-attendance/${id}`, { method: "DELETE" });
      if (res.ok) { toast({ title: "Record deleted" }); loadRecords(); refreshSummary(); }
      else toast({ title: "Delete failed", variant: "destructive" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const refreshSummary = () => {
    fetchWithAuth("/api/staff-attendance/today-summary")
      .then((r) => r.json())
      .then((d) => { if (d?.date) setTodaySummary(d); })
      .catch(() => {});
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const formatTime = (t: string | null) => {
    if (!t) return "—";
    return t.slice(0, 5);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const filteredStaff = filterHome === "ALL"
    ? staffList
    : staffList.filter((s) => s.home?.id === filterHome);

  // Staff not yet recorded on filter date (for bulk UI hint)
  const recordedStaffIds = new Set(records.map((r) => r.staffId));
  const missingCount = staffList.length - recordedStaffIds.size;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-emerald-500" />
            Staff Attendance
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track daily staff presence for salary and performance
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowBulk(!showBulk); setShowForm(false); }} data-testid="button-bulk-entry">
              <Users className="mr-2 h-4 w-4" />
              {showBulk ? "Close Bulk Entry" : "Bulk Entry"}
            </Button>
            <Button onClick={() => { setShowForm(!showForm); setShowBulk(false); }} data-testid="button-add-single">
              <Plus className="mr-2 h-4 w-4" />
              Add Single
            </Button>
          </div>
        )}
      </div>

      {/* Today's Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { key: "PRESENT",  label: "Present Today",  icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-500/10" },
          { key: "ABSENT",   label: "Absent Today",   icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-500/10" },
          { key: "HALF_DAY", label: "Half Day",        icon: Clock,         color: "text-yellow-600", bg: "bg-yellow-500/10" },
          { key: "LEAVE",    label: "On Leave",        icon: CalendarDays,  color: "text-blue-600",   bg: "bg-blue-500/10" },
        ].map(({ key, label, icon: Icon, color, bg }) => (
          <Card key={key}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold" data-testid={`text-summary-${key.toLowerCase()}`}>
                    {todaySummary ? (todaySummary as any)[key] : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Entry Panel */}
      {showBulk && canManage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">Bulk Attendance Entry</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Date</Label>
                  <Input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="h-8 w-40 text-sm"
                    data-testid="input-bulk-date"
                  />
                </div>
                <Button size="sm" onClick={handleBulkSubmit} disabled={bulkSubmitting} data-testid="button-submit-bulk">
                  {bulkSubmitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                  {bulkSubmitting ? "Saving..." : `Save All (${bulkEntries.length})`}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowBulk(false)} data-testid="button-close-bulk">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Staff with approved leaves on this date will be automatically marked as Leave
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-2 text-xs font-medium text-muted-foreground">
                <span>Staff</span>
                <span className="w-[140px]">Status</span>
                <span className="w-[110px]">Check In</span>
                <span className="w-[110px]">Check Out</span>
                <span className="w-[140px]">Notes</span>
              </div>
              {bulkEntries.map((entry, idx) => {
                const staff = staffList.find((s) => s.id === entry.staffId);
                return (
                  <div key={entry.staffId} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-2 py-1.5 rounded-lg hover:bg-muted/40" data-testid={`bulk-row-${idx}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{staff?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{staff?.designation} {staff?.home ? `· ${homeLabel(staff.home.name)}` : ""}</p>
                    </div>
                    <Select value={entry.status} onValueChange={(v) => updateBulkEntry(entry.staffId, "status", v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs" data-testid={`select-bulk-status-${idx}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ATTENDANCE_STATUSES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="time" value={entry.checkIn} onChange={(e) => updateBulkEntry(entry.staffId, "checkIn", e.target.value)} className="w-[110px] h-8 text-xs" data-testid={`input-bulk-checkin-${idx}`} />
                    <Input type="time" value={entry.checkOut} onChange={(e) => updateBulkEntry(entry.staffId, "checkOut", e.target.value)} className="w-[110px] h-8 text-xs" data-testid={`input-bulk-checkout-${idx}`} />
                    <Input value={entry.notes} onChange={(e) => updateBulkEntry(entry.staffId, "notes", e.target.value)} placeholder="Note..." className="w-[140px] h-8 text-xs" data-testid={`input-bulk-notes-${idx}`} />
                  </div>
                );
              })}
              {bulkEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No staff members found. Add staff profiles first.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Add Form */}
      {showForm && canManage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Add Attendance Entry</CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)} data-testid="button-close-form">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Staff Member *</Label>
                <Select value={form.staffId} onValueChange={(v) => setForm((p) => ({ ...p, staffId: v }))}>
                  <SelectTrigger data-testid="select-staff"><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} — {s.designation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} data-testid="input-date" />
              </div>
              <div className="space-y-1.5">
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ATTENDANCE_STATUSES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Check-in Time</Label>
                <Input type="time" value={form.checkIn} onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))} data-testid="input-checkin" />
              </div>
              <div className="space-y-1.5">
                <Label>Check-out Time</Label>
                <Input type="time" value={form.checkOut} onChange={(e) => setForm((p) => ({ ...p, checkOut: e.target.value }))} data-testid="input-checkout" />
              </div>
              <div className="space-y-1.5">
                <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional note" data-testid="input-notes" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting} data-testid="button-submit">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {submitting ? "Saving..." : "Save Entry"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Date</Label>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-9 w-40"
            data-testid="input-filter-date"
          />
        </div>

        <Select value={filterHome} onValueChange={(v) => { setFilterHome(v); setFilterStaff("ALL"); }}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-home">
            <SelectValue placeholder="All Homes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Homes</SelectItem>
            {homes.map((h) => <SelectItem key={h.id} value={h.id}>{homeLabel(h.name)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStaff} onValueChange={setFilterStaff}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-staff">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Staff</SelectItem>
            {filteredStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {filterDate === todayStr() && missingCount > 0 && canManage && (
          <span className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
            {missingCount} staff not yet marked for today
          </span>
        )}
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <ClipboardCheck className="h-10 w-10 opacity-30" />
          <p>No attendance records for {filterDate ? formatDate(filterDate) : "this date"}</p>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setShowBulk(true)}>
              Mark Attendance for This Date
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => {
            const status = ATTENDANCE_STATUSES[record.status] || { label: record.status, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" };
            const isEditing = editId === record.id;

            return (
              <Card key={record.id} data-testid={`attendance-card-${record.id}`}>
                <CardContent className="pt-3 pb-3">
                  {isEditing ? (
                    // ─── Edit mode ─────────────────────────────────────────────
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select value={editData.status} onValueChange={(v) => setEditData((p) => ({ ...p, status: v }))}>
                            <SelectTrigger className="h-8 text-xs" data-testid={`edit-status-${record.id}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(ATTENDANCE_STATUSES).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Check In</Label>
                          <Input type="time" value={editData.checkIn} onChange={(e) => setEditData((p) => ({ ...p, checkIn: e.target.value }))} className="h-8 text-xs" data-testid={`edit-checkin-${record.id}`} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Check Out</Label>
                          <Input type="time" value={editData.checkOut} onChange={(e) => setEditData((p) => ({ ...p, checkOut: e.target.value }))} className="h-8 text-xs" data-testid={`edit-checkout-${record.id}`} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Notes</Label>
                          <Input value={editData.notes} onChange={(e) => setEditData((p) => ({ ...p, notes: e.target.value }))} className="h-8 text-xs" placeholder="Note..." data-testid={`edit-notes-${record.id}`} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={handleSaveEdit} disabled={actionId === record.id} data-testid={`button-save-edit-${record.id}`}>
                          {actionId === record.id ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
                          Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditId(null)} data-testid={`button-cancel-edit-${record.id}`}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // ─── View mode ─────────────────────────────────────────────
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4 flex-wrap min-w-0">
                        <div className="min-w-0">
                          <p className="font-medium text-sm" data-testid={`text-name-${record.id}`}>{record.staff.name}</p>
                          <p className="text-xs text-muted-foreground">{record.staff.designation}{record.staff.home ? ` · ${homeLabel(record.staff.home.name)}` : ""}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color}`} data-testid={`badge-status-${record.id}`}>
                          {status.label}
                        </span>
                        {record.checkIn && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(record.checkIn)}
                            {record.checkOut && ` – ${formatTime(record.checkOut)}`}
                          </span>
                        )}
                        {record.notes && (
                          <span className="text-xs text-muted-foreground italic">{record.notes}</span>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(record)} data-testid={`button-edit-${record.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(record.id)} disabled={actionId === record.id} data-testid={`button-delete-${record.id}`}>
                            {actionId === record.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
