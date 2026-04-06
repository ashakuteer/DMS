"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fetchWithAuth, authStorage } from "@/lib/auth";
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
  Calendar,
  List,
  ClipboardList,
} from "lucide-react";
import { MealsCalendar } from "./MealsCalendar";
import { PostMealModal, type PostMealMeal } from "./PostMealModal";
import { PendingActionsTab } from "./PendingActionsTab";
import { MealsMobileView } from "./MealsMobileView";
import { MealsListView } from "./MealsListView";
import { useMealsLang } from "./useMealsLang";
import { SLOT_LANG, HOME_LANG, FOOD_TYPE_LANG, BOOKING_STATUS_LANG, PAYMENT_STATUS_LANG, DONOR_VISIT_LANG, TELECALLER_LANG, getMenuLabel, type MealsLang } from "./mealsLang";

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

const HOME_VALUES_CONST = ["GIRLS_HOME", "BLIND_BOYS_HOME", "OLD_AGE_HOME"];
const ALL_HOMES = HOME_VALUES_CONST;

const SLOT_KEYS = ["breakfast", "lunch", "eveningSnacks", "dinner"] as const;
const SLOT_FILTER_KEYS = ["breakfast", "lunch", "evening_snacks", "dinner"] as const;

const OCCASION_TYPES = [
  { value: "NONE", label: "None" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "WEDDING_ANNIVERSARY", label: "Wedding Anniversary" },
  { value: "MEMORIAL", label: "Memorial" },
  { value: "OTHER", label: "Other" },
];

// Reused from donor profile utils.ts — same list, no duplicate master
const OCCASION_RELATION_OPTIONS = [
  { value: "SELF", label: "Self" },
  { value: "SELF_AND_SPOUSE", label: "Self & Spouse" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "SON", label: "Son" },
  { value: "DAUGHTER", label: "Daughter" },
  { value: "CHILD", label: "Child" },
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "BROTHER", label: "Brother" },
  { value: "SISTER", label: "Sister" },
  { value: "SIBLING", label: "Sibling" },
  { value: "PARENTS", label: "Parents" },
  { value: "FATHER_IN_LAW", label: "Father-in-law" },
  { value: "MOTHER_IN_LAW", label: "Mother-in-law" },
  { value: "BROTHER_IN_LAW", label: "Brother-in-law" },
  { value: "SISTER_IN_LAW", label: "Sister-in-law" },
  { value: "SON_IN_LAW", label: "Son-in-law" },
  { value: "DAUGHTER_IN_LAW", label: "Daughter-in-law" },
  { value: "IN_LAW", label: "In-law" },
  { value: "GRANDFATHER", label: "Grandfather" },
  { value: "GRANDMOTHER", label: "Grandmother" },
  { value: "GRANDPARENT", label: "Grandparent" },
  { value: "GRANDPARENTS", label: "Grandparents" },
  { value: "GRANDSON", label: "Grandson" },
  { value: "GRANDDAUGHTER", label: "Granddaughter" },
  { value: "GRANDCHILD", label: "Grandchild" },
  { value: "GRANDCHILDREN", label: "Grandchildren" },
  { value: "COUSIN", label: "Cousin" },
  { value: "UNCLE", label: "Uncle" },
  { value: "AUNT", label: "Aunt" },
  { value: "FIANCE", label: "Fiancé" },
  { value: "FIANCEE", label: "Fiancée" },
  { value: "FAMILY", label: "Family" },
  { value: "FRIEND", label: "Friend" },
  { value: "COLLEAGUE", label: "Colleague" },
  { value: "BOSS", label: "Boss" },
  { value: "MENTOR", label: "Mentor" },
  { value: "OTHER", label: "Other" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function homeLabel(val: string, lang: MealsLang = "te") {
  return HOME_LANG[lang][val] ?? val;
}

function slotBadges(breakfast: boolean, lunch: boolean, eveningSnacks: boolean, dinner: boolean, lang: MealsLang = "te") {
  const sl = SLOT_LANG[lang];
  const slots = [];
  if (breakfast) slots.push(sl.breakfast);
  if (lunch) slots.push(sl.lunch);
  if (eveningSnacks) slots.push(sl.eveningSnacks);
  if (dinner) slots.push(sl.dinner);
  return slots;
}

function paymentStatusColor(status?: string) {
  switch (status) {
    case "FULL": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "PARTIAL": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    case "ADVANCE": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "AFTER_SERVICE": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
    case "NOT_YET": return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
    default: return "bg-muted text-muted-foreground";
  }
}

function paymentStatusLabel(status?: string, legacyType?: string, lang: MealsLang = "te") {
  if (status) return PAYMENT_STATUS_LANG[lang][status] ?? status.replace(/_/g, " ");
  if (legacyType) return legacyType;
  return "—";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealSponsorship {
  id: string;
  homes: string[];
  slotHomes?: Record<string, string[]> | null;
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
  bookingStatus?: string;
  donorVisitExpected?: boolean;
  occasionType: string;
  occasionFor?: string;
  occasionPersonName?: string;
  occasionRelationship?: string;
  internalNotes?: string;
  donationId?: string;
  donor: { id: string; firstName: string; lastName: string; donorCode: string };
  donation?: { id: string; donationAmount: string };
  createdBy?: { name: string };
  visitRecord?: { id: string; visitDate: string } | null;
  // Phase 3A — Post-Meal
  mealCompleted?: boolean | null;
  mealCompletedAt?: string | null;
  donorVisited?: boolean | null;
  donorVisitNotes?: string | null;
  balancePaidAfterMeal?: boolean | null;
  postMealAmountReceived?: string | null;
  promiseMade?: boolean | null;
  promiseNotes?: string | null;
  thankYouSent?: boolean | null;
  reviewRequested?: boolean | null;
  askedToSendHi?: boolean | null;
  extraItemsGiven?: boolean | null;
  extraItemTypes?: string[];
  extraItemNotes?: string | null;
  extraItemEstimatedValue?: string | null;
}

interface FormState {
  donorId: string;
  donorSearch: string;
  selectedDonor: { id: string; firstName: string; lastName: string; donorCode: string } | null;
  slotHomes: Record<string, string[]>;
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
  bookingStatus: string;
  donorVisitExpected: boolean;
  occasionType: string;
  occasionFor: string;
  occasionPersonName: string;
  occasionRelationship: string;
  occasionNotes: string;
  internalNotes: string;
}

const defaultForm = (): FormState => ({
  donorId: "",
  donorSearch: "",
  selectedDonor: null,
  slotHomes: { breakfast: [], lunch: [], eveningSnacks: [], dinner: [] },
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
  bookingStatus: "CONFIRMED",
  donorVisitExpected: true,
  occasionType: "NONE",
  occasionFor: "",
  occasionPersonName: "",
  occasionRelationship: "",
  occasionNotes: "",
  internalNotes: "",
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lang, setLang] = useMealsLang();

  // Dynamic label arrays based on lang
  const HOME_OPTIONS = useMemo(
    () => HOME_VALUES_CONST.map((v) => ({ value: v, label: HOME_LANG[lang][v] ?? v })),
    [lang],
  );
  const SLOT_OPTIONS = useMemo(
    () => SLOT_KEYS.map((k) => ({ key: k, label: SLOT_LANG[lang][k] ?? k })),
    [lang],
  );
  const SLOT_FILTER_OPTIONS = useMemo(
    () => [
      { key: "breakfast", label: SLOT_LANG[lang].breakfast },
      { key: "lunch", label: SLOT_LANG[lang].lunch },
      { key: "evening_snacks", label: SLOT_LANG[lang].eveningSnacks },
      { key: "dinner", label: SLOT_LANG[lang].dinner },
    ],
    [lang],
  );
  const BOOKING_STATUS_OPTIONS = useMemo(
    () => [
      { value: "HOLD", label: BOOKING_STATUS_LANG[lang].HOLD },
      { value: "CONFIRMED", label: BOOKING_STATUS_LANG[lang].CONFIRMED },
    ],
    [lang],
  );
  const PAYMENT_STATUS_OPTIONS = useMemo(
    () => [
      { value: "NOT_YET", label: PAYMENT_STATUS_LANG[lang].NOT_YET },
      { value: "ADVANCE", label: PAYMENT_STATUS_LANG[lang].ADVANCE },
      { value: "PARTIAL", label: PAYMENT_STATUS_LANG[lang].PARTIAL },
      { value: "FULL", label: PAYMENT_STATUS_LANG[lang].FULL },
      { value: "AFTER_SERVICE", label: PAYMENT_STATUS_LANG[lang].AFTER_SERVICE },
    ],
    [lang],
  );

  const currentUser = authStorage.getUser();
  const isHomeIncharge = currentUser?.role === "HOME_INCHARGE";
  const isOfficeIncharge = currentUser?.role === "OFFICE_INCHARGE";
  const canCreate = !isHomeIncharge;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "calendar" | "pending" | "schedule">("list");
  const [form, setForm] = useState<FormState>(defaultForm());
  const [donorResults, setDonorResults] = useState<any[]>([]);
  const [donorLoading, setDonorLoading] = useState(false);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [postMealMeal, setPostMealMeal] = useState<PostMealMeal | null>(null);

  // Quick donor inline form state
  const [showQuickDonor, setShowQuickDonor] = useState(false);
  const [quickDonorForm, setQuickDonorForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [quickDonorLoading, setQuickDonorLoading] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ["/api/meals/matrix"] });
      toast({ title: "Meal sponsorship created", description: "Linked donation record also created." });
      setOpen(false);
      setForm(defaultForm());
      setDonorResults([]);
      setShowQuickDonor(false);
      setQuickDonorForm({ firstName: "", lastName: "", phone: "" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/meals/matrix"] });
      toast({ title: "Deleted", description: "Meal sponsorship removed." });
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleQuickDonorSubmit() {
    if (!quickDonorForm.firstName.trim() || !quickDonorForm.phone.trim()) {
      toast({ title: "Required fields", description: "First name and phone number are required.", variant: "destructive" });
      return;
    }
    setQuickDonorLoading(true);
    try {
      const res = await fetchWithAuth("/api/meals/quick-donor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickDonorForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to create donor");
      }
      const result = await res.json();
      const d = result.donor;
      if (result.existed) {
        toast({ title: "Donor already exists", description: `Using existing donor: ${d.firstName} ${d.lastName ?? ""} (${d.donorCode})` });
      } else {
        toast({ title: "Donor created", description: `${d.firstName} ${d.lastName ?? ""} added as a new donor.` });
      }
      setForm((prev) => ({
        ...prev,
        donorId: d.id,
        donorSearch: `${d.firstName} ${d.lastName ?? ""}`.trim(),
        selectedDonor: { id: d.id, firstName: d.firstName, lastName: d.lastName ?? "", donorCode: d.donorCode },
      }));
      setDonorResults([]);
      setShowDonorDropdown(false);
      setShowQuickDonor(false);
      setQuickDonorForm({ firstName: "", lastName: "", phone: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to create donor", variant: "destructive" });
    } finally {
      setQuickDonorLoading(false);
    }
  }

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

  function toggleSlotHome(slot: string, home: string) {
    setForm((prev) => {
      const current = prev.slotHomes[slot] ?? [];
      const has = current.includes(home);
      const next = has ? current.filter((h) => h !== home) : [...current, home];
      return { ...prev, slotHomes: { ...prev.slotHomes, [slot]: next } };
    });
  }

  function setAllHomesForSlot(slot: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      slotHomes: { ...prev.slotHomes, [slot]: checked ? [...ALL_HOMES] : [] },
    }));
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

  function handleBookingStatusChange(status: string) {
    if (status === "HOLD") {
      setForm((prev) => ({
        ...prev,
        bookingStatus: "HOLD",
        paymentStatus: "NOT_YET",
        amountReceived: "0",
      }));
    } else {
      setField("bookingStatus", status as any);
    }
  }

  function handleAddWithPrefill(
    date: string,
    slots: Partial<Record<"breakfast" | "lunch" | "eveningSnacks" | "dinner", boolean>>,
    home: string,
  ) {
    const prefilled = defaultForm();
    prefilled.mealServiceDate = date;
    prefilled.donationReceivedDate = date;
    if (slots.breakfast) prefilled.breakfast = true as any;
    if (slots.lunch) prefilled.lunch = true as any;
    if (slots.eveningSnacks) prefilled.eveningSnacks = true as any;
    if (slots.dinner) prefilled.dinner = true as any;
    if (home) {
      // Pre-fill the home for each prefilled slot
      const sh: Record<string, string[]> = { breakfast: [], lunch: [], eveningSnacks: [], dinner: [] };
      (["breakfast", "lunch", "eveningSnacks", "dinner"] as const).forEach((s) => {
        if (slots[s]) sh[s] = [home];
      });
      prefilled.slotHomes = sh;
    }
    setForm(prefilled);
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.selectedDonor) {
      toast({ title: "Validation", description: "Please select a donor.", variant: "destructive" });
      return;
    }

    const activeSlots = (["breakfast", "lunch", "eveningSnacks", "dinner"] as const).filter(
      (s) => (form as any)[s],
    );

    if (activeSlots.length === 0) {
      toast({ title: "Validation", description: "Select at least one meal slot.", variant: "destructive" });
      return;
    }

    // Validate each active slot has at least one home
    for (const slot of activeSlots) {
      const slotLabel = SLOT_LANG[lang][slot] ?? slot;
      if ((form.slotHomes[slot] ?? []).length === 0) {
        toast({ title: "Validation", description: `Select at least one home for ${slotLabel}.`, variant: "destructive" });
        return;
      }
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

    // Build legacy homes field from slotHomes (union of all slot homes)
    const derivedHomes = [...new Set(activeSlots.flatMap((s) => form.slotHomes[s] ?? []))];

    // Build slotHomes payload — only include active slots
    const slotHomesPayload: Record<string, string[]> = {};
    for (const s of activeSlots) {
      slotHomesPayload[s] = form.slotHomes[s] ?? [];
    }

    createMutation.mutate({
      donorId: form.selectedDonor.id,
      homes: derivedHomes,
      slotHomes: slotHomesPayload,
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
      bookingStatus: form.bookingStatus || "CONFIRMED",
      donorVisitExpected: form.donorVisitExpected,
      occasionType: form.occasionType || "NONE",
      occasionFor: form.occasionFor || undefined,
      occasionPersonName: form.occasionPersonName || undefined,
      occasionRelationship: form.occasionFor === "OTHER" && form.occasionRelationship ? form.occasionRelationship : undefined,
      occasionNotes: form.occasionNotes || undefined,
      internalNotes: form.internalNotes || undefined,
    });
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // ─── Mobile check ────────────────────────────────────────────────────────────

  const showMobileView = isMobile && (isHomeIncharge || isOfficeIncharge);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
    {showMobileView && (
      <MealsListView
        isHomeIncharge={isHomeIncharge}
        canCreate={canCreate}
        onAddMeal={() => { setOpen(true); setForm(defaultForm()); }}
        onOpenPostMeal={(meal) => setPostMealMeal(meal)}
      />
    )}
    <div className={showMobileView ? "hidden" : "p-6 space-y-6"}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Meals Sponsorship</h1>
            <p className="text-sm text-muted-foreground">Meal sponsorship records for all homes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden text-xs">
            <button
              data-testid="lang-toggle-en"
              className={`px-2.5 py-1.5 transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
              onClick={() => setLang("en")}
            >EN</button>
            <button
              data-testid="lang-toggle-te"
              className={`px-2.5 py-1.5 transition-colors ${lang === "te" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
              onClick={() => setLang("te")}
            >తె</button>
          </div>
          {/* View toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              data-testid="view-toggle-list"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              data-testid="view-toggle-calendar"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => setView("calendar")}
            >
              <Calendar className="h-4 w-4" /> Calendar
            </button>
            <button
              data-testid="view-toggle-pending"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                view === "pending"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              onClick={() => setView("pending")}
            >
              <ClipboardList className="h-4 w-4" /> Pending Actions
            </button>
            {(isHomeIncharge || isOfficeIncharge) && (
              <button
                data-testid="view-toggle-schedule"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l ${
                  view === "schedule"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
                onClick={() => setView("schedule")}
              >
                <UtensilsCrossed className="h-4 w-4" /> Schedule
              </button>
            )}
          </div>
          {canCreate && (
            <Button data-testid="button-add-meal" onClick={() => { setOpen(true); setForm(defaultForm()); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Meal Sponsorship
            </Button>
          )}
        </div>
      </div>

      {/* Calendar view */}
      {view === "calendar" && (
        <MealsCalendar onAddWithPrefill={handleAddWithPrefill} />
      )}

      {/* Pending Actions view */}
      {view === "pending" && (
        <PendingActionsTab
          onOpenPostMeal={(meal) => setPostMealMeal(meal)}
        />
      )}

      {/* Schedule view — mobile-first list for Home/Office Incharge */}
      {view === "schedule" && (
        <div className="border rounded-xl overflow-hidden">
          <MealsListView
            isHomeIncharge={isHomeIncharge}
            canCreate={canCreate}
            onAddMeal={() => { setOpen(true); setForm(defaultForm()); }}
            onOpenPostMeal={(meal) => setPostMealMeal(meal)}
            compact
          />
        </div>
      )}

      {/* Filters — only in list view */}
      {view === "list" && (<>
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
        {!isHomeIncharge && (
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
        )}
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
              <TableHead>{TELECALLER_LANG[lang]}</TableHead>
              <TableHead>Total / Rcvd / Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Occasion</TableHead>
              <TableHead>By</TableHead>
              <TableHead>Post-Meal</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
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
                const baseReceived = isLegacyFullPaid ? total : rawReceived;
                const postMealExtra = Number(item.postMealAmountReceived ?? 0);
                const received = baseReceived + postMealExtra;
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
                      {item.slotHomes ? (
                        <div className="space-y-1">
                          {(["breakfast", "lunch", "eveningSnacks", "dinner"] as const)
                            .filter((s) => item[s])
                            .map((s) => {
                              const slotLabel = { breakfast: "BF", lunch: "Lunch", eveningSnacks: "Eve", dinner: "Dinner" }[s];
                              const hs = (item.slotHomes as Record<string, string[]>)[s] ?? [];
                              return (
                                <div key={s} className="flex items-center gap-1 flex-wrap">
                                  <span className="text-xs font-medium text-muted-foreground w-10 shrink-0">{slotLabel}:</span>
                                  {hs.map((h) => (
                                    <Badge key={h} variant="outline" className="text-xs px-1 py-0">{homeLabel(h, lang)}</Badge>
                                  ))}
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.homes.map((h) => (
                            <Badge key={h} variant="outline" className="text-xs">{homeLabel(h, lang)}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {slotBadges(item.breakfast, item.lunch, item.eveningSnacks ?? false, item.dinner, lang).map((s) => (
                          <Badge key={s} className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-0">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.foodType === "VEG" ? "outline" : "secondary"} className="text-xs">
                        {FOOD_TYPE_LANG[lang][item.foodType] ?? (item.foodType === "VEG" ? "🟢 Veg" : "🔴 Non-Veg")}
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
                      <div className="flex flex-col gap-1">
                        {item.bookingStatus === "HOLD" ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 border-dashed w-fit">
                            ⏸ {BOOKING_STATUS_LANG[lang].HOLD}
                          </span>
                        ) : item.bookingStatus === "CANCELLED" ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 w-fit">
                            ❌ {BOOKING_STATUS_LANG[lang].CANCELLED}
                          </span>
                        ) : item.bookingStatus === "COMPLETED" ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 w-fit">
                            ✅ {BOOKING_STATUS_LANG[lang].COMPLETED}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 w-fit">
                            ✓ {BOOKING_STATUS_LANG[lang].CONFIRMED}
                          </span>
                        )}
                        {item.bookingStatus !== "HOLD" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${paymentStatusColor(item.paymentStatus)}`}>
                            {paymentStatusLabel(item.paymentStatus, item.paymentType, lang)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.occasionType !== "NONE" ? item.occasionType.replace(/_/g, " ") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.createdBy?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 min-w-[80px]">
                        {item.mealCompleted === true && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 font-medium w-fit">✓ Done</span>
                        )}
                        {item.donorVisited === true && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-medium w-fit">Visited</span>
                        )}
                        {item.promiseMade === true && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 font-medium w-fit">Promise</span>
                        )}
                        {item.extraItemsGiven === true && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 font-medium w-fit">Extras</span>
                        )}
                        {(item.balancePaidAfterMeal === true || (postMealExtra > 0 && balance === 0)) && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 font-medium w-fit">Bal Clr</span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 px-2 mt-0.5"
                          data-testid={`button-post-meal-${item.id}`}
                          onClick={() => setPostMealMeal(item as PostMealMeal)}
                        >
                          Post-Meal
                        </Button>
                      </div>
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
      </>)}

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
                    <div className="absolute z-50 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto">
                      {donorLoading ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Searching…
                        </div>
                      ) : donorResults.length === 0 ? (
                        <>
                          <div className="p-3 text-center text-sm text-muted-foreground border-b">No donors found</div>
                          {!showQuickDonor && (
                            <button
                              data-testid="button-add-quick-donor"
                              className="w-full text-left px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted transition-colors flex items-center gap-2"
                              onClick={() => setShowQuickDonor(true)}
                            >
                              <Plus className="h-4 w-4" /> Add as new donor
                            </button>
                          )}
                        </>
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
                  {/* Quick Donor inline form */}
                  {showQuickDonor && !form.selectedDonor && (
                    <div className="mt-2 p-3 border rounded-lg bg-muted/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Add Quick Donor</p>
                        <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowQuickDonor(false)}>✕ Cancel</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">First Name <span className="text-destructive">*</span></Label>
                          <Input
                            data-testid="input-quick-donor-firstname"
                            placeholder="First name"
                            value={quickDonorForm.firstName}
                            onChange={(e) => setQuickDonorForm((p) => ({ ...p, firstName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Last Name</Label>
                          <Input
                            data-testid="input-quick-donor-lastname"
                            placeholder="Last name"
                            value={quickDonorForm.lastName}
                            onChange={(e) => setQuickDonorForm((p) => ({ ...p, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phone (WhatsApp) <span className="text-destructive">*</span></Label>
                        <Input
                          data-testid="input-quick-donor-phone"
                          placeholder="Phone number"
                          type="tel"
                          value={quickDonorForm.phone}
                          onChange={(e) => setQuickDonorForm((p) => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                      <Button
                        data-testid="button-quick-donor-submit"
                        size="sm"
                        className="w-full"
                        disabled={quickDonorLoading}
                        onClick={handleQuickDonorSubmit}
                      >
                        {quickDonorLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        {quickDonorLoading ? "Creating…" : "Create Donor & Select"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
                    <SelectItem value="VEG">{FOOD_TYPE_LANG[lang].VEG}</SelectItem>
                    <SelectItem value="NON_VEG">{FOOD_TYPE_LANG[lang].NON_VEG}</SelectItem>
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

            {/* Homes per Slot */}
            <div className="space-y-3">
              <Label>Homes per Slot <span className="text-destructive">*</span></Label>
              {SLOT_OPTIONS.every((s) => !(form as any)[s.key]) ? (
                <p className="text-sm text-muted-foreground border rounded-lg p-3">
                  Select at least one meal slot above to assign homes.
                </p>
              ) : (
                <div className="space-y-3">
                  {SLOT_OPTIONS.filter((s) => (form as any)[s.key]).map((s) => {
                    const slotKey = s.key;
                    const slotHomes = form.slotHomes[slotKey] ?? [];
                    const allChecked = slotHomes.length === HOME_OPTIONS.length;
                    return (
                      <div key={slotKey} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{s.label}</p>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              data-testid={`checkbox-all-homes-${slotKey}`}
                              id={`all-homes-${slotKey}`}
                              checked={allChecked}
                              onCheckedChange={(c) => setAllHomesForSlot(slotKey, !!c)}
                            />
                            <Label htmlFor={`all-homes-${slotKey}`} className="cursor-pointer text-sm font-medium">All Homes</Label>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {HOME_OPTIONS.map((h) => (
                            <div key={h.value} className="flex items-center gap-2">
                              <Checkbox
                                data-testid={`checkbox-home-${slotKey}-${h.value}`}
                                id={`home-${slotKey}-${h.value}`}
                                checked={slotHomes.includes(h.value)}
                                onCheckedChange={() => toggleSlotHome(slotKey, h.value)}
                              />
                              <Label htmlFor={`home-${slotKey}-${h.value}`} className="cursor-pointer text-sm">{h.label}</Label>
                            </div>
                          ))}
                        </div>
                        {slotHomes.length === 0 && (
                          <p className="text-xs text-destructive">Select at least one home for this slot.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                          <Label htmlFor={`menu-${item}`} className="cursor-pointer text-sm font-normal">{getMenuLabel(item, lang)}</Label>
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
              <Label>{TELECALLER_LANG[lang]}</Label>
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

            {/* Booking Status + Donor Visit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Booking Status</Label>
                <Select value={form.bookingStatus} onValueChange={handleBookingStatusChange}>
                  <SelectTrigger data-testid="select-booking-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOOKING_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{DONOR_VISIT_LANG[lang].label}</Label>
                <div className="flex rounded-md border overflow-hidden h-10">
                  <button
                    type="button"
                    data-testid="btn-visit-no"
                    onClick={() => setField("donorVisitExpected", false as any)}
                    className={`flex-1 text-sm font-medium transition-colors border-r ${!form.donorVisitExpected ? "bg-orange-50 text-orange-700" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    {DONOR_VISIT_LANG[lang].photo}
                  </button>
                  <button
                    type="button"
                    data-testid="btn-visit-yes"
                    onClick={() => setField("donorVisitExpected", true as any)}
                    className={`flex-1 text-sm font-medium transition-colors ${form.donorVisitExpected ? "bg-green-50 text-green-700" : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    {DONOR_VISIT_LANG[lang].visit}
                  </button>
                </div>
              </div>
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
            <div className={`space-y-3 p-4 border rounded-lg ${form.bookingStatus === "HOLD" ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700" : "bg-muted/10"}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Payment Details</p>
                {form.bookingStatus === "HOLD" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 font-medium border border-yellow-300 dark:border-yellow-600 border-dashed">
                    ⏸ HOLD — payment not collected yet
                  </span>
                )}
              </div>
              <div className={`grid grid-cols-3 gap-3 ${form.bookingStatus === "HOLD" ? "opacity-40 pointer-events-none select-none" : ""}`}>
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

              <div className={`grid grid-cols-2 gap-3 ${form.bookingStatus === "HOLD" ? "opacity-40 pointer-events-none select-none" : ""}`}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Relationship</Label>
                  <Select
                    value={form.occasionRelationship || "__none__"}
                    onValueChange={(v) => setField("occasionRelationship", v === "__none__" ? "" as any : v as any)}
                  >
                    <SelectTrigger data-testid="select-occasion-relationship">
                      <SelectValue placeholder="Select relationship…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Select —</SelectItem>
                      {OCCASION_RELATION_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Occasion Person Name</Label>
                  <Input data-testid="input-occasion-person" placeholder="Name of the person"
                    value={form.occasionPersonName} onChange={(e) => setField("occasionPersonName", e.target.value as any)} />
                </div>
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
      {/* Post-Meal Update Modal */}
      <PostMealModal
        meal={postMealMeal}
        open={!!postMealMeal}
        onClose={() => setPostMealMeal(null)}
      />

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
    </>
  );
}
