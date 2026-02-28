"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  RefreshCw,
  Trash2,
  Edit,
  RotateCcw,
  ArrowUpRight,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface Donor {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
  primaryPhone: string | null;
  personalEmail: string | null;
  officialEmail: string | null;
  engagementLevel?: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
}

interface FollowUp {
  id: string;
  donorId: string;
  assignedToId: string;
  createdById: string;
  note: string;
  dueDate: string;
  priority: string;
  status: string;
  completedAt: string | null;
  completedNote: string | null;
  createdAt: string;
  donor: Donor;
  assignedTo: StaffUser;
  createdBy: { id: string; name: string };
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
}

export default function FollowUpsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; role: string; name: string } | null>(null);

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0, overdue: 0, dueToday: 0, dueThisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  const [donorSearch, setDonorSearch] = useState("");
  const [donorResults, setDonorResults] = useState<Donor[]>([]);
  const [donorSearchLoading, setDonorSearchLoading] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [engagementFilter, setEngagementFilter] = useState("ALL");
  const [editEngagementLevel, setEditEngagementLevel] = useState("WARM");

  const [formData, setFormData] = useState({
    note: "",
    dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    priority: "NORMAL",
    assignedToId: "",
  });

  const [completedNote, setCompletedNote] = useState("");

  useEffect(() => {
    const stored = authStorage.getUser();
    if (stored) setUser(stored);
  }, []);

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      let statusFilter = "";
      if (activeTab === "upcoming") statusFilter = "PENDING";
      else if (activeTab === "completed") statusFilter = "COMPLETED";

      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "200");

      const res = await fetchWithAuth(`/api/follow-ups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.items || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to fetch follow-ups", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/follow-ups/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      console.error("Failed to fetch stats");
    }
  }, []);

  const fetchStaffUsers = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/users");
      if (res.ok) {
        const data = await res.json();
        const allUsers = Array.isArray(data) ? data : data.users || [];
        setStaffUsers(allUsers.filter((u: any) => u.isActive && ["ADMIN", "STAFF"].includes(u.role)));
      }
    } catch {
      console.error("Failed to fetch staff");
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchFollowUps();
      fetchStats();
      fetchStaffUsers();
    }
  }, [user, fetchFollowUps, fetchStats, fetchStaffUsers]);

  const searchDonors = async (query: string) => {
    setDonorSearchLoading(true);
    try {
      const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const donorList = data.items || data.donors || data.data || data;
        setDonorResults(Array.isArray(donorList) ? donorList : []);
      }
    } catch {
      console.error("Error searching donors");
    } finally {
      setDonorSearchLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedDonor) {
      toast({ title: "Error", description: "Please select a donor", variant: "destructive" });
      return;
    }
    if (!formData.note.trim()) {
      toast({ title: "Error", description: "Please enter a note", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/follow-ups", {
        method: "POST",
        body: JSON.stringify({
          donorId: selectedDonor.id,
          assignedToId: formData.assignedToId || user?.id,
          note: formData.note,
          dueDate: formData.dueDate,
          priority: formData.priority,
        }),
      });
      if (res.ok) {
        toast({ title: "Created", description: "Follow-up reminder created" });
        setShowCreateDialog(false);
        resetForm();
        fetchFollowUps();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to create", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create follow-up", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFollowUp) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/follow-ups/${selectedFollowUp.id}`, {
        method: "PUT",
        body: JSON.stringify({
          note: formData.note,
          dueDate: formData.dueDate,
          priority: formData.priority,
          assignedToId: formData.assignedToId,
        }),
      });
      if (res.ok) {
        if (editEngagementLevel !== (selectedFollowUp.donor.engagementLevel || "WARM")) {
          await updateDonorEngagement(selectedFollowUp.donorId, editEngagementLevel);
        }
        toast({ title: "Updated", description: "Follow-up reminder updated" });
        setShowEditDialog(false);
        fetchFollowUps();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to update", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update follow-up", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedFollowUp) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/follow-ups/${selectedFollowUp.id}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ completedNote }),
      });
      if (res.ok) {
        toast({ title: "Completed", description: "Follow-up marked as completed" });
        setShowCompleteDialog(false);
        setCompletedNote("");
        fetchFollowUps();
        fetchStats();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Failed to complete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to mark complete", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/follow-ups/${id}/reopen`, { method: "PATCH" });
      if (res.ok) {
        toast({ title: "Reopened", description: "Follow-up reopened" });
        fetchFollowUps();
        fetchStats();
      }
    } catch {
      toast({ title: "Error", description: "Failed to reopen", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/follow-ups/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Follow-up deleted" });
        fetchFollowUps();
        fetchStats();
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const updateDonorEngagement = async (donorId: string, level: string) => {
    try {
      const res = await fetchWithAuth(`/api/donors/${donorId}`, {
        method: "PATCH",
        body: JSON.stringify({ engagementLevel: level }),
      });
      if (res.ok) {
        setFollowUps((prev) =>
          prev.map((fu) =>
            fu.donorId === donorId
              ? { ...fu, donor: { ...fu.donor, engagementLevel: level } }
              : fu
          )
        );
        toast({ title: "Updated", description: `Engagement level changed to ${level}` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update engagement level", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      note: "",
      dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
      priority: "NORMAL",
      assignedToId: user?.id || "",
    });
    setSelectedDonor(null);
    setDonorSearch("");
    setDonorResults([]);
  };

  const openEditDialog = (fu: FollowUp) => {
    setSelectedFollowUp(fu);
    setFormData({
      note: fu.note,
      dueDate: format(new Date(fu.dueDate), "yyyy-MM-dd"),
      priority: fu.priority,
      assignedToId: fu.assignedToId,
    });
    setEditEngagementLevel(fu.donor.engagementLevel || "WARM");
    setShowEditDialog(true);
  };

  const openCompleteDialog = (fu: FollowUp) => {
    setSelectedFollowUp(fu);
    setCompletedNote("");
    setShowCompleteDialog(true);
  };

  const getEngagementBadge = (level: string | undefined) => {
    const engagement = level || "WARM";
    const styles: Record<string, string> = {
      HOT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      WARM: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      COLD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return <Badge className={styles[engagement] || styles.WARM} data-testid={`badge-engagement-${engagement}`}>{engagement}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: "bg-muted text-muted-foreground",
      NORMAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return <Badge className={styles[priority] || ""} data-testid={`badge-priority-${priority}`}>{priority}</Badge>;
  };

  const getDueDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const past = isPast(date) && !isToday(date);
    const today = isToday(date);
    const tomorrow = isTomorrow(date);

    let label = format(date, "dd MMM yyyy");
    let className = "text-sm text-muted-foreground";

    if (past) {
      const days = Math.ceil((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      label = `${days} day${days > 1 ? "s" : ""} overdue`;
      className = "text-sm text-red-600 dark:text-red-400 font-medium";
    } else if (today) {
      label = "Due today";
      className = "text-sm text-orange-600 dark:text-orange-400 font-medium";
    } else if (tomorrow) {
      label = "Due tomorrow";
      className = "text-sm text-yellow-600 dark:text-yellow-400 font-medium";
    }

    return <span className={className} data-testid="text-due-date">{label}</span>;
  };

  const filteredFollowUps = useMemo(() => {
    if (engagementFilter === "ALL") return followUps;
    return followUps.filter((fu) => (fu.donor.engagementLevel || "WARM") === engagementFilter);
  }, [followUps, engagementFilter]);

  const categorizeFollowUps = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = filteredFollowUps.filter((f) => f.status === "PENDING" && new Date(f.dueDate) < today);
    const dueToday = filteredFollowUps.filter((f) => f.status === "PENDING" && isToday(new Date(f.dueDate)));
    const upcoming = filteredFollowUps.filter((f) => f.status === "PENDING" && new Date(f.dueDate) > today && !isToday(new Date(f.dueDate)));
    return { overdue, dueToday, upcoming };
  };

  const todaySummary = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueTodayCount = followUps.filter((f) => f.status === "PENDING" && isToday(new Date(f.dueDate))).length;
    const overdueCount = followUps.filter((f) => f.status === "PENDING" && isPast(new Date(f.dueDate)) && !isToday(new Date(f.dueDate))).length;
    const completedTodayCount = followUps.filter((f) => f.status === "COMPLETED" && f.completedAt && isToday(new Date(f.completedAt))).length;
    return { dueTodayCount, overdueCount, completedTodayCount };
  }, [followUps]);

  const getPhoneClean = (phone: string | null) => {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
  };

  if (!user) return null;
  if (!canAccessModule(user.role, "followUps")) return <AccessDenied />;

  const { overdue, dueToday, upcoming } = categorizeFollowUps();
  const canCreate = user.role === "ADMIN" || user.role === "STAFF";
  const canDelete = user.role === "ADMIN";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Follow-up Reminders</h1>
          <p className="text-muted-foreground">Track and manage donor follow-ups</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => { fetchFollowUps(); fetchStats(); }} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} data-testid="button-create-followup">
              <Plus className="h-4 w-4 mr-1" /> New Follow-up
            </Button>
          )}
        </div>
      </div>

      <Card data-testid="card-today-summary">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Today&apos;s Summary:</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" data-testid="summary-due-today">
                {todaySummary.dueTodayCount} due today
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" data-testid="summary-overdue">
                {todaySummary.overdueCount} overdue
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid="summary-completed-today">
                {todaySummary.completedTodayCount} completed today
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-overdue">{stats.overdue}</p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-today">{stats.dueToday}</p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-week">{stats.dueThisWeek}</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="stat-completed">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filter by Engagement:</span>
        <Select value={engagementFilter} onValueChange={setEngagementFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-engagement-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="HOT">HOT</SelectItem>
            <SelectItem value="WARM">WARM</SelectItem>
            <SelectItem value="COLD">COLD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming {stats.pending > 0 && <Badge className="ml-1 bg-muted text-muted-foreground">{stats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No pending follow-ups</p>
                <p className="text-sm text-muted-foreground mt-1">Create a new follow-up to start tracking</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {overdue.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Overdue ({overdue.length})
                  </h3>
                  {renderFollowUpTable(overdue)}
                </div>
              )}
              {dueToday.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Due Today ({dueToday.length})
                  </h3>
                  {renderFollowUpTable(dueToday)}
                </div>
              )}
              {upcoming.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Upcoming ({upcoming.length})
                  </h3>
                  {renderFollowUpTable(upcoming)}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No completed follow-ups</p>
              </CardContent>
            </Card>
          ) : (
            renderFollowUpTable(filteredFollowUps)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFollowUps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No follow-ups found</p>
              </CardContent>
            </Card>
          ) : (
            renderFollowUpTable(filteredFollowUps)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Follow-up Reminder</DialogTitle>
            <DialogDescription>Create a reminder to follow up with a donor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Donor</label>
              {selectedDonor ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedDonor.firstName} {selectedDonor.lastName || ""}</p>
                    <p className="text-xs text-muted-foreground">{selectedDonor.donorCode}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedDonor(null); setDonorSearch(""); }} data-testid="button-clear-donor">
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search donors by name, code, email..."
                      value={donorSearch}
                      onChange={(e) => {
                        setDonorSearch(e.target.value);
                        if (e.target.value.length >= 2) searchDonors(e.target.value);
                      }}
                      className="pl-9"
                      data-testid="input-donor-search"
                    />
                  </div>
                  {donorSearchLoading && (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {donorResults.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {donorResults.map((d) => (
                        <div
                          key={d.id}
                          className="p-2 hover-elevate cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedDonor(d);
                            setDonorResults([]);
                          }}
                          data-testid={`donor-option-${d.id}`}
                        >
                          <p className="text-sm font-medium">{d.firstName} {d.lastName || ""}</p>
                          <p className="text-xs text-muted-foreground">{d.donorCode} {d.personalEmail ? `| ${d.personalEmail}` : ""}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Note</label>
              <Textarea
                placeholder="What should be discussed or followed up on?"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
                data-testid="input-note"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  data-testid="input-due-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {user?.role === "ADMIN" && staffUsers.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1 block">Assign To</label>
                <Select value={formData.assignedToId || user.id} onValueChange={(v) => setFormData({ ...formData, assignedToId: v })}>
                  <SelectTrigger data-testid="select-assign-to">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} data-testid="button-submit-create">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Follow-up</DialogTitle>
            <DialogDescription>Update the follow-up reminder details</DialogDescription>
          </DialogHeader>
          {selectedFollowUp && (
            <div className="space-y-4">
              <div className="p-2 border rounded-md bg-muted/50">
                <p className="text-sm font-medium">{selectedFollowUp.donor.firstName} {selectedFollowUp.donor.lastName || ""}</p>
                <p className="text-xs text-muted-foreground">{selectedFollowUp.donor.donorCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Engagement Level</label>
                <Select value={editEngagementLevel} onValueChange={setEditEngagementLevel}>
                  <SelectTrigger data-testid="select-edit-engagement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="WARM">WARM</SelectItem>
                    <SelectItem value="COLD">COLD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Note</label>
                <Textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  data-testid="input-edit-note"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    data-testid="input-edit-due-date"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Priority</label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger data-testid="select-edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {user?.role === "ADMIN" && staffUsers.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Assign To</label>
                  <Select value={formData.assignedToId} onValueChange={(v) => setFormData({ ...formData, assignedToId: v })}>
                    <SelectTrigger data-testid="select-edit-assign-to">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {staffUsers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={submitting} data-testid="button-submit-edit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Follow-up</DialogTitle>
            <DialogDescription>Mark this follow-up as completed</DialogDescription>
          </DialogHeader>
          {selectedFollowUp && (
            <div className="space-y-4">
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-medium">{selectedFollowUp.donor.firstName} {selectedFollowUp.donor.lastName || ""}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedFollowUp.note}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Completion Note (optional)</label>
                <Textarea
                  placeholder="Summary of the follow-up outcome..."
                  value={completedNote}
                  onChange={(e) => setCompletedNote(e.target.value)}
                  rows={3}
                  data-testid="input-completed-note"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={submitting} data-testid="button-submit-complete">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderFollowUpTable(items: FollowUp[]) {
    return (
      <Card>
        <div className="overflow-x-auto">
          <Table data-testid="table-followups">
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Follow-up Note</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((fu) => {
                const isCompleted = fu.status === "COMPLETED";
                const phone = getPhoneClean(fu.donor.primaryPhone);
                return (
                  <TableRow key={fu.id} data-testid={`row-followup-${fu.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm" data-testid={`text-donor-name-${fu.id}`}>
                          {fu.donor.firstName} {fu.donor.lastName || ""}
                        </span>
                        <span className="text-xs text-muted-foreground">({fu.donor.donorCode})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground" data-testid={`text-phone-${fu.id}`}>
                        {fu.donor.primaryPhone || "-"}
                      </span>
                    </TableCell>
                    <TableCell data-testid={`cell-engagement-${fu.id}`}>
                      {getEngagementBadge(fu.donor.engagementLevel)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm truncate" data-testid={`text-note-${fu.id}`}>{fu.note}</p>
                        {fu.completedNote && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{fu.completedNote}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(fu.priority)}</TableCell>
                    <TableCell>
                      {isCompleted ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" data-testid={`badge-status-${fu.id}`}>
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" data-testid={`badge-status-${fu.id}`}>
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getDueDateDisplay(fu.dueDate)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{fu.assignedTo.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`https://wa.me/91${phone}?text=${encodeURIComponent("Hi, following up on our conversation.")}`, "_blank")}
                                data-testid={`button-whatsapp-${fu.id}`}
                              >
                                <MessageCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>WhatsApp</TooltipContent>
                          </Tooltip>
                        )}
                        {phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`tel:${fu.donor.primaryPhone}`, "_self")}
                                data-testid={`button-call-${fu.id}`}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{fu.donor.primaryPhone}</TooltipContent>
                          </Tooltip>
                        )}
                        {!isCompleted && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openCompleteDialog(fu)} data-testid={`button-complete-${fu.id}`}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark Complete</TooltipContent>
                          </Tooltip>
                        )}
                        {isCompleted && canCreate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleReopen(fu.id)} data-testid={`button-reopen-${fu.id}`}>
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reopen</TooltipContent>
                          </Tooltip>
                        )}
                        {canCreate && !isCompleted && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(fu)} data-testid={`button-edit-${fu.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                        )}
                        {canDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(fu.id)} data-testid={`button-delete-${fu.id}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }
}
