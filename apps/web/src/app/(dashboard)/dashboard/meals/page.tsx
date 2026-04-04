"use client";

import { useState, useCallback } from "react";
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

const HOME_OPTIONS = [
  { value: "GIRLS_HOME", label: "Girls Home" },
  { value: "BLIND_BOYS_HOME", label: "Blind Boys Home" },
  { value: "OLD_AGE_HOME", label: "Old Age Home" },
];

const ALL_HOMES = HOME_OPTIONS.map((h) => h.value);

const SLOT_OPTIONS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];

const OCCASION_TYPES = [
  { value: "NONE", label: "None" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "WEDDING_ANNIVERSARY", label: "Wedding Anniversary" },
  { value: "MEMORIAL", label: "Memorial" },
  { value: "OTHER", label: "Other" },
];

function homeLabel(val: string) {
  return HOME_OPTIONS.find((h) => h.value === val)?.label ?? val;
}

function slotBadges(breakfast: boolean, lunch: boolean, dinner: boolean) {
  const slots = [];
  if (breakfast) slots.push("Breakfast");
  if (lunch) slots.push("Lunch");
  if (dinner) slots.push("Dinner");
  return slots;
}

interface MealSponsorship {
  id: string;
  homes: string[];
  sponsorshipType: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  foodType: string;
  mealNotes?: string;
  donationReceivedDate: string;
  mealServiceDate: string;
  paymentType: string;
  amount: string;
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
  dinner: boolean;
  foodType: "VEG" | "NON_VEG";
  mealNotes: string;
  donationReceivedDate: string;
  mealServiceDate: string;
  paymentType: "ADVANCE" | "FULL";
  amount: string;
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
  breakfast: true,
  lunch: true,
  dinner: true,
  foodType: "VEG",
  mealNotes: "",
  donationReceivedDate: format(new Date(), "yyyy-MM-dd"),
  mealServiceDate: format(new Date(), "yyyy-MM-dd"),
  paymentType: "FULL",
  amount: "",
  occasionType: "NONE",
  occasionFor: "",
  occasionPersonName: "",
  occasionNotes: "",
  internalNotes: "",
});

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
    page: 1,
    limit: 25,
  });

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
      params.set("page", String(filters.page));
      params.set("limit", String(filters.limit));
      const res = await fetchWithAuth(`/api/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetchWithAuth("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create meal sponsorship");
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
    if (val === "ENTIRE_DAY") {
      setField("breakfast", true);
      setField("lunch", true);
      setField("dinner", true);
    }
  }

  function handleAllHomesChange(checked: boolean) {
    setField("allHomes", checked);
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

  function handleSubmit() {
    if (!form.selectedDonor) {
      toast({ title: "Validation", description: "Please select a donor.", variant: "destructive" });
      return;
    }
    if (form.homes.length === 0) {
      toast({ title: "Validation", description: "Select at least one home.", variant: "destructive" });
      return;
    }
    if (!form.breakfast && !form.lunch && !form.dinner) {
      toast({ title: "Validation", description: "Select at least one meal slot.", variant: "destructive" });
      return;
    }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast({ title: "Validation", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      donorId: form.selectedDonor.id,
      homes: form.homes,
      sponsorshipType: form.sponsorshipType,
      breakfast: form.breakfast,
      lunch: form.lunch,
      dinner: form.dinner,
      foodType: form.foodType,
      mealNotes: form.mealNotes || undefined,
      donationReceivedDate: form.donationReceivedDate,
      mealServiceDate: form.mealServiceDate,
      paymentType: form.paymentType,
      amount: Number(form.amount),
      occasionType: form.occasionType || "NONE",
      occasionFor: form.occasionFor || undefined,
      occasionPersonName: form.occasionPersonName || undefined,
      occasionNotes: form.occasionNotes || undefined,
      internalNotes: form.internalNotes || undefined,
    });
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">Meal Date From</Label>
          <Input
            data-testid="filter-date-from"
            type="date"
            value={filters.mealServiceDate}
            onChange={(e) => setFilters((p) => ({ ...p, mealServiceDate: e.target.value, page: 1 }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Meal Date To</Label>
          <Input
            data-testid="filter-date-to"
            type="date"
            value={filters.mealServiceDateTo}
            onChange={(e) => setFilters((p) => ({ ...p, mealServiceDateTo: e.target.value, page: 1 }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Home</Label>
          <Select
            value={filters.home || "all"}
            onValueChange={(v) => setFilters((p) => ({ ...p, home: v === "all" ? "" : v, page: 1 }))}
          >
            <SelectTrigger data-testid="filter-home">
              <SelectValue placeholder="All Homes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homes</SelectItem>
              {HOME_OPTIONS.map((h) => (
                <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Meal Slot</Label>
          <Select
            value={filters.slot || "all"}
            onValueChange={(v) => setFilters((p) => ({ ...p, slot: v === "all" ? "" : v, page: 1 }))}
          >
            <SelectTrigger data-testid="filter-slot">
              <SelectValue placeholder="All Slots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Slots</SelectItem>
              {SLOT_OPTIONS.map((s) => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={filters.sponsorshipType || "all"}
            onValueChange={(v) => setFilters((p) => ({ ...p, sponsorshipType: v === "all" ? "" : v, page: 1 }))}
          >
            <SelectTrigger data-testid="filter-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ENTIRE_DAY">Entire Day</SelectItem>
              <SelectItem value="SELECTED_MEALS">Selected Meals</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            data-testid="button-clear-filters"
            onClick={() => setFilters({ mealServiceDate: "", mealServiceDateTo: "", home: "", slot: "", donorId: "", sponsorshipType: "", page: 1, limit: 25 })}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Meal Date</TableHead>
              <TableHead>Homes</TableHead>
              <TableHead>Slots</TableHead>
              <TableHead>Food</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Occasion</TableHead>
              <TableHead>By</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  No meal sponsorships found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
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
                      {slotBadges(item.breakfast, item.lunch, item.dinner).map((s) => (
                        <Badge key={s} className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-0">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.foodType === "VEG" ? "outline" : "secondary"} className="text-xs">
                      {item.foodType === "VEG" ? "🟢 Veg" : "🔴 Non-Veg"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{Number(item.amount).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.paymentType === "FULL" ? "default" : "secondary"} className="text-xs">
                      {item.paymentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.occasionType !== "NONE" ? item.occasionType.replace(/_/g, " ") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {item.createdBy?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-delete-meal-${item.id}`}
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Total: {data?.total ?? 0} records
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {filters.page} of {totalPages}</span>
            <Button
              variant="outline"
              size="icon"
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Dialog */}
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
                  <Button variant="ghost" size="sm" onClick={() => { setField("selectedDonor", null); setField("donorId", ""); setField("donorSearch", ""); }}>
                    Change
                  </Button>
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
                  {showDonorDropdown && (form.donorSearch.length >= 2) && (
                    <div className="absolute z-50 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-48 overflow-y-auto">
                      {donorLoading ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Searching…
                        </div>
                      ) : donorResults.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">No donors found</div>
                      ) : (
                        donorResults.map((d) => (
                          <button
                            key={d.id}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                            onClick={() => {
                              setField("selectedDonor", d as any);
                              setField("donorId", d.id as any);
                              setField("donorSearch", `${d.firstName} ${d.lastName}` as any);
                              setShowDonorDropdown(false);
                              setDonorResults([]);
                            }}
                          >
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
                  <Checkbox
                    data-testid="checkbox-all-homes"
                    id="all-homes"
                    checked={form.allHomes}
                    onCheckedChange={(c) => handleAllHomesChange(!!c)}
                  />
                  <Label htmlFor="all-homes" className="cursor-pointer font-medium">All Homes</Label>
                </div>
                {HOME_OPTIONS.map((h) => (
                  <div key={h.value} className="flex items-center gap-2">
                    <Checkbox
                      data-testid={`checkbox-home-${h.value}`}
                      id={h.value}
                      checked={form.homes.includes(h.value)}
                      onCheckedChange={() => toggleHome(h.value)}
                    />
                    <Label htmlFor={h.value} className="cursor-pointer">{h.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsorship Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Sponsorship Type <span className="text-destructive">*</span></Label>
                <Select
                  value={form.sponsorshipType}
                  onValueChange={(v) => handleSponsorshipTypeChange(v as any)}
                >
                  <SelectTrigger data-testid="select-sponsorship-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTIRE_DAY">Entire Day</SelectItem>
                    <SelectItem value="SELECTED_MEALS">Selected Meals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Food Type <span className="text-destructive">*</span></Label>
                <Select
                  value={form.foodType}
                  onValueChange={(v) => setField("foodType", v as any)}
                >
                  <SelectTrigger data-testid="select-food-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VEG">🟢 Veg</SelectItem>
                    <SelectItem value="NON_VEG">🔴 Non-Veg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Meal Slots */}
            {form.sponsorshipType === "SELECTED_MEALS" && (
              <div className="space-y-2">
                <Label>Meal Slots <span className="text-destructive">*</span></Label>
                <div className="flex gap-6 p-3 border rounded-lg">
                  {SLOT_OPTIONS.map((s) => (
                    <div key={s.key} className="flex items-center gap-2">
                      <Checkbox
                        data-testid={`checkbox-slot-${s.key}`}
                        id={s.key}
                        checked={(form as any)[s.key]}
                        onCheckedChange={(c) => setField(s.key as any, !!c)}
                      />
                      <Label htmlFor={s.key} className="cursor-pointer">{s.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {form.sponsorshipType === "ENTIRE_DAY" && (
              <div className="flex gap-2">
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-0">Breakfast</Badge>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-0">Lunch</Badge>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-0">Dinner</Badge>
              </div>
            )}

            {/* Menu / Notes */}
            <div className="space-y-1">
              <Label>Menu / Meal Notes</Label>
              <Textarea
                data-testid="input-meal-notes"
                placeholder="e.g. Biriyani, sweets…"
                value={form.mealNotes}
                onChange={(e) => setField("mealNotes", e.target.value as any)}
                rows={2}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Donation Received Date <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-donation-received-date"
                  type="date"
                  value={form.donationReceivedDate}
                  onChange={(e) => setField("donationReceivedDate", e.target.value as any)}
                />
              </div>
              <div className="space-y-1">
                <Label>Meal Service Date <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-meal-service-date"
                  type="date"
                  value={form.mealServiceDate}
                  onChange={(e) => setField("mealServiceDate", e.target.value as any)}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Payment Type <span className="text-destructive">*</span></Label>
                <Select
                  value={form.paymentType}
                  onValueChange={(v) => setField("paymentType", v as any)}
                >
                  <SelectTrigger data-testid="select-payment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL">Full Payment</SelectItem>
                    <SelectItem value="ADVANCE">Advance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                <Input
                  data-testid="input-amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setField("amount", e.target.value as any)}
                />
              </div>
            </div>

            {/* Occasion */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Occasion</Label>
                <Select
                  value={form.occasionType}
                  onValueChange={(v) => setField("occasionType", v as any)}
                >
                  <SelectTrigger data-testid="select-occasion-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCASION_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.occasionType !== "NONE" && (
                <div className="space-y-1">
                  <Label>Occasion For</Label>
                  <Select
                    value={form.occasionFor || "SELF"}
                    onValueChange={(v) => setField("occasionFor", v as any)}
                  >
                    <SelectTrigger data-testid="select-occasion-for">
                      <SelectValue />
                    </SelectTrigger>
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
                <Input
                  data-testid="input-occasion-person"
                  placeholder="Name of the person"
                  value={form.occasionPersonName}
                  onChange={(e) => setField("occasionPersonName", e.target.value as any)}
                />
              </div>
            )}

            {form.occasionType !== "NONE" && (
              <div className="space-y-1">
                <Label>Occasion Notes</Label>
                <Textarea
                  data-testid="input-occasion-notes"
                  placeholder="e.g. In memory of…"
                  value={form.occasionNotes}
                  onChange={(e) => setField("occasionNotes", e.target.value as any)}
                  rows={2}
                />
              </div>
            )}

            {/* Internal Notes */}
            <div className="space-y-1">
              <Label>Internal Notes</Label>
              <Textarea
                data-testid="input-internal-notes"
                placeholder="Internal notes for staff only…"
                value={form.internalNotes}
                onChange={(e) => setField("internalNotes", e.target.value as any)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              data-testid="button-submit-meal"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Meal Sponsorship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Meal Sponsorship?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will delete the meal sponsorship record. The linked donation record will remain intact.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              data-testid="button-confirm-delete"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
