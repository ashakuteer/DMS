"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, subDays, isToday, isBefore, startOfDay } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Loader2,
  UtensilsCrossed,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { type PostMealMeal } from "./PostMealModal";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MobileMealRecord {
  id: string;
  mealServiceDate: string;
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  homes: string[];
  slotHomes?: Record<string, string[]> | null;
  foodType: string;
  sponsorshipType: string;
  donor: { id: string; firstName: string; lastName: string; donorCode: string };
  totalAmount?: string | null;
  amount: string;
  amountReceived?: string;
  paymentStatus?: string;
  paymentType?: string;
  occasionType?: string;
  occasionPersonName?: string;
  telecallerName?: string;
  bookingStatus?: string;
  donorVisitExpected?: boolean;
  selectedMenuItems?: string[];
  mealCompleted?: boolean | null;
  donorVisited?: boolean | null;
  promiseMade?: boolean | null;
  extraItemsGiven?: boolean | null;
  balancePaidAfterMeal?: boolean | null;
  postMealAmountReceived?: string | null;
  mealCancelled?: boolean | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOME_LABELS: Record<string, string> = {
  GIRLS_HOME: "బాలికల గృహం (Girls)",
  BLIND_BOYS_HOME: "అంధ బాలుర గృహం (Blind Boys)",
  OLD_AGE_HOME: "వృద్ధాశ్రమం (Old Age)",
};

const SLOT_LABELS: Record<string, string> = {
  breakfast: "అల్పాహారం (Breakfast)",
  lunch: "మధ్యాహ్న భోజనం (Lunch)",
  eveningSnacks: "సాయంత్రం (Snacks)",
  dinner: "రాత్రి భోజనం (Dinner)",
};

const SLOT_KEYS = ["breakfast", "lunch", "eveningSnacks", "dinner"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMealSlots(r: MobileMealRecord): string[] {
  return SLOT_KEYS.filter((s) => r[s]).map((s) => SLOT_LABELS[s]);
}

function getMealHomes(r: MobileMealRecord): string[] {
  const sh = r.slotHomes as Record<string, string[]> | null | undefined;
  if (sh && Object.keys(sh).length > 0) {
    const allHomes = [...new Set(Object.values(sh).flat())];
    return allHomes.map((h) => HOME_LABELS[h] ?? h);
  }
  return (r.homes ?? []).map((h) => HOME_LABELS[h] ?? h);
}

function getPaymentColor(status?: string): string {
  switch (status) {
    case "FULL": return "bg-green-100 text-green-800";
    case "PARTIAL": return "bg-yellow-100 text-yellow-800";
    case "ADVANCE": return "bg-blue-100 text-blue-800";
    case "AFTER_SERVICE": return "bg-orange-100 text-orange-800";
    default: return "bg-muted text-muted-foreground";
  }
}

function getBookingStatusBadge(status?: string) {
  switch (status) {
    case "HOLD": return { cls: "bg-yellow-100 text-yellow-800 border border-yellow-300 border-dashed", label: "⏸ హోల్డ్" };
    case "CANCELLED": return { cls: "bg-red-100 text-red-800", label: "❌ రద్దు" };
    case "COMPLETED": return { cls: "bg-blue-100 text-blue-800", label: "✅ పూర్తి" };
    default: return null;
  }
}

function toPostMealMeal(r: MobileMealRecord): PostMealMeal {
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

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({
  record,
  canPostMeal,
  onOpenPostMeal,
  isHomeIncharge,
}: {
  record: MobileMealRecord;
  canPostMeal: boolean;
  onOpenPostMeal: (meal: PostMealMeal) => void;
  isHomeIncharge: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const total = Number(record.totalAmount ?? record.amount ?? 0);
  const rcvd = Number(record.amountReceived ?? 0) + Number(record.postMealAmountReceived ?? 0);
  const balance = Math.max(0, total - rcvd);
  const slots = getMealSlots(record);
  const homes = getMealHomes(record);
  const bookingBadge = getBookingStatusBadge(record.bookingStatus);
  const isMealDate = isToday(new Date(record.mealServiceDate.slice(0, 10) + "T00:00:00"));
  const isPast = isBefore(new Date(record.mealServiceDate.slice(0, 10) + "T00:00:00"), startOfDay(new Date()));

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm overflow-hidden",
        isMealDate && "border-primary/40 ring-1 ring-primary/20",
        record.mealCancelled && "opacity-60",
      )}
      data-testid={`mobile-meal-card-${record.id}`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between p-4 pb-3 gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-base leading-tight">
              {record.donor.firstName} {record.donor.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{record.donor.donorCode}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(record.mealServiceDate.slice(0, 10) + "T00:00:00"), "dd MMM yyyy (EEE)")}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {bookingBadge ? (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bookingBadge.cls}`}>
              {bookingBadge.label}
            </span>
          ) : (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentColor(record.paymentStatus)}`}>
              {record.paymentStatus?.replace(/_/g, " ") ?? record.paymentType ?? "—"}
            </span>
          )}
          {record.mealCompleted && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">✓ Done</span>
          )}
        </div>
      </div>

      {/* Key Info Row */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {slots.map((s) => (
          <Badge key={s} variant="outline" className="text-xs bg-orange-50 text-orange-800 border-orange-200">
            {s}
          </Badge>
        ))}
        {!isHomeIncharge && homes.map((h) => (
          <Badge key={h} variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
            {h}
          </Badge>
        ))}
        <Badge variant="outline" className="text-xs">
          {record.foodType === "VEG" ? "🟢 వెజ్" : "🔴 నాన్ వెజ్"}
        </Badge>
      </div>

      {/* Telecaller + Balance */}
      <div className="px-4 pb-3 flex items-center justify-between gap-4 text-sm">
        <div className="text-xs text-muted-foreground">
          {record.telecallerName ? (
            <span>📞 {record.telecallerName}</span>
          ) : (
            <span className="italic">No telecaller</span>
          )}
          {record.donorVisitExpected === false && (
            <span className="ml-2 text-orange-600">📷 Photo only</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">₹{total.toLocaleString("en-IN")} total</div>
          {balance > 0 ? (
            <div className="text-xs font-semibold text-orange-600">Bal: ₹{balance.toLocaleString("en-IN")}</div>
          ) : (
            <div className="text-xs font-semibold text-green-600">Paid ✓</div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1.5 border-t pt-3 text-xs text-muted-foreground">
          {record.occasionType && record.occasionType !== "NONE" && (
            <div>🎉 {record.occasionType.replace(/_/g, " ")} {record.occasionPersonName ? `— ${record.occasionPersonName}` : ""}</div>
          )}
          {(record.selectedMenuItems?.length ?? 0) > 0 && (
            <div>🍽 {record.selectedMenuItems!.slice(0, 4).join(", ")}{(record.selectedMenuItems!.length ?? 0) > 4 ? ` +${record.selectedMenuItems!.length - 4} more` : ""}</div>
          )}
          <div className="flex gap-3 flex-wrap pt-1">
            {record.donorVisited && <span className="text-blue-700">👤 Visited</span>}
            {record.promiseMade && <span className="text-yellow-700">🤝 Promise</span>}
            {record.extraItemsGiven && <span className="text-purple-700">🎁 Extra Items</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t bg-muted/20">
        <button
          className="flex-1 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          onClick={() => setExpanded((e) => !e)}
          data-testid={`mobile-expand-${record.id}`}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Less" : "Details"}
        </button>
        {canPostMeal && (isPast || isMealDate) && !record.mealCancelled && (
          <button
            className="flex-1 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border-l flex items-center justify-center gap-1"
            onClick={() => onOpenPostMeal(toPostMealMeal(record))}
            data-testid={`mobile-post-meal-${record.id}`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Post-Meal
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function MealSection({
  title,
  icon,
  items,
  canPostMeal,
  onOpenPostMeal,
  isHomeIncharge,
  defaultOpen = true,
}: {
  title: string;
  icon?: string;
  items: MobileMealRecord[];
  canPostMeal: boolean;
  onOpenPostMeal: (meal: PostMealMeal) => void;
  isHomeIncharge: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        className="w-full flex items-center justify-between py-1"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-sm text-foreground">
          {icon && `${icon} `}{title}
          <span className="ml-2 text-xs font-normal text-muted-foreground">({items.length})</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 border rounded-xl bg-muted/20">
              ఏమీ లేదు — Nothing here
            </div>
          ) : (
            items.map((r) => (
              <MealCard
                key={r.id}
                record={r}
                canPostMeal={canPostMeal}
                onOpenPostMeal={onOpenPostMeal}
                isHomeIncharge={isHomeIncharge}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Mobile View ──────────────────────────────────────────────────────────

interface Props {
  isHomeIncharge: boolean;
  canCreate: boolean;
  onAddMeal: () => void;
  onOpenPostMeal: (meal: PostMealMeal) => void;
}

export function MealsMobileView({ isHomeIncharge, canCreate, onAddMeal, onOpenPostMeal }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const from = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const to = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const { data, isLoading } = useQuery<{ items: MobileMealRecord[] }>({
    queryKey: ["/api/meals/mobile", today],
    queryFn: async () => {
      const params = new URLSearchParams({
        mealServiceDate: from,
        mealServiceDateTo: to,
        limit: "200",
      });
      const res = await fetchWithAuth(`/api/meals?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 30_000,
  });

  const items = data?.items ?? [];

  const { todayItems, upcomingItems, pendingItems } = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayItems = items
      .filter((r) => r.mealServiceDate.slice(0, 10) === todayStr)
      .sort((a, b) => {
        const slotOrder = ["breakfast", "lunch", "eveningSnacks", "dinner"];
        const aSlot = slotOrder.findIndex((s) => (a as any)[s]);
        const bSlot = slotOrder.findIndex((s) => (b as any)[s]);
        return aSlot - bSlot;
      });
    const upcomingItems = items
      .filter((r) => r.mealServiceDate.slice(0, 10) > todayStr)
      .sort((a, b) => a.mealServiceDate.localeCompare(b.mealServiceDate));
    const pendingItems = items
      .filter((r) => {
        const date = r.mealServiceDate.slice(0, 10);
        return date < todayStr && !r.mealCompleted && !r.mealCancelled;
      })
      .sort((a, b) => b.mealServiceDate.localeCompare(a.mealServiceDate));
    return { todayItems, upcomingItems, pendingItems };
  }, [items]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <UtensilsCrossed className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight">Meals</h1>
          <p className="text-xs text-muted-foreground leading-tight">{today}</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={onAddMeal} data-testid="mobile-add-meal-btn" className="shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-6">
          {/* Pending Actions Alert */}
          {pendingItems.length > 0 && (
            <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-orange-800">
                  {pendingItems.length} pending action{pendingItems.length > 1 ? "s" : ""}
                </div>
                <div className="text-xs text-orange-600">Post-meal updates needed</div>
              </div>
            </div>
          )}

          {/* Today Section */}
          <MealSection
            title="నేటి భోజన కార్యక్రమాలు (Today)"
            icon="🍽"
            items={todayItems}
            canPostMeal={true}
            onOpenPostMeal={onOpenPostMeal}
            isHomeIncharge={isHomeIncharge}
            defaultOpen={true}
          />

          {/* Pending Actions Section */}
          {pendingItems.length > 0 && (
            <MealSection
              title="పెండింగ్ చర్యలు (Pending Post-Meal)"
              icon="⏳"
              items={pendingItems}
              canPostMeal={true}
              onOpenPostMeal={onOpenPostMeal}
              isHomeIncharge={isHomeIncharge}
              defaultOpen={true}
            />
          )}

          {/* Upcoming Section */}
          <MealSection
            title="రాబోయే భోజన కార్యక్రమాలు (Upcoming)"
            icon="📅"
            items={upcomingItems}
            canPostMeal={false}
            onOpenPostMeal={onOpenPostMeal}
            isHomeIncharge={isHomeIncharge}
            defaultOpen={upcomingItems.length > 0 && upcomingItems.length <= 10}
          />
        </div>
      )}

      {/* Sticky FAB for Add */}
      {canCreate && (
        <div className="fixed bottom-6 right-4 z-30">
          <Button
            size="lg"
            onClick={onAddMeal}
            data-testid="mobile-fab-add-meal"
            className="rounded-full h-14 w-14 shadow-lg p-0"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
