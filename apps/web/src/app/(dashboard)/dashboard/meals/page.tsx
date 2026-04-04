"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  UtensilsCrossed,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";

// ─── Menu Options ────────────────────────────────────────────────────────────

const BREAKFAST_ITEMS = [
  "Idly", "Vada", "Bonda / Mysore Bajji", "Semiya Upma", "Own Preparation",
  "Boiled Egg", "Bread", "Fruit", "Milk",
  "Flavoured Rice (Pulihora / Jeera Rice / Tomato Rice)",
  "Kichidi", "Poori", "Noodles",
];

const VEG_LUNCH_DINNER_ITEMS = [
  "Bagara Rice", "White Rice",
  "Flavoured Rice (Pulihora / Jeera Rice / Tomato Rice)",
  "Own Preparation", "Vegetable Curry", "Vegetable Biryani", "Dal", "Sambar",
  "Sweet", "Fruit", "Curd", "Papad", "Aloo Kurma", "Raitha / Curd Chutney",
  "Masala Brinjal", "Chutney", "Panner Curry", "Noodles",
];

const NON_VEG_LUNCH_DINNER_ITEMS = [
  "Bagara Rice", "White Rice", "Chicken Biryani", "Mutton Curry", "Fish Curry",
  "Chicken Fry", "Fish Fry", "Vegetable Curry", "Dal",
  "Panner Curry & Boiled Egg", "Boiled Egg", "Sambar", "Fruit", "Sweet",
  "Own Preparation", "Noodles", "Chicken Curry", "Raitha / Curd Chutney", "Curd",
];

const EVENING_SNACKS_ITEMS = [
  "Samosa", "Biscuits", "Chips", "Puff", "Ice Cream", "Fruit", "Fruit Juice",
  "Own Preparation", "Pakodi / Pakora", "Burger", "Pizza", "Noodles", "Mirchi Bujji",
];

// ─── Static Options ───────────────────────────────────────────────────────────

const HOME_OPTIONS = [
  { value: "GIRLS_HOME", label: "Girls Home" },
  { value: "BLIND_BOYS_HOME", label: "Blind Boys Home" },
  { value: "OLD_AGE_HOME", label: "Old Age Home" },
];
const ALL_HOMES = HOME_OPTIONS.map((h) => h.value);

const SLOT_OPTIONS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "eveningSnacks", label: "Evening Snacks", filterKey: "evening_snacks" },
  { key: "dinner", label: "Dinner" },
];

const SLOT_FILTER_OPTIONS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "evening_snacks", label: "Evening Snacks" },
  { key: "dinner", label: "Dinner" },
];

const OCCASION_TYPES = [
  { value: "NONE", label: "None" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "WEDDING_ANNIVERSARY", label: "Wedding Anniversary" },
  { value: "MEMORIAL", label: "Memorial" },
  { value: "OTHER", label: "Other" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "FULL", label: "Full Payment" },
  { value: "ADVANCE", label: "Advance" },
  { value: "PARTIAL", label: "Partial" },
  { value: "AFTER_SERVICE", label: "After Service" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function homeLabel(val: string) {
  return HOME_OPTIONS.find((h) => h.value === val)?.label ?? val;
}

function slotBadges(breakfast: boolean, lunch: boolean, eveningSnacks: boolean, dinner: boolean) {
  const slots = [];
  if (breakfast) slots.push("Breakfast");
  if (lunch) slots.push("Lunch");
  if (eveningSnacks) slots.push("Evening Snacks");
  if (dinner) slots.push("Dinner");
  return slots;
}

function paymentStatusColor(status?: string) {
  switch (status) {
    case "FULL": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "PARTIAL": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    case "ADVANCE": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "AFTER_SERVICE": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
    default: return "bg-muted text-muted-foreground";
  }
}

function paymentStatusLabel(status?: string, legacyType?: string) {
  if (status) return status.replace(/_/g, " ");
  if (legacyType) return legacyType;
  return "—";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealSponsorship {
  id: string;
  homes: string[];
  sponsorshipType: string;
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  foodType: string;
  mealNotes?: string;
  donationReceivedDate: string;
  mealServiceDate: string;
  paymentType: string;
  amount: string;
  totalAmount?: string | null;
  amountReceived?: string;
  paymentStatus?: string;
  transactionId?: string;
  selectedMenuItems?: string[];
  specialMenuItem?: string;
  telecallerName?: string;
  occasionType: string;
  occasionFor?: string;
  occasionPersonName?: string;
  internalNotes?: string;
  donationId?: string;
  donor: { id: string; firstName: string; lastName: string; donorCode: string };
  donation?: { id: string; donationAmount: string };
  createdBy?: { name: string };
}

interface FormState {
  donorId: string;
  donorSearch: string;
  selectedDonor: { id: string; firstName: string; lastName: string; donorCode: string } | null;
  allHomes: boolean;
  homes: string[];
  sponsorshipType: "ENTIRE_DAY" | "SELECTED_MEALS";
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  foodType: "VEG" | "NON_VEG";
  mealNotes: string;
  donationReceivedDate: string;
  mealServiceDate: string;
  totalAmount: string;
  amountReceived: string;
  paymentStatus: string;
  transactionId: string;
  selectedMenuItems: string[];
  specialMenuItem: string;
  telecallerName: string;
  occasionType: string;
  occasionFor: string;
  occasionPersonName: string;
  occasionNotes: string;
  internalNotes: string;
}

const defaultForm = (): FormState => ({
  donorId: "",
  donorSearch: "",
  selectedDonor: null,
  allHomes: false,
  homes: [],
  sponsorshipType: "ENTIRE_DAY",
  breakfast: false,
  lunch: false,
  eveningSnacks: false,
  dinner: false,
  foodType: "VEG",
  mealNotes: "",
  donationReceivedDate: format(new Date(), "yyyy-MM-dd"),
  mealServiceDate: format(new Date(), "yyyy-MM-dd"),
  totalAmount: "",
  amountReceived: "0",
  paymentStatus: "FULL",
  transactionId: "",
  selectedMenuItems: [],
  specialMenuItem: "",
  telecallerName: "",
  occasionType: "NONE",
  occasionFor: "",
  occasionPersonName: "",
  occasionNotes: "",
  internalNotes: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [donorResults, setDonorResults] = useState<any[]>([]);
  const [donorLoading, setDonorLoading] = useState(false);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    mealServiceDate: "",
    mealServiceDateTo: "",
    home: "",
    slot: "",
    donorId: "",
    sponsorshipType: "",
    paymentStatus: "",
    page: 1,
    limit: 25,
  });

  // ─── Data Fetches ───────────────────────────────────────────────────────────

  const queryKey = ["/api/meals", filters];
  const { data, isLoading } = useQuery<{ items: MealSponsorship[]; total: number; totalPages: number }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.mealServiceDate) params.set("mealServiceDate", filters.mealServiceDate);
      if (filters.mealServiceDateTo) params.set("mealServiceDateTo", filters.mealServiceDateTo);
      if (filters.home && filters.home !== "all") params.set("home", filters.home);
      if (filters.slot && filters.slot !== "all") params.set("slot", filters.slot);
      if (filters.donorId) params.set("donorId", filters.donorId);
      if (filters.sponsorshipType && filters.sponsorshipType !== "all") params.set("sponsorshipType", filters.sponsorshipType);
      if (filters.paymentStatus && filters.paymentStatus !== "all") params.set("paymentStatus", filters.paymentStatus);
      params.set("page", String(filters.page));
      params.set("limit", String(filters.limit));
      const res = await fetchWithAuth(`/api/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
  });

  const { data: staffData } = useQuery<{ users: { id: string; name: string }[] }>({
    queryKey: ["/api/users/staff-all"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/users/staff-all");
      if (!res.ok) return { users: [] };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const staffList = staffData?.users ?? (Array.isArray(staffData) ? staffData as any[] : []);

  // ─── Dynamic Menu Options ───────────────────────────────────────────────────

  const applicableMenuSections = useMemo(() => {
    const sections: { label: string; items: string[] }[] = [];
    if (form.breakfast) {
      sections.push({ label: "Breakfast Items", items: BREAKFAST_ITEMS });
    }
    if (form.lunch || form.dinner) {
      if (form.foodType === "VEG") {
        sections.push({ label: "Veg Lunch / Dinner Items", items: VEG_LUNCH_DINNER_ITEMS });
      } else {
        sections.push({ label: "Non-Veg Lunch / Dinner Items", items: NON_VEG_LUNCH_DINNER_ITEMS });
      }
    }
    if (form.eveningSnacks) {
      sections.push({ label: "Evening Snacks Items", items: EVENING_SNACKS_ITEMS });
    }
    return sections;
  }, [form.breakfast, form.lunch, form.eveningSnacks, form.dinner, form.foodType]);

  // ─── Computed Values ────────────────────────────────────────────────────────

  const totalAmountNum = parseFloat(form.totalAmount) || 0;
  const amountReceivedNum = parseFloat(form.amountReceived) || 0;
  const balanceAmount = Math.max(0, totalAmountNum - amountReceivedNum);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetchWithAuth("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to create meal sponsorship");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Meal sponsorship created", description: "Linked donation record also created." });
      setOpen(false);
      setForm(defaultForm());
      setDonorResults([]);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/api/meals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Deleted", description: "Meal sponsorship removed." });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const searchDonors = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setDonorResults([]); return; }
    setDonorLoading(true);
    try {
      const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setDonorResults(data.data ?? data.donors ?? data.items ?? []);
    } catch {
      setDonorResults([]);
    } finally {
      setDonorLoading(false);
    }
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSponsorshipTypeChange(val: "ENTIRE_DAY" | "SELECTED_MEALS") {
    setField("sponsorshipType", val);
    // No auto-selection — user always controls which slots are active
  }

  function handleAllHomesChange(checked: boolean) {
    setField("allHomes", checked as any);
    if (checked) setField("homes", [...ALL_HOMES] as any);
    else setField("homes", [] as any);
  }

  function toggleHome(val: string) {
    setForm((prev) => {
      const exists = prev.homes.includes(val);
      const next = exists ? prev.homes.filter((h) => h !== val) : [...prev.homes, val];
      return { ...prev, homes: next as any, allHomes: next.length === ALL_HOMES.length };
    });
  }

  function toggleMenuItem(item: string) {
    setForm((prev) => {
      const exists = prev.selectedMenuItems.includes(item);
      const next = exists
        ? prev.selectedMenuItems.filter((i) => i !== item)
        : [...prev.selectedMenuItems, item];
      return { ...prev, selectedMenuItems: next };
    });
  }

  function handleAmountReceivedChange(val: string) {
    setField("amountReceived", val as any);
    const received = parseFloat(val) || 0;
    const total = parseFloat(form.totalAmount) || 0;
    if (received <= 0) setField("paymentStatus", "AFTER_SERVICE" as any);
    else if (received >= total && total > 0) setField("paymentStatus", "FULL" as any);
    else setField("paymentStatus", "PARTIAL" as any);
  }

  function handleSubmit() {
    if (!form.selectedDonor) {
      toast({ title: "Validation", description: "Please select a donor.", variant: "destructive" });
      return;
    }
    if (form.homes.length === 0) {
      toast({ title: "Validation", description: "Select at least one home.", variant: "destructive" });
      return;
    }
    if (form.sponsorshipType === "SELECTED_MEALS" && !form.breakfast && !form.lunch && !form.eveningSnacks && !form.dinner) {
      toast({ title: "Validation", description: "Select at least one meal slot.", variant: "destructive" });
      return;
    }
    if (!form.totalAmount || isNaN(Number(form.totalAmount)) || Number(form.totalAmount) <= 0) {
      toast({ title: "Validation", description: "Enter a valid total amount.", variant: "destructive" });
      return;
    }
    const totalAmt = Number(form.totalAmount);
    const rcvdAmt = Number(form.amountReceived) || 0;
    if (rcvdAmt > totalAmt) {
      toast({ title: "Validation", description: "Amount received cannot exceed total amount.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      donorId: form.selectedDonor.id,
      homes: form.homes,
      sponsorshipType: form.sponsorshipType,
      breakfast: form.breakfast,
      lunch: form.lunch,
      eveningSnacks: form.eveningSnacks,
      dinner: form.dinner,
      foodType: form.foodType,
      mealNotes: form.mealNotes || undefined,
      donationReceivedDate: form.donationReceivedDate,
      mealServiceDate: form.mealServiceDate,
      amount: totalAmt,
      totalAmount: totalAmt,
      amountReceived: rcvdAmt,
      paymentStatus: form.paymentStatus || "FULL",
      transactionId: form.transactionId || undefined,
      selectedMenuItems: form.selectedMenuItems.length > 0 ? form.selectedMenuItems : undefined,
      specialMenuItem: form.specialMenuItem || undefined,
      telecallerName: form.telecallerName || undefined,
      occasionType: form.occasionType || "NONE",
      occasionFor: form.occasionFor || undefined,
      occasionPersonName: form.occasionPersonName || undefined,
      occasionNotes: form.occasionNotes || undefined,
      internalNotes: form.internalNotes || undefined,
    });
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Meals</h1>
            <p className="text-sm text-muted-foreground">Meal sponsorship records for all homes</p>
          </div>
        </div>
        <Button data-testid="button-add-meal" onClick={() => { setOpen(true); setForm(defaultForm()); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Meal Sponsorship
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">Meal Date From</Label>
          <Input data-testid="filter-date-from" type="date" value={filters.mealServiceDate}
            onChange={(e) => setFilters((p) => ({ ...p, mealServiceDate: e.target.value, page: 1 }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Meal Date To</Label>
          <Input data-testid="filter-date-to" type="date" value={filters.mealServiceDateTo}
            onChange={(e) => setFilters((p) => ({ ...p, mealServiceDateTo: e.target.value, page: 1 }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Home</Label>
          <Select value={filters.home || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, home: v === "all" ? "" : v, page: 1 }))}>
            <SelectTrigger data-testid="filter-home"><SelectValue placeholder="All Homes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homes</SelectItem>
              {HOME_OPTIONS.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slot</Label>
          <Select value={filters.slot || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, slot: v === "all" ? "" : v, page: 1 }))}>
            <SelectTrigger data-testid="filter-slot"><SelectValue placeholder="All Slots" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Slots</SelectItem>
              {SLOT_FILTER_OPTIONS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={filters.sponsorshipType || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, sponsorshipType: v === "all" ? "" : v, page: 1 }))}>
            <SelectTrigger data-testid="filter-type"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ENTIRE_DAY">Entire Day</SelectItem>
              <SelectItem value="SELECTED_MEALS">Selected Meals</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Payment Status</Label>
          <Select value={filters.paymentStatus || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, paymentStatus: v === "all" ? "" : v, page: 1 }))}>
            <SelectTrigger data-testid="filter-payment-status"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {PAYMENT_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button variant="outline" size="sm" data-testid="button-clear-filters"
            onClick={() => setFilters({ mealServiceDate: "", mealServiceDateTo: "", home: "", slot: "", donorId: "", sponsorshipType: "", paymentStatus: "", page: 1, limit: 25 })}>
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Meal Date</TableHead>
              <TableHead>Homes</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead>Food</TableHead>
              <TableHead>Menu</TableHead>
              <TableHead>Telecaller</TableHead>
              <TableHead>Total / Rcvd / Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Occasion</TableHead>
              <TableHead>By</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                  No meal sponsorships found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const total = item.totalAmount != null ? Number(item.totalAmount) : Number(item.amount);
                const rawReceived = Number(item.amountReceived ?? 0);
                // Legacy fix: Phase 1 records (totalAmount IS null) with paymentType FULL
                // had no amountReceived tracking — treat them as fully paid for display.
                const isLegacyFullPaid = item.totalAmount == null && item.paymentType === "FULL" && rawReceived === 0;
                const received = isLegacyFullPaid ? total : rawReceived;
                const balance = Math.max(0, total - received);
                const menuCount = item.selectedMenuItems?.length ?? 0;
                const hasSpecial = !!item.specialMenuItem;
                const menuLabel = menuCount > 0
                  ? `${menuCount} item${menuCount > 1 ? "s" : ""}${hasSpecial ? " + special" : ""}`
                  : hasSpecial ? "Special only" : "—";

                return (
                  <TableRow key={item.id} data-testid={`row-meal-${item.id}`}>
                    <TableCell>
                      <div className="font-medium">{item.donor.firstName} {item.donor.lastName}</div>
                      <div className="text-xs text-muted-foreground">{item.donor.donorCode}</div>
                    </TableCell>
                    <TableCell>
                      <div>{format(new Date(item.mealServiceDate), "dd MMM yyyy")}</div>
                      <div className="text-xs text-muted-foreground">Rcvd: {format(new Date(item.donationReceivedDate), "dd MMM yyyy")}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.homes.map((h) => (
                          <Badge key={h} variant="outline" className="text-xs">{homeLabel(h)}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {slotBadges(item.breakfast, item.lunch, item.eveningSnacks ?? false, item.dinner).map((s) => (
                          <Badge key={s} className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-0">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.foodType === "VEG" ? "outline" : "secondary"} className="text-xs">
                        {item.foodType === "VEG" ? "🟢 Veg" : "🔴 Non-Veg"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground" data-testid={`text-menu-${item.id}`}>{menuLabel}</span>
                    </TableCell>
                    <TableCell className="text-xs" data-testid={`text-telecaller-${item.id}`}>
                      {item.telecallerName || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">₹{total.toLocaleString("en-IN")}</div>
                      <div className="text-xs text-green-600 dark:text-green-400">Rcvd: ₹{received.toLocaleString("en-IN")}</div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">Bal: ₹{balance.toLocaleString("en-IN")}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${paymentStatusColor(item.paymentStatus)}`}>
                        {paymentStatusLabel(item.paymentStatus, item.paymentType)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.occasionType !== "NONE" ? item.occasionType.replace(/_/g, " ") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.createdBy?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" data-testid={`button-delete-meal-${item.id}`}
                        onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total: {data?.total ?? 0} records</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {filters.page} of {totalPages}</span>
            <Button variant="outline" size="icon" disabled={filters.page >= totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Add Dialog ─────────────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(defaultForm()); setDonorResults([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Meal Sponsorship</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">

            {/* Donor Search */}
            <div className="space-y-1">
              <Label>Donor <span className="text-destructive">*</span></Label>
              {form.selectedDonor ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/40">
                  <div>
                    <span className="font-medium">{form.selectedDonor.firstName} {form.selectedDonor.lastName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{form.selectedDonor.donorCode}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setField("selectedDonor", null as any);
                    setField("donorId", "" as any);
                    setField("donorSearch", "" as any);
                  }}>Change</Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-donor-search"
                    className="pl-9"
                    placeholder="Search donor by name or code…"
                    value={form.donorSearch}
                    onChange={(e) => {
                      setField("donorSearch", e.target.value as any);
                      setShowDonorDropdown(true);
                      searchDonors(e.target.value);
                    }}
                  />
                  {showDonorDropdown && form.donorSearch.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-48 overflow-y-auto">
                      {donorLoading ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Searching…
                        </div>
                      ) : donorResults.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">No donors found</div>
                      ) : (
                        donorResults.map((d) => (
                          <button key={d.id} className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                            onClick={() => {
                              setField("selectedDonor", d as any);
                              setField("donorId", d.id as any);
                              setField("donorSearch", `${d.firstName} ${d.lastName}` as any);
                              setShowDonorDropdown(false);
                              setDonorResults([]);
                            }}>
                            <span className="font-medium">{d.firstName} {d.lastName}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{d.donorCode}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Homes */}
            <div className="space-y-2">
              <Label>Homes Covered <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox data-testid="checkbox-all-homes" id="all-homes" checked={form.allHomes}
                    onCheckedChange={(c) => handleAllHomesChange(!!c)} />
                  <Label htmlFor="all-homes" className="cursor-pointer font-medium">All Homes</Label>
                </div>
                {HOME_OPTIONS.map((h) => (
                  <div key={h.value} className="flex items-center gap-2">
                    <Checkbox data-testid={`checkbox-home-${h.value}`} id={h.value}
                      checked={form.homes.includes(h.value)} onCheckedChange={() => toggleHome(h.value)} />
                    <Label htmlFor={h.value} className="cursor-pointer">{h.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsorship Type + Food Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Sponsorship Type <span className="text-destructive">*</span></Label>
                <Select value={form.sponsorshipType} onValueChange={(v) => handleSponsorshipTypeChange(v as any)}>
                  <SelectTrigger data-testid="select-sponsorship-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTIRE_DAY">Entire Day</SelectItem>
                    <SelectItem value="SELECTED_MEALS">Selected Meals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Food Type <span className="text-destructive">*</span></Label>
                <Select value={form.foodType} onValueChange={(v) => {
                  setField("foodType", v as any);
                  setField("selectedMenuItems", [] as any);
                }}>
                  <SelectTrigger data-testid="select-food-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VEG">🟢 Veg</SelectItem>
                    <SelectItem value="NON_VEG">🔴 Non-Veg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meal Slots — always visible, user controls selection */}
            <div className="space-y-2">
              <Label>Meal Slots <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-6 p-3 border rounded-lg">
                {SLOT_OPTIONS.map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <Checkbox data-testid={`checkbox-slot-${s.key}`} id={`slot-${s.key}`}
                      checked={(form as any)[s.key]}
                      onCheckedChange={(c) => {
                        setField(s.key as any, !!c);
                        setField("selectedMenuItems", [] as any);
                      }} />
                    <Label htmlFor={`slot-${s.key}`} className="cursor-pointer">{s.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            {applicableMenuSections.length > 0 && (
              <div className="space-y-3">
                <Label>Standard Menu Items <span className="text-xs text-muted-foreground font-normal">(optional, select all that apply)</span></Label>
                {applicableMenuSections.map((section) => (
                  <div key={section.label} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{section.label}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-3 border rounded-lg bg-muted/10">
                      {section.items.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <Checkbox
                            data-testid={`checkbox-menu-${item.replace(/\s+/g, "-").toLowerCase()}`}
                            id={`menu-${item}`}
                            checked={form.selectedMenuItems.includes(item)}
                            onCheckedChange={() => toggleMenuItem(item)}
                          />
                          <Label htmlFor={`menu-${item}`} className="cursor-pointer text-sm font-normal">{item}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Item + Meal Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Special / Custom Item</Label>
                <Input
                  data-testid="input-special-menu-item"
                  placeholder="e.g. Halwa, Payasam…"
                  value={form.specialMenuItem}
                  onChange={(e) => setField("specialMenuItem", e.target.value as any)}
                />
              </div>
              <div className="space-y-1">
                <Label>Meal Notes</Label>
                <Input
                  data-testid="input-meal-notes"
                  placeholder="Any additional notes…"
                  value={form.mealNotes}
                  onChange={(e) => setField("mealNotes", e.target.value as any)}
                />
              </div>
            </div>

            {/* Telecaller */}
            <div className="space-y-1">
              <Label>Telecaller / Owner</Label>
              {staffList.length > 0 ? (
                <Select value={form.telecallerName || "__none__"} onValueChange={(v) => setField("telecallerName", v === "__none__" ? "" as any : v as any)}>
                  <SelectTrigger data-testid="select-telecaller"><SelectValue placeholder="Select staff member…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {staffList.map((s: any) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  data-testid="input-telecaller-name"
                  placeholder="Staff name…"
                  value={form.telecallerName}
                  onChange={(e) => setField("telecallerName", e.target.value as any)}
                />
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Donation Received Date <span className="text-destructive">*</span></Label>
                <Input data-testid="input-donation-received-date" type="date" value={form.donationReceivedDate}
                  onChange={(e) => setField("donationReceivedDate", e.target.value as any)} />
              </div>
              <div className="space-y-1">
                <Label>Meal Service Date <span className="text-destructive">*</span></Label>
                <Input data-testid="input-meal-service-date" type="date" value={form.mealServiceDate}
                  onChange={(e) => setField("mealServiceDate", e.target.value as any)} />
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
              <p className="text-sm font-semibold">Payment Details</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Total Amount (₹) <span className="text-destructive">*</span></Label>
                  <Input
                    data-testid="input-total-amount"
                    type="number" min="0" step="1" placeholder="0"
                    value={form.totalAmount}
                    onChange={(e) => {
                      setField("totalAmount", e.target.value as any);
                      const total = parseFloat(e.target.value) || 0;
                      const received = parseFloat(form.amountReceived) || 0;
                      if (received >= total && total > 0) setField("paymentStatus", "FULL" as any);
                      else if (received > 0) setField("paymentStatus", "PARTIAL" as any);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Amount Received (₹)</Label>
                  <Input
                    data-testid="input-amount-received"
                    type="number" min="0" step="1" placeholder="0"
                    value={form.amountReceived}
                    onChange={(e) => handleAmountReceivedChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Balance Amount (₹)</Label>
                  <div data-testid="text-balance-amount" className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm font-medium">
                    ₹{balanceAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Payment Status <span className="text-destructive">*</span></Label>
                  <Select value={form.paymentStatus} onValueChange={(v) => setField("paymentStatus", v as any)}>
                    <SelectTrigger data-testid="select-payment-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Transaction / UTR Reference</Label>
                  <Input
                    data-testid="input-transaction-id"
                    placeholder="e.g. UTR123456789"
                    value={form.transactionId}
                    onChange={(e) => setField("transactionId", e.target.value as any)}
                  />
                </div>
              </div>
            </div>

            {/* Occasion */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Occasion</Label>
                <Select value={form.occasionType} onValueChange={(v) => setField("occasionType", v as any)}>
                  <SelectTrigger data-testid="select-occasion-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OCCASION_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {form.occasionType !== "NONE" && (
                <div className="space-y-1">
                  <Label>Occasion For</Label>
                  <Select value={form.occasionFor || "SELF"} onValueChange={(v) => setField("occasionFor", v as any)}>
                    <SelectTrigger data-testid="select-occasion-for"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELF">Self</SelectItem>
                      <SelectItem value="OTHER">Other Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {form.occasionType !== "NONE" && form.occasionFor === "OTHER" && (
              <div className="space-y-1">
                <Label>Occasion Person Name</Label>
                <Input data-testid="input-occasion-person" placeholder="Name of the person"
                  value={form.occasionPersonName} onChange={(e) => setField("occasionPersonName", e.target.value as any)} />
              </div>
            )}

            {form.occasionType !== "NONE" && (
              <div className="space-y-1">
                <Label>Occasion Notes</Label>
                <Textarea data-testid="input-occasion-notes" placeholder="e.g. In memory of…"
                  value={form.occasionNotes} onChange={(e) => setField("occasionNotes", e.target.value as any)} rows={2} />
              </div>
            )}

            {/* Internal Notes */}
            <div className="space-y-1">
              <Label>Internal Notes</Label>
              <Textarea data-testid="input-internal-notes" placeholder="Internal notes for staff only…"
                value={form.internalNotes} onChange={(e) => setField("internalNotes", e.target.value as any)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="button-submit-meal" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Meal Sponsorship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Meal Sponsorship?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete the meal sponsorship record. The linked donation record will remain intact.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" data-testid="button-confirm-delete"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
