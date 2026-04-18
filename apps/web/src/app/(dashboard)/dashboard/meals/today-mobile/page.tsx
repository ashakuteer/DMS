"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  CheckCircle2,
  Coffee,
  UtensilsCrossed,
  Cookie,
  Moon,
  User as UserIcon,
  PartyPopper,
  Phone,
  Plus,
  RefreshCw,
  LogOut,
  ChefHat,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authStorage, fetchWithAuth, logout } from "@/lib/auth";

const HOME_LABELS: Record<string, string> = {
  GIRLS_HOME: "Girls Home",
  BLIND_BOYS_HOME: "Blind Boys Home",
  OLD_AGE_HOME: "Old Age Home",
};

const SLOT_META: Array<{
  key: "breakfast" | "lunch" | "eveningSnacks" | "dinner";
  label: string;
  icon: any;
  order: number;
}> = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, order: 1 },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed, order: 2 },
  { key: "eveningSnacks", label: "Snacks", icon: Cookie, order: 3 },
  { key: "dinner", label: "Dinner", icon: Moon, order: 4 },
];

interface Donor {
  id: string;
  firstName: string;
  lastName?: string | null;
  donorCode?: string | null;
  primaryPhone?: string | null;
}

interface Meal {
  id: string;
  donorId: string;
  donor?: Donor;
  mealServiceDate: string;
  homes: string[];
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  foodType: "VEG" | "NON_VEG" | string;
  mealNotes?: string | null;
  specialMenuItem?: string | null;
  selectedMenuItems?: string[] | null;
  donorVisitExpected?: boolean | null;
  donorVisited?: boolean | null;
  occasionType?: string | null;
  occasionPersonName?: string | null;
  occasionRelationship?: string | null;
  bookingStatus?: string | null;
  paymentStatus?: string | null;
  mealCompleted?: boolean | null;
  mealCompletedAt?: string | null;
}

function fmtDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pillClass(kind: "veg" | "nonveg" | "ok" | "warn" | "info" | "muted") {
  switch (kind) {
    case "veg":
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800";
    case "nonveg":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800";
    case "ok":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200";
    case "warn":
      return "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-100";
    case "info":
      return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100";
    case "muted":
    default:
      return "bg-muted text-foreground/70 border-border";
  }
}

type Tab = "today" | "tomorrow" | "pending";

export default function TodayMobilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("today");
  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);

  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const today = useMemo(() => fmtDateISO(new Date()), []);
  const tomorrow = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return fmtDateISO(t);
  }, []);

  const todayQ = useQuery<{ items: Meal[] }>({
    queryKey: ["/api/meals", "today-mobile", today],
    queryFn: async () => {
      const r = await fetchWithAuth(
        `/api/meals?mealServiceDate=${today}&mealServiceDateTo=${today}&limit=200`,
      );
      if (!r.ok) throw new Error("Failed to load today's meals");
      return r.json();
    },
    enabled: tab === "today",
  });

  const tomorrowQ = useQuery<{ items: Meal[] }>({
    queryKey: ["/api/meals", "today-mobile", tomorrow],
    queryFn: async () => {
      const r = await fetchWithAuth(
        `/api/meals?mealServiceDate=${tomorrow}&mealServiceDateTo=${tomorrow}&limit=200`,
      );
      if (!r.ok) throw new Error("Failed to load tomorrow's meals");
      return r.json();
    },
    enabled: tab === "tomorrow",
  });

  const pendingQ = useQuery<{ items: Meal[] }>({
    queryKey: ["/api/meals/pending-actions", "today-mobile"],
    queryFn: async () => {
      const r = await fetchWithAuth(`/api/meals/pending-actions`);
      if (!r.ok) throw new Error("Failed to load pending actions");
      return r.json();
    },
    enabled: tab === "pending",
  });

  const updateMut = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Record<string, any>;
    }) => {
      const r = await fetchWithAuth(`/api/meals/${id}/post-meal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(txt || "Update failed");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/meals"] });
      qc.invalidateQueries({ queryKey: ["/api/meals/pending-actions"] });
      toast({ title: "Updated" });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Update failed", description: e?.message ?? "Try again" });
    },
  });

  const activeQuery =
    tab === "today" ? todayQ : tab === "tomorrow" ? tomorrowQ : pendingQ;
  // Trust the backend's pending-actions contract — no extra client filtering.
  const visibleItems = activeQuery.data?.items ?? [];

  // Group by slot for Today / Tomorrow.
  const grouped = useMemo(() => {
    if (tab === "pending") return null;
    const buckets: Record<string, Meal[]> = {
      breakfast: [],
      lunch: [],
      eveningSnacks: [],
      dinner: [],
    };
    for (const m of visibleItems) {
      for (const s of SLOT_META) {
        if ((m as any)[s.key]) buckets[s.key].push(m);
      }
    }
    return buckets;
  }, [visibleItems, tab]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const homeLabel = user?.assignedHome ? HOME_LABELS[user.assignedHome] ?? user.assignedHome : "Your home";

  return (
    <div className="min-h-screen bg-background pb-24 max-w-xl mx-auto" data-testid="page-home-incharge-mobile">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-base font-semibold truncate" data-testid="text-home-name">
              {homeLabel}
            </div>
            <div className="text-xs text-muted-foreground truncate" data-testid="text-user-name">
              {user?.name ?? ""}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => activeQuery.refetch()}
              disabled={activeQuery.isFetching}
              data-testid="button-refresh"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${activeQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout" aria-label="Log out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Tabs */}
        <nav className="flex border-t" role="tablist">
          {(
            [
              { key: "today", label: "Today" },
              { key: "tomorrow", label: "Tomorrow" },
              { key: "pending", label: "Pending" },
            ] as Array<{ key: Tab; label: string }>
          ).map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium relative ${
                tab === t.key ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`tab-${t.key}`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Body */}
      <div className="px-3 py-4 space-y-4">
        {activeQuery.isLoading && (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        )}

        {!activeQuery.isLoading && activeQuery.isError && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 p-4 text-sm text-red-900 dark:text-red-100">
            Could not load meals. Pull to refresh or try again.
          </div>
        )}

        {!activeQuery.isLoading && !activeQuery.isError && visibleItems.length === 0 && (
          <EmptyState tab={tab} />
        )}

        {/* Today / Tomorrow grouped by slot */}
        {!activeQuery.isLoading && grouped && visibleItems.length > 0 && (
          <>
            {SLOT_META.map((s) => {
              const list = grouped[s.key] ?? [];
              if (list.length === 0) return null;
              const Icon = s.icon;
              return (
                <section key={s.key} data-testid={`section-slot-${s.key}`}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {s.label} <span className="text-xs">({list.length})</span>
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {list.map((m) => (
                      <MealCard
                        key={`${m.id}-${s.key}`}
                        meal={m}
                        slot={s.label}
                        onMarkServed={() =>
                          updateMut.mutate({
                            id: m.id,
                            patch: {
                              mealCompleted: true,
                              mealCompletedAt: new Date().toISOString(),
                            },
                          })
                        }
                        onMarkDonorVisited={() =>
                          updateMut.mutate({
                            id: m.id,
                            patch: { donorVisited: true },
                          })
                        }
                        isUpdating={updateMut.isPending}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        {/* Pending tab — flat list */}
        {!activeQuery.isLoading && tab === "pending" && visibleItems.length > 0 && (
          <div className="space-y-3">
            {visibleItems.map((m) => (
              <MealCard
                key={m.id}
                meal={m}
                slot={null}
                onMarkServed={() =>
                  updateMut.mutate({
                    id: m.id,
                    patch: {
                      mealCompleted: true,
                      mealCompletedAt: new Date().toISOString(),
                    },
                  })
                }
                onMarkDonorVisited={() =>
                  updateMut.mutate({
                    id: m.id,
                    patch: { donorVisited: true },
                  })
                }
                isUpdating={updateMut.isPending}
                showDate
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky bottom action — Add Booking (secondary) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t">
        <div className="max-w-xl mx-auto px-3 py-3 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => router.push("/dashboard/meals/mobile-new")}
            data-testid="button-add-booking"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Booking
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  const messages = {
    today: { title: "No meals scheduled for today", body: "Enjoy a quiet day. Pull down or tap refresh to check again." },
    tomorrow: { title: "No bookings yet for tomorrow", body: "Anything booked later today will appear here." },
    pending: { title: "All caught up", body: "No pending updates right now." },
  } as const;
  const m = messages[tab];
  return (
    <div className="text-center py-16 px-6" data-testid={`empty-${tab}`}>
      <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
      <div className="text-base font-medium">{m.title}</div>
      <div className="text-sm text-muted-foreground mt-1">{m.body}</div>
    </div>
  );
}

function MealCard({
  meal,
  slot,
  onMarkServed,
  onMarkDonorVisited,
  isUpdating,
  showDate,
}: {
  meal: Meal;
  slot: string | null;
  onMarkServed: () => void;
  onMarkDonorVisited: () => void;
  isUpdating: boolean;
  showDate?: boolean;
}) {
  const router = useRouter();
  const donorName = `${meal.donor?.firstName ?? "Unknown"} ${meal.donor?.lastName ?? ""}`.trim();
  const isVeg = meal.foodType === "VEG";
  const dateStr = meal.mealServiceDate
    ? new Date(meal.mealServiceDate).toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "";

  const slotsForMeal = SLOT_META.filter((s) => (meal as any)[s.key]).map((s) => s.label);

  const occasionStr =
    meal.occasionType && meal.occasionType !== "NONE"
      ? `${meal.occasionType.replaceAll("_", " ").toLowerCase()}${meal.occasionPersonName ? ` — ${meal.occasionPersonName}` : ""}`
      : null;

  return (
    <article
      className="rounded-xl border bg-card p-4 shadow-sm space-y-3"
      data-testid={`card-meal-${meal.id}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-semibold truncate" data-testid="text-donor-name">
            <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{donorName || "Unknown donor"}</span>
          </div>
          {meal.donor?.primaryPhone && (
            <a
              href={`tel:${meal.donor.primaryPhone}`}
              className="text-xs text-blue-700 dark:text-blue-300 inline-flex items-center gap-1 mt-0.5"
              data-testid="link-call-donor"
            >
              <Phone className="h-3 w-3" /> {meal.donor.primaryPhone}
            </a>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            variant="outline"
            className={`text-xs px-2 py-0.5 ${pillClass(isVeg ? "veg" : "nonveg")}`}
            data-testid="badge-food-type"
          >
            {isVeg ? "VEG" : "NON-VEG"}
          </Badge>
          {meal.mealCompleted && (
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${pillClass("ok")}`} data-testid="badge-served">
              Served
            </Badge>
          )}
        </div>
      </div>

      {/* Slot + date row */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {slot ? (
          <Badge variant="outline" className={`px-2 py-0.5 ${pillClass("info")}`}>
            <ChefHat className="h-3 w-3 mr-1" /> {slot}
          </Badge>
        ) : (
          slotsForMeal.map((s) => (
            <Badge key={s} variant="outline" className={`px-2 py-0.5 ${pillClass("info")}`}>
              {s}
            </Badge>
          ))
        )}
        {showDate && dateStr && (
          <Badge variant="outline" className={`px-2 py-0.5 ${pillClass("muted")}`}>
            {dateStr}
          </Badge>
        )}
        {meal.donorVisitExpected && (
          <Badge
            variant="outline"
            className={`px-2 py-0.5 ${pillClass(meal.donorVisited ? "ok" : "warn")}`}
            data-testid="badge-donor-visit"
          >
            {meal.donorVisited ? "Donor visited" : "Donor visit expected"}
          </Badge>
        )}
        {occasionStr && (
          <Badge variant="outline" className={`px-2 py-0.5 ${pillClass("muted")}`} data-testid="badge-occasion">
            <PartyPopper className="h-3 w-3 mr-1" /> {occasionStr}
          </Badge>
        )}
        {meal.bookingStatus && meal.bookingStatus !== "CONFIRMED" && (
          <Badge variant="outline" className={`px-2 py-0.5 ${pillClass("warn")}`}>
            {meal.bookingStatus}
          </Badge>
        )}
      </div>

      {/* Special menu / notes */}
      {(meal.specialMenuItem || meal.mealNotes) && (
        <div className="text-sm bg-muted/40 rounded-md px-3 py-2 space-y-1">
          {meal.specialMenuItem && (
            <div data-testid="text-special-item">
              <span className="font-medium">Special: </span>
              {meal.specialMenuItem}
            </div>
          )}
          {meal.mealNotes && (
            <div className="text-muted-foreground" data-testid="text-meal-notes">
              {meal.mealNotes}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant={meal.mealCompleted ? "outline" : "default"}
          size="sm"
          className="h-10"
          onClick={onMarkServed}
          disabled={isUpdating || !!meal.mealCompleted}
          data-testid={`button-mark-served-${meal.id}`}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          {meal.mealCompleted ? "Served" : "Mark Served"}
        </Button>
        <Button
          variant={meal.donorVisited ? "outline" : "secondary"}
          size="sm"
          className="h-10"
          onClick={onMarkDonorVisited}
          disabled={isUpdating || !!meal.donorVisited || !meal.donorVisitExpected}
          data-testid={`button-mark-visit-${meal.id}`}
        >
          <UserIcon className="h-4 w-4 mr-1" />
          {meal.donorVisited ? "Visited" : "Visited?"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 col-span-2"
          onClick={() => router.push(`/dashboard/meals/${meal.id}`)}
          data-testid={`button-view-details-${meal.id}`}
        >
          <Eye className="h-4 w-4 mr-1" /> View details
        </Button>
      </div>
    </article>
  );
}
