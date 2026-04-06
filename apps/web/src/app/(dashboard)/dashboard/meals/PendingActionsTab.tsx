"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, isPast, startOfDay } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Loader2, AlertTriangle, Clock, Calendar, Phone, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { type PostMealMeal } from "./PostMealModal";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MealRecord {
  id: string;
  homes: string[];
  slotHomes?: Record<string, string[]> | null;
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  mealServiceDate: string;
  totalAmount?: string | null;
  amountReceived?: string;
  postMealAmountReceived?: string | null;
  paymentType?: string;
  telecallerName?: string;
  createdBy?: { name: string };
  bookingStatus?: string;
  donor: { id: string; firstName: string; lastName: string; donorCode: string; phone?: string | null };
  mealCompleted?: boolean | null;
  donorVisited?: boolean | null;
  donorVisitNotes?: string | null;
  balancePaidAfterMeal?: boolean | null;
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

export type ActionType =
  | "MEAL_COMPLETION_PENDING"
  | "DONOR_VISIT_PENDING"
  | "BALANCE_PENDING"
  | "PROMISE_FOLLOWUP_PENDING"
  | "THANK_YOU_PENDING"
  | "REVIEW_PENDING"
  | "ASK_HI_PENDING"
  | "EXTRA_ITEMS_NOT_RECORDED";

export type Bucket = "overdue" | "today" | "upcoming";

interface PendingAction {
  key: string;
  mealId: string;
  actionType: ActionType;
  bucket: Bucket;
  meal: MealRecord;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HOME_OPTIONS = [
  { value: "GIRLS_HOME", label: "బాలికల గృహం (Girls Home)" },
  { value: "BLIND_BOYS_HOME", label: "అంధ బాలుర గృహం (Blind Boys Home)" },
  { value: "OLD_AGE_HOME", label: "వృద్ధాశ్రమం (Old Age Home)" },
];

const ACTION_LABELS: Record<ActionType, string> = {
  MEAL_COMPLETION_PENDING: "Meal Not Marked Complete",
  DONOR_VISIT_PENDING: "Donor Visit Not Recorded",
  BALANCE_PENDING: "Balance Pending",
  PROMISE_FOLLOWUP_PENDING: "Promise Follow-up",
  THANK_YOU_PENDING: "Thank You Not Sent",
  REVIEW_PENDING: "Review Not Requested",
  ASK_HI_PENDING: "Ask to Send Hi Pending",
  EXTRA_ITEMS_NOT_RECORDED: "Extra Items Not Recorded",
};

const ACTION_COLORS: Record<ActionType, string> = {
  MEAL_COMPLETION_PENDING: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  DONOR_VISIT_PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  BALANCE_PENDING: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  PROMISE_FOLLOWUP_PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  THANK_YOU_PENDING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  REVIEW_PENDING: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100",
  ASK_HI_PENDING: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100",
  EXTRA_ITEMS_NOT_RECORDED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function homeLabel(val: string) {
  return HOME_OPTIONS.find((h) => h.value === val)?.label ?? val;
}

function slotList(m: MealRecord): string {
  const s: string[] = [];
  if (m.breakfast) s.push("అల్పాహారం");
  if (m.lunch) s.push("మధ్యాహ్న");
  if (m.eveningSnacks) s.push("సాయంత్రం");
  if (m.dinner) s.push("రాత్రి");
  return s.join(", ") || "—";
}

function effectiveBalance(m: MealRecord): number {
  const total = Number(m.totalAmount ?? m.amountReceived ?? 0);
  const received = Number(m.amountReceived ?? 0);
  const postMeal = Number(m.postMealAmountReceived ?? 0);
  const isLegacyFull = m.totalAmount == null && m.paymentType === "FULL" && received === 0;
  if (isLegacyFull) return 0;
  return Math.max(0, total - received - postMeal);
}

function getBucket(mealServiceDate: string): Bucket {
  const d = startOfDay(new Date(mealServiceDate));
  const todayStart = startOfDay(new Date());
  if (d < todayStart) return "overdue";
  if (d.getTime() === todayStart.getTime()) return "today";
  return "upcoming";
}

function isOnOrBeforeToday(mealServiceDate: string): boolean {
  const d = startOfDay(new Date(mealServiceDate));
  const todayStart = startOfDay(new Date());
  return d <= todayStart;
}

// ── Derivation Logic ──────────────────────────────────────────────────────────

function deriveActions(meals: MealRecord[]): PendingAction[] {
  const actions: PendingAction[] = [];

  for (const m of meals) {
    const pastOrToday = isOnOrBeforeToday(m.mealServiceDate);
    const bucket = getBucket(m.mealServiceDate);

    // 1. MEAL_COMPLETION_PENDING
    if (pastOrToday && !m.mealCompleted) {
      actions.push({ key: `${m.id}-MEAL_COMPLETION_PENDING`, mealId: m.id, actionType: "MEAL_COMPLETION_PENDING", bucket, meal: m });
    }

    // 2. DONOR_VISIT_PENDING
    if (pastOrToday && m.donorVisited == null && (m.mealCompleted === true || pastOrToday)) {
      actions.push({ key: `${m.id}-DONOR_VISIT_PENDING`, mealId: m.id, actionType: "DONOR_VISIT_PENDING", bucket, meal: m });
    }

    // 3. BALANCE_PENDING — any meal with balance
    if (effectiveBalance(m) > 0) {
      actions.push({ key: `${m.id}-BALANCE_PENDING`, mealId: m.id, actionType: "BALANCE_PENDING", bucket, meal: m });
    }

    // 4. PROMISE_FOLLOWUP_PENDING
    if (m.promiseMade === true && m.promiseNotes && m.promiseNotes.trim().length > 0) {
      actions.push({ key: `${m.id}-PROMISE_FOLLOWUP_PENDING`, mealId: m.id, actionType: "PROMISE_FOLLOWUP_PENDING", bucket, meal: m });
    }

    // 5. THANK_YOU_PENDING
    if (pastOrToday && !m.thankYouSent) {
      actions.push({ key: `${m.id}-THANK_YOU_PENDING`, mealId: m.id, actionType: "THANK_YOU_PENDING", bucket, meal: m });
    }

    // 6. REVIEW_PENDING
    if (pastOrToday && !m.reviewRequested) {
      actions.push({ key: `${m.id}-REVIEW_PENDING`, mealId: m.id, actionType: "REVIEW_PENDING", bucket, meal: m });
    }

    // 7. ASK_HI_PENDING
    if (pastOrToday && !m.askedToSendHi) {
      actions.push({ key: `${m.id}-ASK_HI_PENDING`, mealId: m.id, actionType: "ASK_HI_PENDING", bucket, meal: m });
    }

    // 8. EXTRA_ITEMS_NOT_RECORDED
    if (pastOrToday && m.extraItemsGiven == null) {
      actions.push({ key: `${m.id}-EXTRA_ITEMS_NOT_RECORDED`, mealId: m.id, actionType: "EXTRA_ITEMS_NOT_RECORDED", bucket, meal: m });
    }
  }

  return actions;
}

// ── Sub-component: Bucket Section ─────────────────────────────────────────────

function BucketSection({
  label,
  icon: Icon,
  color,
  actions,
  onOpenPostMeal,
}: {
  label: string;
  icon: any;
  color: string;
  actions: PendingAction[];
  onOpenPostMeal: (meal: PostMealMeal) => void;
}) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="font-semibold text-sm">{label}</span>
        <Badge variant="secondary" className="ml-auto text-xs">{actions.length}</Badge>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Meal Date</TableHead>
              <TableHead className="text-xs">Donor</TableHead>
              <TableHead className="text-xs">Homes</TableHead>
              <TableHead className="text-xs">Slots</TableHead>
              <TableHead className="text-xs">Action</TableHead>
              <TableHead className="text-xs">కాల్ బాధ్యుడు (Telecaller)</TableHead>
              <TableHead className="text-xs">Quick Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((a) => {
              const m = a.meal;
              const homes = m.slotHomes
                ? [...new Set(Object.values(m.slotHomes as Record<string, string[]>).flat())]
                : m.homes;
              return (
                <TableRow key={a.key} data-testid={`row-pending-action-${a.key}`}>
                  <TableCell className="text-xs font-medium whitespace-nowrap">
                    {format(new Date(m.mealServiceDate), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Link
                      href={`/dashboard/donors/${m.donor.id}`}
                      className="font-medium text-primary hover:underline"
                      data-testid={`link-donor-${m.donor.id}`}
                    >
                      {m.donor.firstName} {m.donor.lastName}
                    </Link>
                    <div className="text-muted-foreground">{m.donor.donorCode}</div>
                    {a.actionType === "BALANCE_PENDING" && (
                      <div className="text-orange-600 dark:text-orange-400 font-medium">
                        Bal: ₹{effectiveBalance(m).toLocaleString("en-IN")}
                      </div>
                    )}
                    {a.actionType === "PROMISE_FOLLOWUP_PENDING" && m.promiseNotes && (
                      <div className="text-yellow-700 dark:text-yellow-300 text-xs mt-0.5 max-w-[200px] truncate" title={m.promiseNotes}>
                        {m.promiseNotes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-wrap gap-1">
                      {homes.map((h) => (
                        <Badge key={h} variant="outline" className="text-xs px-1 py-0">{homeLabel(h)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{slotList(m)}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${ACTION_COLORS[a.actionType]}`}>
                      {ACTION_LABELS[a.actionType]}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.telecallerName || m.createdBy?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2 whitespace-nowrap"
                      data-testid={`button-open-post-meal-${a.key}`}
                      onClick={() => onOpenPostMeal(m as PostMealMeal)}
                    >
                      Open Post-Meal
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── HOLD Follow-up Section ────────────────────────────────────────────────────

interface HoldRecord {
  id: string;
  mealServiceDate: string;
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  homes: string[];
  slotHomes?: Record<string, string[]> | null;
  telecallerName?: string;
  createdBy?: { name: string };
  bookingStatus?: string;
  donor: { id: string; firstName: string; lastName: string; donorCode: string; primaryPhone?: string | null };
}

function HoldFollowUpSection({ onStatusChange }: { onStatusChange: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery<{ items: HoldRecord[] }>({
    queryKey: ["/api/meals/hold-followup"],
    queryFn: async () => {
      const params = new URLSearchParams({ bookingStatus: "HOLD", limit: "200", orderBy: "mealServiceDate" });
      const res = await fetchWithAuth(`/api/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch HOLD bookings");
      return res.json();
    },
    staleTime: 30_000,
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/api/meals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus: "CONFIRMED" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to confirm booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals/hold-followup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals/matrix"] });
      toast({ title: "Booking confirmed", description: "HOLD booking has been confirmed." });
      onStatusChange();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message ?? "Could not confirm booking.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/api/meals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingStatus: "CANCELLED" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to cancel booking");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals/hold-followup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals/matrix"] });
      toast({ title: "Booking cancelled", description: "HOLD booking has been cancelled.", variant: "destructive" });
      onStatusChange();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message ?? "Could not cancel booking.", variant: "destructive" });
    },
  });

  const holds = data?.items ?? [];
  const pending = confirmMutation.isPending || cancelMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-lg text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading HOLD bookings…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-yellow-800 dark:text-yellow-300">⏸ HOLD Follow-up</span>
          {holds.length > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 border-dashed text-xs">
              {holds.length}
            </Badge>
          )}
        </div>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => refetch()}
          disabled={isFetching}
          data-testid="hold-refresh"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {holds.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-3 border rounded-lg border-dashed border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10 text-sm text-yellow-700 dark:text-yellow-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>No HOLD bookings pending follow-up.</span>
        </div>
      ) : (
        <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-yellow-50 dark:bg-yellow-900/20">
                <TableHead className="text-xs">Meal Date</TableHead>
                <TableHead className="text-xs">Donor</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Homes</TableHead>
                <TableHead className="text-xs">Slots</TableHead>
                <TableHead className="text-xs">Telecaller</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holds.map((h) => {
                const homes = h.slotHomes
                  ? [...new Set(Object.values(h.slotHomes as Record<string, string[]>).flat())]
                  : h.homes;
                const slots: string[] = [];
                if (h.breakfast) slots.push("Breakfast");
                if (h.lunch) slots.push("Lunch");
                if (h.eveningSnacks) slots.push("Evening");
                if (h.dinner) slots.push("Dinner");
                const isConfirming = confirmMutation.isPending && confirmMutation.variables === h.id;
                const isCancelling = cancelMutation.isPending && cancelMutation.variables === h.id;

                return (
                  <TableRow key={h.id} data-testid={`hold-row-${h.id}`}>
                    <TableCell className="text-xs font-medium whitespace-nowrap">
                      {format(new Date(h.mealServiceDate.slice(0, 10) + "T00:00:00"), "dd MMM yyyy")}
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(h.mealServiceDate.slice(0, 10) + "T00:00:00"), "EEEE")}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Link
                        href={`/dashboard/donors/${h.donor.id}`}
                        className="font-medium text-primary hover:underline"
                        data-testid={`hold-donor-link-${h.id}`}
                      >
                        {h.donor.firstName} {h.donor.lastName}
                      </Link>
                      <div className="text-muted-foreground">{h.donor.donorCode}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {h.donor.primaryPhone ? (
                        <a
                          href={`tel:${h.donor.primaryPhone}`}
                          className="flex items-center gap-1 text-green-700 dark:text-green-400 hover:text-green-800 font-medium whitespace-nowrap"
                          data-testid={`hold-call-${h.id}`}
                        >
                          <Phone className="h-3 w-3" />
                          {h.donor.primaryPhone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground italic">No phone</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-wrap gap-1">
                        {homes.map((hm) => (
                          <Badge key={hm} variant="outline" className="text-xs px-1 py-0">
                            {homeLabel(hm)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {slots.join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {h.telecallerName || h.createdBy?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20 whitespace-nowrap"
                          onClick={() => confirmMutation.mutate(h.id)}
                          data-testid={`hold-confirm-${h.id}`}
                        >
                          {isConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          className="h-7 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 whitespace-nowrap"
                          onClick={() => cancelMutation.mutate(h.id)}
                          data-testid={`hold-cancel-${h.id}`}
                        >
                          {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  onOpenPostMeal: (meal: PostMealMeal) => void;
}

export function PendingActionsTab({ onOpenPostMeal }: Props) {
  const queryClient = useQueryClient();
  const [filterActionType, setFilterActionType] = useState<string>("all");
  const [filterHome, setFilterHome] = useState<string>("all");
  const [filterTelecaller, setFilterTelecaller] = useState<string>("all");

  const { data, isLoading, error } = useQuery<{ items: MealRecord[] }>({
    queryKey: ["/api/meals/pending-actions"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/meals/pending-actions");
      if (!res.ok) throw new Error("Failed to fetch pending actions");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const allActions = useMemo(() => {
    if (!data?.items) return [];
    return deriveActions(data.items);
  }, [data]);

  const telecallers = useMemo(() => {
    const seen = new Set<string>();
    for (const a of allActions) {
      const t = a.meal.telecallerName || a.meal.createdBy?.name;
      if (t) seen.add(t);
    }
    return [...seen].sort();
  }, [allActions]);

  const filtered = useMemo(() => {
    return allActions.filter((a) => {
      if (filterActionType !== "all" && a.actionType !== filterActionType) return false;
      if (filterHome !== "all") {
        const homes = a.meal.slotHomes
          ? [...new Set(Object.values(a.meal.slotHomes as Record<string, string[]>).flat())]
          : a.meal.homes;
        if (!homes.includes(filterHome)) return false;
      }
      if (filterTelecaller !== "all") {
        const t = a.meal.telecallerName || a.meal.createdBy?.name || "";
        if (t !== filterTelecaller) return false;
      }
      return true;
    });
  }, [allActions, filterActionType, filterHome, filterTelecaller]);

  const overdue = filtered.filter((a) => a.bucket === "overdue");
  const today = filtered.filter((a) => a.bucket === "today");
  const upcoming = filtered.filter((a) => a.bucket === "upcoming");

  const totalCount = filtered.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        Failed to load pending actions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── HOLD Follow-up ── */}
      <HoldFollowUpSection onStatusChange={() => {
        queryClient.invalidateQueries({ queryKey: ["/api/meals/pending-actions"] });
      }} />

      <div className="border-t" />

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-3 p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">Total pending:</span>
          <Badge variant="secondary">{totalCount}</Badge>
        </div>
        {overdue.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{overdue.length} overdue</span>
          </div>
        )}
        {today.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span>{today.length} today</span>
          </div>
        )}
        {upcoming.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
            <Calendar className="h-4 w-4" />
            <span>{upcoming.length} upcoming</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label className="text-xs">Action Type</Label>
          <Select value={filterActionType} onValueChange={setFilterActionType}>
            <SelectTrigger data-testid="filter-action-type">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {(Object.keys(ACTION_LABELS) as ActionType[]).map((k) => (
                <SelectItem key={k} value={k}>{ACTION_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Home</Label>
          <Select value={filterHome} onValueChange={setFilterHome}>
            <SelectTrigger data-testid="filter-home-pending">
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
          <Label className="text-xs">కాల్ బాధ్యుడు (Telecaller)</Label>
          <Select value={filterTelecaller} onValueChange={setFilterTelecaller}>
            <SelectTrigger data-testid="filter-telecaller-pending">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {telecallers.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            size="sm"
            data-testid="button-clear-pending-filters"
            onClick={() => {
              setFilterActionType("all");
              setFilterHome("all");
              setFilterTelecaller("all");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Buckets */}
      {totalCount === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-medium">No pending actions found.</p>
          <p className="text-sm mt-1">All follow-ups are up to date.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <BucketSection
            label="Overdue"
            icon={AlertTriangle}
            color="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
            actions={overdue}
            onOpenPostMeal={onOpenPostMeal}
          />
          <BucketSection
            label="Today"
            icon={Clock}
            color="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
            actions={today}
            onOpenPostMeal={onOpenPostMeal}
          />
          <BucketSection
            label="Upcoming"
            icon={Calendar}
            color="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
            actions={upcoming}
            onOpenPostMeal={onOpenPostMeal}
          />
        </div>
      )}
    </div>
  );
}
