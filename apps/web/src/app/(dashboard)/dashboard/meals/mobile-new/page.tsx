"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Search,
  User as UserIcon,
  UtensilsCrossed,
  Wallet,
  Heart,
  ClipboardCheck,
} from "lucide-react";

const HOME_VALUES = ["GIRLS_HOME", "BLIND_BOYS_HOME", "OLD_AGE_HOME"] as const;
const HOME_LABELS: Record<string, string> = {
  GIRLS_HOME: "Girls Home",
  BLIND_BOYS_HOME: "Blind Boys Home",
  OLD_AGE_HOME: "Old Age Home",
};

const SLOT_KEYS = ["breakfast", "lunch", "eveningSnacks", "dinner"] as const;
const SLOT_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  eveningSnacks: "Evening Snacks",
  dinner: "Dinner",
};

const OCCASION_TYPES = [
  { value: "NONE", label: "None" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "WEDDING_ANNIVERSARY", label: "Wedding Anniversary" },
  { value: "MEMORIAL", label: "Memorial" },
  { value: "OTHER", label: "Other" },
];

// MUST match the codes used by the desktop Meal Sponsorship form so that
// People & Occasions sync produces identical profile entries.
const RELATION_OPTIONS = [
  { value: "SELF", label: "Self" },
  { value: "SELF_AND_SPOUSE", label: "Self & Spouse" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "SON", label: "Son" },
  { value: "DAUGHTER", label: "Daughter" },
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "BROTHER", label: "Brother" },
  { value: "SISTER", label: "Sister" },
  { value: "PARENTS", label: "Parents" },
  { value: "FATHER_IN_LAW", label: "Father-in-law" },
  { value: "MOTHER_IN_LAW", label: "Mother-in-law" },
  { value: "GRANDFATHER", label: "Grandfather" },
  { value: "GRANDMOTHER", label: "Grandmother" },
  { value: "FAMILY", label: "Family" },
  { value: "FRIEND", label: "Friend" },
  { value: "OTHER", label: "Other" },
];

const OCCASION_FOR_OPTIONS = [
  { value: "SELF", label: "Self / donor" },
  { value: "OTHER", label: "Someone else" },
];

interface SelectedDonor {
  id: string;
  firstName: string;
  lastName?: string;
  donorCode?: string;
  phone?: string;
}

interface FormState {
  selectedDonor: SelectedDonor | null;
  donorSearch: string;
  mealServiceDate: string;
  donationReceivedDate: string;
  sponsorshipType: "ENTIRE_DAY" | "SELECTED_MEALS";
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  slotHomes: Record<string, string[]>;
  foodType: "VEG" | "NON_VEG";
  specialMenuItem: string;
  mealNotes: string;
  bookingStatus: "CONFIRMED" | "TENTATIVE" | "HOLD";
  donorVisitExpected: boolean;
  totalAmount: string;
  amountReceived: string;
  paymentStatus: "FULL" | "PARTIAL" | "ADVANCE" | "AFTER_SERVICE" | "NOT_YET";
  paymentType: "CASH" | "ONLINE" | "CHEQUE" | "BANK_TRANSFER" | "";
  transactionId: string;
  occasionType: string;
  occasionFor: "" | "SELF" | "OTHER";
  occasionPersonName: string;
  occasionRelationship: string;
  occasionNotes: string;
  telecallerName: string;
  internalNotes: string;
}

function defaultForm(): FormState {
  return {
    selectedDonor: null,
    donorSearch: "",
    mealServiceDate: format(new Date(), "yyyy-MM-dd"),
    donationReceivedDate: format(new Date(), "yyyy-MM-dd"),
    sponsorshipType: "ENTIRE_DAY",
    breakfast: true,
    lunch: true,
    eveningSnacks: false,
    dinner: true,
    slotHomes: { breakfast: [], lunch: [], eveningSnacks: [], dinner: [] },
    foodType: "VEG",
    specialMenuItem: "",
    mealNotes: "",
    bookingStatus: "CONFIRMED",
    donorVisitExpected: true,
    totalAmount: "",
    amountReceived: "0",
    paymentStatus: "FULL",
    paymentType: "",
    transactionId: "",
    occasionType: "NONE",
    occasionFor: "",
    occasionPersonName: "",
    occasionRelationship: "",
    occasionNotes: "",
    telecallerName: "",
    internalNotes: "",
  };
}

const STEPS = [
  { id: 1, label: "Donor", icon: UserIcon },
  { id: 2, label: "Meal", icon: UtensilsCrossed },
  { id: 3, label: "Payment", icon: Wallet },
  { id: 4, label: "Occasion", icon: Heart },
  { id: 5, label: "Review", icon: ClipboardCheck },
] as const;

export default function MobileNewMealBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [donorResults, setDonorResults] = useState<SelectedDonor[]>([]);
  const [donorLoading, setDonorLoading] = useState(false);
  const [showDonorDropdown, setShowDonorDropdown] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isHomeInchargeBlocked = userRole === "HOME_INCHARGE";

  // ── Smart defaults from logged-in user ────────────────────────────
  useEffect(() => {
    const user = authStorage.getUser();
    if (!user) return;
    setUserRole(user.role);
    setForm((prev) => {
      const next: FormState = { ...prev };
      if (!next.telecallerName && user.name) next.telecallerName = user.name;
      if (user.assignedHome && HOME_VALUES.includes(user.assignedHome as any)) {
        next.slotHomes = {
          breakfast: [user.assignedHome],
          lunch: [user.assignedHome],
          eveningSnacks: [user.assignedHome],
          dinner: [user.assignedHome],
        };
      }
      return next;
    });
  }, []);

  // ── Prefill donor from query string ───────────────────────────────
  useEffect(() => {
    const id = searchParams.get("prefillDonorId");
    const name = searchParams.get("prefillDonorName") || "";
    if (!id) return;
    const [firstName, ...rest] = name.split(" ");
    setForm((prev) => ({
      ...prev,
      selectedDonor: {
        id,
        firstName: firstName || "Donor",
        lastName: rest.join(" "),
        donorCode: "",
      },
    }));
  }, [searchParams]);

  // ── Donor search (debounced) ───────────────────────────────────────
  const searchDonors = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setDonorResults([]);
      return;
    }
    setDonorLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/donors?search=${encodeURIComponent(q)}&limit=10`,
      );
      const data = await res.json();
      setDonorResults(data.data ?? data.donors ?? data.items ?? []);
    } catch {
      setDonorResults([]);
    } finally {
      setDonorLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (form.donorSearch && !form.selectedDonor) searchDonors(form.donorSearch);
    }, 300);
    return () => clearTimeout(t);
  }, [form.donorSearch, form.selectedDonor, searchDonors]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSlotHome(slot: string, home: string) {
    setForm((prev) => {
      const cur = prev.slotHomes[slot] ?? [];
      const next = cur.includes(home) ? cur.filter((h) => h !== home) : [...cur, home];
      return { ...prev, slotHomes: { ...prev.slotHomes, [slot]: next } };
    });
  }

  // ── Derived ────────────────────────────────────────────────────────
  const totalNum = parseFloat(form.totalAmount) || 0;
  const receivedNum = parseFloat(form.amountReceived) || 0;
  const balanceNum = Math.max(0, totalNum - receivedNum);
  const activeSlots = SLOT_KEYS.filter((s) => form[s]);

  // ── Mutation: reuses existing POST /api/meals ─────────────────────
  const createMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetchWithAuth("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || "Failed to create meal booking");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Meal booking saved",
        description: "Linked donation created. WhatsApp will be sent shortly.",
      });
      router.push("/dashboard/meals");
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Step validation ────────────────────────────────────────────────
  function validateStep(s: number): string | null {
    if (s === 1 && !form.selectedDonor) return "Please select a donor.";
    if (s === 2) {
      if (activeSlots.length === 0) return "Select at least one meal slot.";
      for (const slot of activeSlots) {
        if ((form.slotHomes[slot] ?? []).length === 0) {
          return `Select at least one home for ${SLOT_LABELS[slot]}.`;
        }
      }
      if (!form.mealServiceDate) return "Meal service date is required.";
    }
    if (s === 3) {
      if (!form.totalAmount || totalNum <= 0) return "Enter a valid total amount.";
      if (receivedNum > totalNum) return "Amount received cannot exceed total.";
      if (!form.donationReceivedDate) return "Donation received date is required.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      toast({ title: "Check this step", description: err, variant: "destructive" });
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  function handleSubmit() {
    for (let s = 1; s <= 4; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        toast({ title: "Check this step", description: err, variant: "destructive" });
        return;
      }
    }
    if (!form.selectedDonor) return;

    const derivedHomes = Array.from(
      new Set(activeSlots.flatMap((s) => form.slotHomes[s] ?? [])),
    );
    const slotHomesPayload: Record<string, string[]> = {};
    for (const s of activeSlots) slotHomesPayload[s] = form.slotHomes[s] ?? [];

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
      amount: totalNum,
      totalAmount: totalNum,
      amountReceived: receivedNum,
      paymentStatus: form.paymentStatus || "FULL",
      paymentType: form.paymentType || undefined,
      transactionId: form.transactionId || undefined,
      specialMenuItem: form.specialMenuItem || undefined,
      telecallerName: form.telecallerName || undefined,
      bookingStatus: form.bookingStatus || "CONFIRMED",
      donorVisitExpected: form.donorVisitExpected,
      occasionType: form.occasionType || "NONE",
      occasionFor: form.occasionFor || undefined,
      occasionPersonName: form.occasionPersonName || undefined,
      // Match desktop semantics: relationship is only meaningful when the
      // occasion is for someone OTHER than the donor.
      occasionRelationship:
        form.occasionFor === "OTHER" && form.occasionRelationship
          ? form.occasionRelationship
          : undefined,
      occasionNotes: form.occasionNotes || undefined,
      internalNotes: form.internalNotes || undefined,
    });
  }

  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/meals")}
            data-testid="button-back-to-meals"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">New Meal Booking</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-4 pb-3 gap-1">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const active = s.id === step;
            const done = s.id < step;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`flex flex-col items-center gap-1 min-w-0 flex-1 ${
                    active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"
                  }`}
                  data-testid={`step-indicator-${s.id}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                      active
                        ? "border-primary bg-primary/10"
                        : done
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-muted bg-muted"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-center">
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 ${
                      done ? "bg-green-600" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-5 space-y-5 max-w-xl mx-auto">
        {isHomeInchargeBlocked && (
          <div
            className="rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 p-3 text-sm text-blue-900 dark:text-blue-100"
            data-testid="banner-home-incharge-locked"
          >
            You are signed in as Home In-charge. Bookings created here are locked to your assigned
            home and cannot be changed.
          </div>
        )}
        {step === 1 && (
          <Step1Donor
            form={form}
            setField={setField}
            donorResults={donorResults}
            donorLoading={donorLoading}
            showDonorDropdown={showDonorDropdown}
            setShowDonorDropdown={setShowDonorDropdown}
            onPickDonor={(d) => {
              setForm((p) => ({ ...p, selectedDonor: d, donorSearch: "" }));
              setDonorResults([]);
              setShowDonorDropdown(false);
            }}
            onClearDonor={() => setForm((p) => ({ ...p, selectedDonor: null }))}
          />
        )}
        {step === 2 && (
          <Step2Meal
            form={form}
            setField={setField}
            toggleSlotHome={toggleSlotHome}
            lockedHome={isHomeInchargeBlocked ? (authStorage.getUser()?.assignedHome ?? null) : null}
          />
        )}
        {step === 3 && (
          <Step3Payment
            form={form}
            setField={setField}
            balance={balanceNum}
          />
        )}
        {step === 4 && <Step4Occasion form={form} setField={setField} />}
        {step === 5 && (
          <Step5Review
            form={form}
            balance={balanceNum}
            activeSlots={activeSlots as unknown as string[]}
          />
        )}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t p-3">
        <div className="max-w-xl mx-auto flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={goBack}
              data-testid="button-step-back"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back
            </Button>
          )}
          {step < STEPS.length ? (
            <Button
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={goNext}
              data-testid="button-step-next"
            >
              Next
              <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-save-meal-booking"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Check className="h-5 w-5 mr-1" />
              )}
              Save Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Donor ──────────────────────────────────────────────────────────
function Step1Donor({
  form,
  setField,
  donorResults,
  donorLoading,
  showDonorDropdown,
  setShowDonorDropdown,
  onPickDonor,
  onClearDonor,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  donorResults: SelectedDonor[];
  donorLoading: boolean;
  showDonorDropdown: boolean;
  setShowDonorDropdown: (v: boolean) => void;
  onPickDonor: (d: SelectedDonor) => void;
  onClearDonor: () => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Who is this booking for?</h2>

      {form.selectedDonor ? (
        <div
          className="border rounded-lg p-4 bg-muted/30 flex items-start justify-between gap-3"
          data-testid="card-selected-donor"
        >
          <div className="min-w-0">
            <div className="font-semibold truncate">
              {form.selectedDonor.firstName} {form.selectedDonor.lastName ?? ""}
            </div>
            <div className="text-sm text-muted-foreground">
              {form.selectedDonor.donorCode || ""}
              {form.selectedDonor.phone ? ` • ${form.selectedDonor.phone}` : ""}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearDonor}
            data-testid="button-clear-donor"
          >
            Change
          </Button>
        </div>
      ) : (
        <div className="space-y-2 relative">
          <Label htmlFor="donor-search" className="text-sm">
            Search donor by name, phone or donor code
          </Label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="donor-search"
              className="h-12 text-base pl-10"
              placeholder="e.g. Ravi or 9876543210"
              value={form.donorSearch}
              onChange={(e) => {
                setField("donorSearch", e.target.value);
                setShowDonorDropdown(true);
              }}
              onFocus={() => setShowDonorDropdown(true)}
              data-testid="input-donor-search"
            />
          </div>
          {showDonorDropdown && (donorLoading || donorResults.length > 0) && (
            <div className="border rounded-lg bg-card max-h-72 overflow-auto divide-y">
              {donorLoading && (
                <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              )}
              {!donorLoading &&
                donorResults.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onPickDonor(d)}
                    className="w-full text-left px-4 py-3 hover:bg-muted active:bg-muted/80"
                    data-testid={`button-pick-donor-${d.id}`}
                  >
                    <div className="font-medium">
                      {d.firstName} {d.lastName ?? ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.donorCode || ""}
                      {(d as any).primaryPhone ? ` • ${(d as any).primaryPhone}` : ""}
                    </div>
                  </button>
                ))}
              {!donorLoading && donorResults.length === 0 && form.donorSearch.length >= 2 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No donors found.
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Need a brand-new donor? Use the desktop Meal Sponsorship form's "Quick add donor" — that
            entry point will be added here in Phase 2.
          </p>
        </div>
      )}
    </section>
  );
}

// ─── Step 2: Meal ───────────────────────────────────────────────────────────
function Step2Meal({
  form,
  setField,
  toggleSlotHome,
  lockedHome,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleSlotHome: (slot: string, home: string) => void;
  lockedHome: string | null;
}) {
  return (
    <section className="space-y-5">
      <h2 className="text-base font-semibold">Meal details</h2>

      <div className="space-y-2">
        <Label htmlFor="meal-date" className="text-sm">Meal service date</Label>
        <Input
          id="meal-date"
          type="date"
          className="h-12 text-base"
          value={form.mealServiceDate}
          onChange={(e) => setField("mealServiceDate", e.target.value)}
          data-testid="input-meal-service-date"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Sponsorship type</Label>
        <Select
          value={form.sponsorshipType}
          onValueChange={(v) =>
            setField("sponsorshipType", v as FormState["sponsorshipType"])
          }
        >
          <SelectTrigger className="h-12 text-base" data-testid="select-sponsorship-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ENTIRE_DAY">Entire day</SelectItem>
            <SelectItem value="SELECTED_MEALS">Selected meals only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm">Meal slots and homes</Label>
        {SLOT_KEYS.map((slot) => {
          const enabled = form[slot] as boolean;
          return (
            <div
              key={slot}
              className={`border rounded-lg p-3 ${
                enabled ? "bg-card" : "bg-muted/30 opacity-70"
              }`}
              data-testid={`section-slot-${slot}`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={enabled}
                  onCheckedChange={(v) => setField(slot, !!v as any)}
                  className="h-5 w-5"
                  data-testid={`checkbox-slot-${slot}`}
                />
                <span className="text-base font-medium">{SLOT_LABELS[slot]}</span>
              </label>
              {enabled && lockedHome && (
                <div
                  className="mt-3 px-3 py-2 rounded border bg-muted/40 text-sm flex items-center justify-between"
                  data-testid={`locked-home-${slot}`}
                >
                  <span>
                    Home: <span className="font-medium">{HOME_LABELS[lockedHome] ?? lockedHome}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Locked</span>
                </div>
              )}
              {enabled && !lockedHome && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {HOME_VALUES.map((h) => {
                    const checked = (form.slotHomes[slot] ?? []).includes(h);
                    return (
                      <label
                        key={h}
                        className="flex items-center gap-3 px-3 py-2 rounded border cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleSlotHome(slot, h)}
                          className="h-5 w-5"
                          data-testid={`checkbox-${slot}-home-${h}`}
                        />
                        <span className="text-sm">{HOME_LABELS[h]}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Food type</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["VEG", "NON_VEG"] as const).map((ft) => (
            <Button
              key={ft}
              type="button"
              variant={form.foodType === ft ? "default" : "outline"}
              className="h-12 text-base"
              onClick={() => setField("foodType", ft)}
              data-testid={`button-food-${ft}`}
            >
              {ft === "VEG" ? "Veg" : "Non-Veg"}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="special-menu" className="text-sm">Special menu / item (optional)</Label>
        <Input
          id="special-menu"
          className="h-12 text-base"
          placeholder="e.g. Sweet on birthday"
          value={form.specialMenuItem}
          onChange={(e) => setField("specialMenuItem", e.target.value)}
          data-testid="input-special-menu"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meal-notes" className="text-sm">Meal notes (optional)</Label>
        <Textarea
          id="meal-notes"
          rows={3}
          className="text-base"
          value={form.mealNotes}
          onChange={(e) => setField("mealNotes", e.target.value)}
          data-testid="textarea-meal-notes"
        />
      </div>
    </section>
  );
}

// ─── Step 3: Payment ────────────────────────────────────────────────────────
function Step3Payment({
  form,
  setField,
  balance,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  balance: number;
}) {
  function handleAmountReceivedChange(val: string) {
    setField("amountReceived", val as any);
    const received = parseFloat(val) || 0;
    const total = parseFloat(form.totalAmount) || 0;
    if (received <= 0) setField("paymentStatus", "AFTER_SERVICE" as any);
    else if (received >= total && total > 0) setField("paymentStatus", "FULL" as any);
    else setField("paymentStatus", "PARTIAL" as any);
  }

  return (
    <section className="space-y-5">
      <h2 className="text-base font-semibold">Payment details</h2>

      <div className="space-y-2">
        <Label className="text-sm">Booking status</Label>
        <Select
          value={form.bookingStatus}
          onValueChange={(v) => {
            if (v === "HOLD") {
              setField("bookingStatus", "HOLD");
              setField("paymentStatus", "NOT_YET" as any);
              setField("amountReceived", "0");
            } else {
              setField("bookingStatus", v as FormState["bookingStatus"]);
            }
          }}
        >
          <SelectTrigger className="h-12 text-base" data-testid="select-booking-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="TENTATIVE">Tentative</SelectItem>
            <SelectItem value="HOLD">Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between border rounded-lg p-3">
        <Label htmlFor="visit-expected" className="text-sm font-medium m-0">
          Donor visit expected
        </Label>
        <Checkbox
          id="visit-expected"
          checked={form.donorVisitExpected}
          onCheckedChange={(v) => setField("donorVisitExpected", !!v)}
          className="h-5 w-5"
          data-testid="checkbox-donor-visit-expected"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recv-date" className="text-sm">Donation received date</Label>
        <Input
          id="recv-date"
          type="date"
          className="h-12 text-base"
          value={form.donationReceivedDate}
          onChange={(e) => setField("donationReceivedDate", e.target.value)}
          data-testid="input-donation-received-date"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total-amt" className="text-sm">Total amount (₹)</Label>
        <Input
          id="total-amt"
          type="number"
          inputMode="decimal"
          className="h-12 text-base"
          placeholder="0"
          value={form.totalAmount}
          onChange={(e) => setField("totalAmount", e.target.value)}
          data-testid="input-total-amount"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recv-amt" className="text-sm">Amount received (₹)</Label>
        <Input
          id="recv-amt"
          type="number"
          inputMode="decimal"
          className="h-12 text-base"
          value={form.amountReceived}
          onChange={(e) => handleAmountReceivedChange(e.target.value)}
          data-testid="input-amount-received"
        />
      </div>

      <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between">
        <span className="text-sm">Balance</span>
        <span
          className={`text-base font-semibold ${
            balance > 0 ? "text-amber-600" : "text-green-600"
          }`}
          data-testid="text-balance-amount"
        >
          ₹{balance.toLocaleString("en-IN")}
        </span>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Payment mode</Label>
        <Select
          value={form.paymentType}
          onValueChange={(v) => setField("paymentType", v as FormState["paymentType"])}
        >
          <SelectTrigger className="h-12 text-base" data-testid="select-payment-mode">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="ONLINE">Online (UPI / Card)</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            <SelectItem value="CHEQUE">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="txn-id" className="text-sm">Transaction reference (optional)</Label>
        <Input
          id="txn-id"
          className="h-12 text-base"
          placeholder="UTR / Cheque no."
          value={form.transactionId}
          onChange={(e) => setField("transactionId", e.target.value)}
          data-testid="input-transaction-id"
        />
      </div>
    </section>
  );
}

// ─── Step 4: Occasion ───────────────────────────────────────────────────────
function Step4Occasion({
  form,
  setField,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const showDetails = form.occasionType && form.occasionType !== "NONE";
  return (
    <section className="space-y-5">
      <h2 className="text-base font-semibold">Occasion (optional)</h2>
      <p className="text-xs text-muted-foreground -mt-2">
        Add a person and relationship — it will sync automatically to People &amp; Occasions.
      </p>

      <div className="space-y-2">
        <Label className="text-sm">Occasion type</Label>
        <Select
          value={form.occasionType}
          onValueChange={(v) => setField("occasionType", v)}
        >
          <SelectTrigger className="h-12 text-base" data-testid="select-occasion-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OCCASION_TYPES.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showDetails && (
        <>
          <div className="space-y-2">
            <Label className="text-sm">This occasion is for</Label>
            <Select
              value={form.occasionFor || ""}
              onValueChange={(v) => {
                setField("occasionFor", v as FormState["occasionFor"]);
                if (v !== "OTHER") setField("occasionRelationship", "");
              }}
            >
              <SelectTrigger className="h-12 text-base" data-testid="select-occasion-for">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {OCCASION_FOR_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="person-name" className="text-sm">Person name</Label>
            <Input
              id="person-name"
              className="h-12 text-base"
              value={form.occasionPersonName}
              onChange={(e) => setField("occasionPersonName", e.target.value)}
              data-testid="input-occasion-person-name"
            />
          </div>

          {form.occasionFor === "OTHER" && (
            <div className="space-y-2">
              <Label className="text-sm">Relationship</Label>
              <Select
                value={form.occasionRelationship}
                onValueChange={(v) => setField("occasionRelationship", v)}
              >
                <SelectTrigger className="h-12 text-base" data-testid="select-occasion-relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="occasion-notes" className="text-sm">Occasion notes (optional)</Label>
            <Textarea
              id="occasion-notes"
              rows={3}
              className="text-base"
              value={form.occasionNotes}
              onChange={(e) => setField("occasionNotes", e.target.value)}
              data-testid="textarea-occasion-notes"
            />
          </div>
        </>
      )}

      <div className="space-y-2 pt-2 border-t">
        <Label htmlFor="internal-notes" className="text-sm">Internal notes (staff-only, optional)</Label>
        <Textarea
          id="internal-notes"
          rows={3}
          className="text-base"
          value={form.internalNotes}
          onChange={(e) => setField("internalNotes", e.target.value)}
          data-testid="textarea-internal-notes"
        />
      </div>
    </section>
  );
}

// ─── Step 5: Review ─────────────────────────────────────────────────────────
function Step5Review({
  form,
  balance,
  activeSlots,
}: {
  form: FormState;
  balance: number;
  activeSlots: string[];
}) {
  const total = parseFloat(form.totalAmount) || 0;
  const received = parseFloat(form.amountReceived) || 0;
  const allHomes = useMemo(() => {
    const set = new Set<string>();
    activeSlots.forEach((s) => (form.slotHomes[s] ?? []).forEach((h) => set.add(h)));
    return Array.from(set);
  }, [form.slotHomes, activeSlots]);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold">Review &amp; save</h2>

      <ReviewBlock title="Donor">
        <ReviewRow
          label="Name"
          value={
            form.selectedDonor
              ? `${form.selectedDonor.firstName} ${form.selectedDonor.lastName ?? ""}`.trim()
              : "—"
          }
        />
        {form.selectedDonor?.donorCode && (
          <ReviewRow label="Donor code" value={form.selectedDonor.donorCode} />
        )}
      </ReviewBlock>

      <ReviewBlock title="Meal">
        <ReviewRow label="Service date" value={form.mealServiceDate} />
        <ReviewRow
          label="Sponsorship"
          value={form.sponsorshipType === "ENTIRE_DAY" ? "Entire day" : "Selected meals"}
        />
        <ReviewRow
          label="Slots"
          value={
            <div className="flex flex-wrap gap-1 justify-end">
              {activeSlots.map((s) => (
                <Badge key={s} variant="secondary">
                  {SLOT_LABELS[s]}
                </Badge>
              ))}
            </div>
          }
        />
        <ReviewRow
          label="Homes"
          value={
            <div className="flex flex-wrap gap-1 justify-end">
              {allHomes.map((h) => (
                <Badge key={h} variant="outline">
                  {HOME_LABELS[h]}
                </Badge>
              ))}
            </div>
          }
        />
        <ReviewRow label="Food type" value={form.foodType === "VEG" ? "Veg" : "Non-Veg"} />
        {form.specialMenuItem && (
          <ReviewRow label="Special item" value={form.specialMenuItem} />
        )}
      </ReviewBlock>

      <ReviewBlock title="Payment">
        <ReviewRow label="Booking status" value={form.bookingStatus} />
        <ReviewRow label="Received date" value={form.donationReceivedDate} />
        <ReviewRow label="Total" value={`₹${total.toLocaleString("en-IN")}`} />
        <ReviewRow label="Received" value={`₹${received.toLocaleString("en-IN")}`} />
        <ReviewRow
          label="Balance"
          value={
            <span className={balance > 0 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}>
              ₹{balance.toLocaleString("en-IN")}
            </span>
          }
        />
        {form.paymentType && <ReviewRow label="Mode" value={form.paymentType} />}
        {form.transactionId && <ReviewRow label="Reference" value={form.transactionId} />}
      </ReviewBlock>

      {form.occasionType !== "NONE" && (
        <ReviewBlock title="Occasion">
          <ReviewRow label="Type" value={form.occasionType} />
          {form.occasionPersonName && (
            <ReviewRow label="Person" value={form.occasionPersonName} />
          )}
          {form.occasionRelationship && (
            <ReviewRow label="Relationship" value={form.occasionRelationship} />
          )}
        </ReviewBlock>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Saving will create a meal sponsorship, link a donation record, sync People &amp; Occasions
        and send a WhatsApp confirmation to the donor.
      </p>
    </section>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/40 px-3 py-2 text-sm font-semibold">{title}</div>
      <div className="divide-y">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-3 py-2 flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  );
}
