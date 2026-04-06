"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, subDays, addDays, isToday, isBefore, startOfDay } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ClipboardList,
  CheckCircle2,
  Plus,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import { type PostMealMeal } from "./PostMealModal";
import { cn } from "@/lib/utils";
import { useMealsLang } from "./useMealsLang";
import {
  HOME_LANG,
  SLOT_LANG,
  BOOKING_STATUS_LANG,
  PAYMENT_STATUS_LANG,
  DONOR_VISIT_LANG,
  type MealsLang,
} from "./mealsLang";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListMealRecord {
  id: string;
  mealServiceDate: string;
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  homes: string[];
  slotHomes?: Record<string, string[]> | null;
  foodType: string;
  donor: { id: string; firstName: string; lastName: string; donorCode: string };
  totalAmount?: string | null;
  amount: string;
  amountReceived?: string;
  postMealAmountReceived?: string | null;
  paymentStatus?: string;
  paymentType?: string;
  bookingStatus?: string;
  telecallerName?: string;
  donorVisitExpected?: boolean;
  mealCompleted?: boolean | null;
  mealCancelled?: boolean | null;
  donorVisited?: boolean | null;
  promiseMade?: boolean | null;
  extraItemsGiven?: boolean | null;
  balancePaidAfterMeal?: boolean | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_KEYS = ["breakfast", "lunch", "eveningSnacks", "dinner"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSlots(r: ListMealRecord, lang: MealsLang): string[] {
  return SLOT_KEYS.filter((s) => r[s]).map((s) => SLOT_LANG[lang][s] ?? s);
}

function getHomes(r: ListMealRecord, lang: MealsLang): string[] {
  const sh = r.slotHomes as Record<string, string[]> | null | undefined;
  if (sh && Object.keys(sh).length > 0) {
    return [...new Set(Object.values(sh).flat())].map((h) => HOME_LANG[lang][h] ?? h);
  }
  return (r.homes ?? []).map((h) => HOME_LANG[lang][h] ?? h);
}

function bookingBadgeCls(status?: string) {
  switch (status) {
    case "HOLD":       return "bg-yellow-100 text-yellow-800 border border-yellow-300 border-dashed";
    case "CANCELLED":  return "bg-red-100 text-red-800";
    case "COMPLETED":  return "bg-blue-100 text-blue-800";
    default:           return "bg-green-100 text-green-800";
  }
}

function bookingBadgeLabel(status: string | undefined, lang: MealsLang) {
  switch (status) {
    case "HOLD":      return `⏸ ${BOOKING_STATUS_LANG[lang].HOLD}`;
    case "CANCELLED": return `❌ ${BOOKING_STATUS_LANG[lang].CANCELLED}`;
    case "COMPLETED": return `✅ ${BOOKING_STATUS_LANG[lang].COMPLETED}`;
    default:          return `✓ ${BOOKING_STATUS_LANG[lang].CONFIRMED}`;
  }
}

function paymentBadgeCls(status?: string) {
  switch (status) {
    case "FULL":          return "bg-green-100 text-green-800";
    case "PARTIAL":       return "bg-yellow-100 text-yellow-800";
    case "ADVANCE":       return "bg-blue-100 text-blue-800";
    case "AFTER_SERVICE": return "bg-orange-100 text-orange-800";
    case "NOT_YET":       return "bg-slate-100 text-slate-600";
    default:              return "bg-muted text-muted-foreground";
  }
}

function toPostMealMeal(r: ListMealRecord): PostMealMeal {
  return {
    id: r.id,
    totalAmount: r.totalAmount,
    amountReceived: r.amountReceived,
    postMealAmountReceived: r.postMealAmountReceived,
    paymentType: r.paymentType,
    mealServiceDate: r.mealServiceDate,
    donor: r.donor,
    mealCompleted: r.mealCompleted,
    donorVisited: r.donorVisited,
    promiseMade: r.promiseMade,
    extraItemsGiven: r.extraItemsGiven,
    balancePaidAfterMeal: r.balancePaidAfterMeal,
    mealCancelled: r.mealCancelled,
  } as any;
}

// ─── Row Component ─────────────────────────────────────────────────────────────

function MealRow({
  record,
  lang,
  isHomeIncharge,
  onOpenPostMeal,
  onMarkCompleted,
  markingId,
}: {
  record: ListMealRecord;
  lang: MealsLang;
  isHomeIncharge: boolean;
  onOpenPostMeal: (meal: PostMealMeal) => void;
  onMarkCompleted: (id: string) => void;
  markingId: string | null;
}) {
  const slots = getSlots(record, lang);
  const homes = getHomes(record, lang);
  const dateStr = record.mealServiceDate.slice(0, 10);
  const isToday_ = isToday(new Date(dateStr + "T00:00:00"));
  const isPast = isBefore(new Date(dateStr + "T00:00:00"), startOfDay(new Date()));
  const total = Number(record.totalAmount ?? record.amount ?? 0);
  const rcvd = Number(record.amountReceived ?? 0) + Number(record.postMealAmountReceived ?? 0);
  const balance = Math.max(0, total - rcvd);
  const isHold = record.bookingStatus === "HOLD";
  const isCancelled = record.bookingStatus === "CANCELLED";
  const canPostMeal = (isPast || isToday_) && !record.mealCancelled && !isCancelled;
  const alreadyDone = !!record.mealCompleted;
  const isMarking = markingId === record.id;

  return (
    <div
      className={cn(
        "grid gap-x-3 gap-y-1.5 px-3 py-3 border-b last:border-0 transition-colors",
        "grid-cols-[auto_1fr_auto]",
        isToday_ && "bg-primary/5",
        (record.mealCancelled || isCancelled) && "opacity-50",
        alreadyDone && "bg-green-50/60 dark:bg-green-900/10",
      )}
      data-testid={`list-row-${record.id}`}
    >
      {/* Left: Date block */}
      <div className="flex flex-col items-center justify-start pt-0.5 w-10 shrink-0">
        <span className={cn(
          "text-[11px] font-bold uppercase leading-none",
          isToday_ ? "text-primary" : "text-muted-foreground",
        )}>
          {format(new Date(dateStr + "T00:00:00"), "MMM")}
        </span>
        <span className={cn(
          "text-xl font-bold leading-none",
          isToday_ ? "text-primary" : "text-foreground",
        )}>
          {format(new Date(dateStr + "T00:00:00"), "dd")}
        </span>
        <span className={cn(
          "text-[10px] uppercase leading-none",
          isToday_ ? "text-primary/70" : "text-muted-foreground",
        )}>
          {format(new Date(dateStr + "T00:00:00"), "EEE")}
        </span>
      </div>

      {/* Middle: info */}
      <div className="min-w-0 space-y-1">
        {/* Donor */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm leading-tight">
            {record.donor.firstName} {record.donor.lastName}
          </span>
          <span className="text-[10px] text-muted-foreground">{record.donor.donorCode}</span>
          {alreadyDone && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ Done</span>
          )}
        </div>

        {/* Slot + Home badges */}
        <div className="flex flex-wrap gap-1">
          {slots.map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 font-medium">
              {s}
            </span>
          ))}
          {!isHomeIncharge && homes.map((h) => (
            <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-medium">
              {h}
            </span>
          ))}
        </div>

        {/* Telecaller + visitor info */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
          {record.telecallerName ? (
            <span>📞 {record.telecallerName}</span>
          ) : (
            <span className="italic">No telecaller</span>
          )}
          {record.donorVisitExpected === false && (
            <span className="text-orange-600">{DONOR_VISIT_LANG[lang].photo}</span>
          )}
          {balance > 0 && !isHold && (
            <span className="text-orange-600 font-semibold">Bal: ₹{balance.toLocaleString("en-IN")}</span>
          )}
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${bookingBadgeCls(record.bookingStatus)}`}>
            {bookingBadgeLabel(record.bookingStatus, lang)}
          </span>
          {!isHold && record.paymentStatus && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${paymentBadgeCls(record.paymentStatus)}`}>
              {PAYMENT_STATUS_LANG[lang][record.paymentStatus] ?? record.paymentStatus.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-col gap-1.5 items-end justify-start shrink-0">
        {canPostMeal && (
          <button
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-colors border border-primary/30 whitespace-nowrap"
            onClick={() => onOpenPostMeal(toPostMealMeal(record))}
            data-testid={`listview-post-meal-${record.id}`}
          >
            <ClipboardList className="h-3 w-3" />
            Post-Meal
          </button>
        )}
        {canPostMeal && !alreadyDone && (
          <button
            disabled={isMarking}
            className={cn(
              "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors border whitespace-nowrap",
              "text-green-700 border-green-300 hover:bg-green-50",
              isMarking && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => onMarkCompleted(record.id)}
            data-testid={`listview-mark-done-${record.id}`}
          >
            {isMarking ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Mark Done
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, count, accent }: { label: string; count: number; accent?: string }) {
  return (
    <div className={cn(
      "sticky top-[57px] z-10 flex items-center gap-2 px-3 py-2 border-b text-xs font-bold uppercase tracking-wider",
      "bg-background/95 backdrop-blur-sm",
      accent ?? "text-muted-foreground",
    )}>
      <span>{label}</span>
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground normal-case tracking-normal">
        {count}
      </span>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center text-xs text-muted-foreground py-6 px-4 italic">
      {label}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

interface Props {
  isHomeIncharge: boolean;
  canCreate: boolean;
  onAddMeal: () => void;
  onOpenPostMeal: (meal: PostMealMeal) => void;
  compact?: boolean;
}

export function MealsListView({ isHomeIncharge, canCreate, onAddMeal, onOpenPostMeal, compact = false }: Props) {
  const [lang] = useMealsLang();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [markingId, setMarkingId] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const from = format(subDays(new Date(), 14), "yyyy-MM-dd");
  const to = format(addDays(new Date(), 45), "yyyy-MM-dd");

  const { data, isLoading, refetch, isFetching } = useQuery<{ items: ListMealRecord[] }>({
    queryKey: ["/api/meals/list-view", today],
    queryFn: async () => {
      const params = new URLSearchParams({ mealServiceDate: from, mealServiceDateTo: to, limit: "300" });
      const res = await fetchWithAuth(`/api/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
    staleTime: 30_000,
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/api/meals/${id}/post-meal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealCompleted: true }),
      });
      if (!res.ok) throw new Error("Failed to mark meal as completed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      toast({ title: "Marked as completed", description: "Meal has been marked as done." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not mark meal as completed.", variant: "destructive" });
    },
    onSettled: () => setMarkingId(null),
  });

  function handleMarkCompleted(id: string) {
    setMarkingId(id);
    markCompletedMutation.mutate(id);
  }

  const items = data?.items ?? [];

  const { todayItems, pendingItems, upcomingItems } = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayItems = items
      .filter((r) => r.mealServiceDate.slice(0, 10) === todayStr)
      .sort((a, b) => {
        const order = ["breakfast", "lunch", "eveningSnacks", "dinner"];
        return order.findIndex((s) => (a as any)[s]) - order.findIndex((s) => (b as any)[s]);
      });
    const pendingItems = items
      .filter((r) => {
        const d = r.mealServiceDate.slice(0, 10);
        return d < todayStr && !r.mealCompleted && !r.mealCancelled && r.bookingStatus !== "CANCELLED";
      })
      .sort((a, b) => b.mealServiceDate.localeCompare(a.mealServiceDate));
    const upcomingItems = items
      .filter((r) => r.mealServiceDate.slice(0, 10) > todayStr)
      .sort((a, b) => a.mealServiceDate.localeCompare(b.mealServiceDate));
    return { todayItems, pendingItems, upcomingItems };
  }, [items]);

  const labels =
    lang === "en"
      ? { today: "Today", pending: "Pending Post-Meal", upcoming: "Upcoming", empty: "Nothing here", noMeals: "No meals in this window" }
      : { today: "నేడు (Today)", pending: "పెండింగ్ (Pending)", upcoming: "రాబోయే (Upcoming)", empty: "ఏమీ లేదు", noMeals: "ఈ పరిధిలో భోజనాలు లేవు" };

  return (
    <div className={compact ? "flex flex-col" : "min-h-screen bg-background pb-24 flex flex-col"}>
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
        <UtensilsCrossed className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight">Meals Schedule</h1>
          <p className="text-xs text-muted-foreground leading-tight">{format(new Date(), "dd MMM yyyy (EEEE)")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="listview-refresh"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </button>
          {canCreate && (
            <Button size="sm" onClick={onAddMeal} data-testid="listview-add-btn" className="shrink-0">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <UtensilsCrossed className="h-8 w-8 opacity-30" />
          <p className="text-sm">{labels.noMeals}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* Pending alert banner */}
          {pendingItems.length > 0 && (
            <div className="mx-3 mt-3 mb-1 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-orange-600 shrink-0" />
              <span className="text-xs font-semibold text-orange-800">
                {pendingItems.length} meal{pendingItems.length > 1 ? "s" : ""} need{pendingItems.length === 1 ? "s" : ""} post-meal update
              </span>
            </div>
          )}

          {/* TODAY section */}
          {todayItems.length > 0 && (
            <div>
              <SectionHeader label={labels.today} count={todayItems.length} accent="text-primary" />
              {todayItems.map((r) => (
                <MealRow
                  key={r.id}
                  record={r}
                  lang={lang}
                  isHomeIncharge={isHomeIncharge}
                  onOpenPostMeal={onOpenPostMeal}
                  onMarkCompleted={handleMarkCompleted}
                  markingId={markingId}
                />
              ))}
            </div>
          )}

          {/* PENDING section */}
          {pendingItems.length > 0 && (
            <div>
              <SectionHeader label={labels.pending} count={pendingItems.length} accent="text-orange-600" />
              {pendingItems.map((r) => (
                <MealRow
                  key={r.id}
                  record={r}
                  lang={lang}
                  isHomeIncharge={isHomeIncharge}
                  onOpenPostMeal={onOpenPostMeal}
                  onMarkCompleted={handleMarkCompleted}
                  markingId={markingId}
                />
              ))}
            </div>
          )}

          {/* UPCOMING section */}
          {upcomingItems.length > 0 && (
            <div>
              <SectionHeader label={labels.upcoming} count={upcomingItems.length} accent="text-muted-foreground" />
              {upcomingItems.map((r) => (
                <MealRow
                  key={r.id}
                  record={r}
                  lang={lang}
                  isHomeIncharge={isHomeIncharge}
                  onOpenPostMeal={onOpenPostMeal}
                  onMarkCompleted={handleMarkCompleted}
                  markingId={markingId}
                />
              ))}
            </div>
          )}

          {todayItems.length === 0 && pendingItems.length === 0 && upcomingItems.length === 0 && (
            <EmptyState label={labels.empty} />
          )}
        </div>
      )}

      {/* FAB for mobile add */}
      {!compact && canCreate && (
        <div className="fixed bottom-6 right-4 z-30">
          <Button
            size="lg"
            onClick={onAddMeal}
            data-testid="listview-fab-add"
            className="rounded-full h-14 w-14 shadow-lg p-0"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
