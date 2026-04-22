"use client";

/**
 * Home Meals View — mobile-first, FULLY READ-ONLY operational screen.
 *
 * Purpose:
 *   Built for HOME_INCHARGE users to simply see "What to prepare today"
 *   at a glance. This screen makes ZERO writes — no PATCH, POST or DELETE
 *   calls originate from this page. It only performs a single authenticated
 *   GET against the existing /api/meals list endpoint.
 *
 * Notes:
 *   - Uses only the existing GET /api/meals?mealServiceDate=... endpoint.
 *   - Does NOT introduce any new backend contract, schema or route.
 *   - Donor data is never edited or created from here.
 *   - Kept deliberately separate from the richer today-mobile page.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  RefreshCw,
  LogOut,
  ChefHat,
  Leaf,
  Drumstick,
  Sparkles,
  StickyNote,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authStorage, fetchWithAuth, logout } from "@/lib/auth";

// ───────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────

const HOME_LABELS: Record<string, string> = {
  GIRLS_HOME: "Girls Home",
  BLIND_BOYS_HOME: "Blind Boys Home",
  OLD_AGE_HOME: "Old Age Home",
};

type SlotKey = "breakfast" | "lunch" | "eveningSnacks" | "dinner";

const SLOT_META: Array<{
  key: SlotKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind color token
}> = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, accent: "bg-amber-500" },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed, accent: "bg-orange-500" },
  { key: "eveningSnacks", label: "Snacks", icon: Cookie, accent: "bg-pink-500" },
  { key: "dinner", label: "Dinner", icon: Moon, accent: "bg-indigo-500" },
];

// ───────────────────────────────────────────────────────────────────────────
// Types (minimal — only what this screen renders)
// ───────────────────────────────────────────────────────────────────────────

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
  bookingStatus?: string | null;
  mealCompleted?: boolean | null;
  mealCompletedAt?: string | null;
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function fmtDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function prettyOccasion(meal: Meal): string | null {
  if (!meal.occasionType || meal.occasionType === "NONE") return null;
  const base = meal.occasionType.replaceAll("_", " ").toLowerCase();
  const person = meal.occasionPersonName ? ` — ${meal.occasionPersonName}` : "";
  return `${base.charAt(0).toUpperCase()}${base.slice(1)}${person}`;
}

function friendlyToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────────────────────

export default function HomeMealsMobileViewPage() {
  const router = useRouter();

  const [user, setUser] = useState<ReturnType<typeof authStorage.getUser>>(null);
  useEffect(() => {
    setUser(authStorage.getUser());
  }, []);

  const today = useMemo(() => fmtDateISO(new Date()), []);

  const mealsQ = useQuery<{ items: Meal[] }>({
    queryKey: ["/api/meals", "home-meals-view", today],
    queryFn: async () => {
      const r = await fetchWithAuth(
        `/api/meals?mealServiceDate=${today}&mealServiceDateTo=${today}&limit=200`,
      );
      if (!r.ok) throw new Error("Failed to load today's meals");
      return r.json();
    },
    // Small refresh interval: kitchen staff want near-live data without
    // having to hit refresh constantly. 60s is a sensible cheap poll.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const items = mealsQ.data?.items ?? [];

  // Group by slot — a single meal booking may cover multiple slots, so it
  // can appear in more than one bucket. That matches what kitchen staff
  // actually need (one card per slot-to-prepare).
  const grouped = useMemo(() => {
    const buckets: Record<SlotKey, Meal[]> = {
      breakfast: [],
      lunch: [],
      eveningSnacks: [],
      dinner: [],
    };
    for (const m of items) {
      for (const s of SLOT_META) {
        if ((m as unknown as Record<SlotKey, boolean>)[s.key]) {
          buckets[s.key].push(m);
        }
      }
    }
    return buckets;
  }, [items]);

  const totalPreparations = SLOT_META.reduce(
    (sum, s) => sum + grouped[s.key].length,
    0,
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const homeLabel = user?.assignedHome
    ? HOME_LABELS[user.assignedHome] ?? user.assignedHome
    : "Kitchen";

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-12 max-w-xl mx-auto"
      data-testid="page-home-meals-mobile-view"
    >
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            data-testid="button-back"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <div
              className="text-base font-semibold truncate text-slate-900"
              data-testid="text-home-name"
            >
              {homeLabel}
            </div>
            <div
              className="text-xs text-slate-500 truncate"
              data-testid="text-today-date"
            >
              {friendlyToday()}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => mealsQ.refetch()}
              disabled={mealsQ.isFetching}
              data-testid="button-refresh"
              aria-label="Refresh"
            >
              <RefreshCw
                className={`h-5 w-5 ${mealsQ.isFetching ? "animate-spin" : ""}`}
              />
            </Button>
            {user?.role === "HOME_INCHARGE" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
                aria-label="Log out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Summary pill */}
        <div className="px-4 pb-3">
          <div
            className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 flex items-center gap-2"
            data-testid="summary-banner"
          >
            <ChefHat className="h-4 w-4 text-primary shrink-0" />
            <div className="text-sm text-slate-800">
              <span className="font-semibold">
                {totalPreparations}
              </span>{" "}
              {totalPreparations === 1 ? "preparation" : "preparations"} to make today
            </div>
          </div>
        </div>
      </header>

      {/* ─── Body ─────────────────────────────────────────────────────────── */}
      <div className="px-3 py-4 space-y-5">
        {mealsQ.isLoading && (
          <div
            className="flex items-center justify-center py-20 text-sm text-slate-500"
            data-testid="state-loading"
          >
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading today's meals…
          </div>
        )}

        {!mealsQ.isLoading && mealsQ.isError && (
          <div
            className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900"
            data-testid="state-error"
          >
            Could not load meals. Please tap the refresh button and try again.
          </div>
        )}

        {!mealsQ.isLoading && !mealsQ.isError && items.length === 0 && (
          <EmptyState />
        )}

        {!mealsQ.isLoading && items.length > 0 && (
          <>
            {SLOT_META.map((s) => {
              const list = grouped[s.key];
              if (!list.length) return null;
              const Icon = s.icon;
              return (
                <section
                  key={s.key}
                  data-testid={`section-slot-${s.key}`}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 px-1">
                    <div
                      className={`h-9 w-9 rounded-xl ${s.accent} text-white flex items-center justify-center shadow-sm`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {s.label}
                    </h2>
                    <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                      {list.length} {list.length === 1 ? "card" : "cards"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {list.map((m) => (
                      <MealCard
                        key={`${m.id}-${s.key}`}
                        meal={m}
                        slotLabel={s.label}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Empty state
// ───────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-20 px-6" data-testid="state-empty">
      <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-400 mb-3" />
      <div className="text-lg font-semibold text-slate-900">
        Nothing to prepare today
      </div>
      <div className="text-sm text-slate-500 mt-1">
        No meal sponsorships are scheduled for today. Enjoy the quiet!
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Meal Card — large, readable, zero clutter
// ───────────────────────────────────────────────────────────────────────────

function MealCard({
  meal,
  slotLabel,
}: {
  meal: Meal;
  slotLabel: string;
}) {
  const donorName = `${meal.donor?.firstName ?? "Unknown"} ${
    meal.donor?.lastName ?? ""
  }`.trim();
  const isVeg = meal.foodType === "VEG";
  const occasion = prettyOccasion(meal);
  const phone = meal.donor?.primaryPhone;

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
      data-testid={`card-meal-${meal.id}`}
    >
      {/* Donor + Veg/Non-Veg */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-lg font-semibold text-slate-900"
            data-testid="text-donor-name"
          >
            <UserIcon className="h-5 w-5 text-slate-400 shrink-0" />
            <span className="truncate">{donorName || "Unknown donor"}</span>
          </div>
          {phone ? (
            <a
              href={`tel:${phone}`}
              data-testid={`link-call-donor-${meal.id}`}
              className="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-3 py-1 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call donor
            </a>
          ) : (
            <div className="text-xs text-slate-400 mt-1">No phone on file</div>
          )}
        </div>
        <Badge
          variant="outline"
          data-testid="badge-food-type"
          className={`text-sm px-3 py-1 font-semibold ${
            isVeg
              ? "bg-green-50 text-green-800 border-green-300"
              : "bg-red-50 text-red-800 border-red-300"
          }`}
        >
          {isVeg ? (
            <>
              <Leaf className="h-3.5 w-3.5 mr-1" /> VEG
            </>
          ) : (
            <>
              <Drumstick className="h-3.5 w-3.5 mr-1" /> NON-VEG
            </>
          )}
        </Badge>
      </div>

      {/* Meta row: slot + informational chips (display only) */}
      <div className="flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className="text-xs bg-slate-50 text-slate-700 border-slate-200"
        >
          <ChefHat className="h-3 w-3 mr-1" /> {slotLabel}
        </Badge>
        {meal.donorVisitExpected && (
          <Badge
            variant="outline"
            data-testid="badge-donor-visit-expected"
            className="text-xs bg-amber-50 text-amber-900 border-amber-300"
          >
            <Eye className="h-3 w-3 mr-1" /> Donor visit expected
          </Badge>
        )}
        {occasion && (
          <Badge
            variant="outline"
            data-testid="badge-occasion"
            className="text-xs bg-purple-50 text-purple-800 border-purple-300"
          >
            <PartyPopper className="h-3 w-3 mr-1" /> {occasion}
          </Badge>
        )}
      </div>

      {/* Menu / special menu / notes */}
      {(meal.selectedMenuItems?.length ||
        meal.specialMenuItem ||
        meal.mealNotes) && (
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-3">
          {meal.selectedMenuItems && meal.selectedMenuItems.length > 0 && (
            <div data-testid="section-menu">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Menu
              </div>
              <div className="flex flex-wrap gap-1.5">
                {meal.selectedMenuItems.map((item, i) => (
                  <span
                    key={`${meal.id}-menu-${i}`}
                    className="inline-block px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-sm text-slate-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {meal.specialMenuItem && (
            <div data-testid="section-special">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Special menu
              </div>
              <div className="text-sm text-slate-900">
                {meal.specialMenuItem}
              </div>
            </div>
          )}
          {meal.mealNotes && (
            <div data-testid="section-notes">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
                <StickyNote className="h-3 w-3" /> Notes
              </div>
              <div className="text-sm text-slate-700">{meal.mealNotes}</div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

