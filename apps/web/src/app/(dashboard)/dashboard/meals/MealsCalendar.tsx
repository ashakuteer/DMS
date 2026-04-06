"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMealsLang } from "./useMealsLang";
import { SLOT_LANG, HOME_LANG, FOOD_TYPE_LANG, BOOKING_STATUS_LANG, TELECALLER_LANG, LEGEND_LANG } from "./mealsLang";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarMealRecord {
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
  donor: { firstName: string; lastName: string; donorCode: string };
  totalAmount?: string | null;
  amount: string;
  amountReceived?: string;
  paymentStatus?: string;
  occasionType?: string;
  occasionPersonName?: string;
  selectedMenuItems?: string[];
  telecallerName?: string;
  bookingStatus?: string;
  donorVisitExpected?: boolean;
  // Phase 3A — Post-Meal
  mealCompleted?: boolean | null;
  donorVisited?: boolean | null;
  promiseMade?: boolean | null;
  extraItemsGiven?: boolean | null;
  balancePaidAfterMeal?: boolean | null;
  postMealAmountReceived?: string | null;
}

type SlotKey = "breakfast" | "lunch" | "eveningSnacks" | "dinner";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOME_VALUES = ["GIRLS_HOME", "BLIND_BOYS_HOME", "OLD_AGE_HOME"];
const SLOT_KEYS_ORDERED: SlotKey[] = ["breakfast", "lunch", "eveningSnacks", "dinner"];

// Column width for each date cell (px)
const CELL_W = 52;
// Frozen label column width (px)
const LABEL_W = 148;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function homeLabel(h: string) {
  return HOME_OPTIONS.find((x) => x.value === h)?.label ?? h;
}

function isoDate(year: number, month0: number, day: number) {
  return format(new Date(year, month0, day), "yyyy-MM-dd");
}

/** Returns records that cover a given (year, month0, day, slotKey, homeValue) cell.
 *  Date comparison uses the ISO string prefix ("yyyy-MM-dd") to avoid any
 *  browser timezone distortion that Date.getDate() would introduce.
 */
function getMatchingRecords(
  records: CalendarMealRecord[],
  year: number,
  month0: number,
  day: number,
  slotKey: SlotKey,
  homeValue: string,
): CalendarMealRecord[] {
  // Build expected date string once — e.g. "2026-04-04"
  const expectedDate =
    `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return records.filter((r) => {
    // Timezone-safe: compare only the date portion of the ISO string
    if (!r.mealServiceDate || r.mealServiceDate.slice(0, 10) !== expectedDate) return false;
    // Check slot is active on this record
    if (!r[slotKey]) return false;
    const sh = r.slotHomes as Record<string, string[]> | null | undefined;
    if (sh && typeof sh === "object" && Object.keys(sh).length > 0) {
      // New record with slotHomes: check this home is assigned for this slot
      return Array.isArray(sh[slotKey]) && sh[slotKey].includes(homeValue);
    }
    // Legacy record (no slotHomes or empty object): fall back to flat homes[]
    return Array.isArray(r.homes) && r.homes.includes(homeValue);
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onAddWithPrefill: (
    date: string,
    slots: Partial<Record<SlotKey, boolean>>,
    home: string,
  ) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MealsCalendar({ onAddWithPrefill }: Props) {
  const [lang] = useMealsLang();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedCell, setSelectedCell] = useState<{
    day: number;
    slotKey: SlotKey;
    homeValue: string;
  } | null>(null);

  // Build HOME_OPTIONS + SLOTS dynamically based on lang
  const HOME_OPTIONS = useMemo(
    () => HOME_VALUES.map((v) => ({ value: v, label: HOME_LANG[lang][v] ?? v })),
    [lang],
  );
  const SLOTS: { key: SlotKey; label: string }[] = useMemo(
    () => SLOT_KEYS_ORDERED.map((k) => ({ key: k, label: SLOT_LANG[lang][k] ?? k })),
    [lang],
  );

  // Derive visible homes based on role
  const currentUser = authStorage.getUser();
  const isHomeIncharge = currentUser?.role === "HOME_INCHARGE";
  const canCreate = !isHomeIncharge;

  const visibleHomes = useMemo(() => {
    if (isHomeIncharge && currentUser?.assignedHome) {
      return HOME_OPTIONS.filter((h) => h.value === currentUser.assignedHome);
    }
    return HOME_OPTIONS;
  }, [isHomeIncharge, currentUser?.assignedHome, HOME_OPTIONS]);

  const firstDay = startOfMonth(month);
  const lastDay = endOfMonth(month);
  const daysInMonth = getDaysInMonth(month);
  const days = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // ── Data fetch (all homes, full month) ──────────────────────────────────────
  const { data, isLoading } = useQuery<{ items: CalendarMealRecord[] }>({
    queryKey: ["/api/meals/matrix", format(month, "yyyy-MM")],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set("mealServiceDate", format(firstDay, "yyyy-MM-dd"));
      p.set("mealServiceDateTo", format(lastDay, "yyyy-MM-dd"));
      p.set("limit", "500");
      const res = await fetchWithAuth(`/api/meals?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
    staleTime: 60_000,
  });

  const records = data?.items ?? [];

  // ── Build matrix: matrixData[homeValue][slotKey][day] ───────────────────────
  const matrixData = useMemo(() => {
    const year = month.getFullYear();
    const month0 = month.getMonth();
    const m: Record<string, Record<string, Record<number, CalendarMealRecord[]>>> = {};
    for (const home of visibleHomes) {
      m[home.value] = {};
      for (const slot of SLOTS) {
        m[home.value][slot.key] = {};
        for (const d of days) {
          m[home.value][slot.key][d] = getMatchingRecords(
            records, year, month0, d, slot.key, home.value,
          );
        }
      }
    }
    return m;
  }, [records, days, month, visibleHomes]);

  // ── Modal records ────────────────────────────────────────────────────────────
  const cellRecordsForModal = useMemo(() => {
    if (!selectedCell) return [];
    return (
      matrixData[selectedCell.homeValue]?.[selectedCell.slotKey]?.[selectedCell.day] ?? []
    );
  }, [selectedCell, matrixData]);

  const modalSlotLabel = selectedCell
    ? SLOTS.find((s) => s.key === selectedCell.slotKey)?.label ?? ""
    : "";

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openAdd() {
    if (!selectedCell) return;
    const { day, slotKey, homeValue } = selectedCell;
    setSelectedCell(null);
    const dateStr = isoDate(month.getFullYear(), month.getMonth(), day);
    onAddWithPrefill(dateStr, { [slotKey]: true }, homeValue);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="icon"
          data-testid="calendar-prev-month"
          onClick={() => setMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold min-w-[180px] text-center">
          {format(month, "MMMM yyyy")}
        </span>
        <Button
          variant="outline"
          size="icon"
          data-testid="calendar-next-month"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-testid="calendar-today"
          onClick={() => setMonth(startOfMonth(new Date()))}
        >
          Today
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-200 dark:bg-green-900/60 border border-green-300" />
          {LEGEND_LANG[lang].paid}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300" />
          {LEGEND_LANG[lang].balance}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-yellow-100 border-2 border-dashed border-yellow-400" />
          {LEGEND_LANG[lang].hold}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-orange-200 border-2 border-orange-400" />
          {LEGEND_LANG[lang].conflict}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          {LEGEND_LANG[lang].completed}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-muted border" />
          {LEGEND_LANG[lang].available}
        </span>
      </div>

      {/* Matrix grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          {/* wrapper sets minimum total width so scroll appears only when needed */}
          <div style={{ minWidth: `${LABEL_W + daysInMonth * CELL_W}px` }}>

            {/* ── Date header row ── */}
            <div
              className="flex border-b bg-muted/60"
              style={{ position: "sticky", top: 0, zIndex: 20 }}
            >
              {/* Frozen corner */}
              <div
                className="shrink-0 border-r flex items-center px-3 text-[11px] font-semibold text-muted-foreground bg-muted/60"
                style={{ width: LABEL_W, position: "sticky", left: 0, zIndex: 21 }}
              >
                Home · Slot
              </div>

              {/* Date columns */}
              {days.map((d) => {
                const dateStr = isoDate(month.getFullYear(), month.getMonth(), d);
                const isToday = dateStr === todayStr;
                const dateObj = new Date(month.getFullYear(), month.getMonth(), d);
                return (
                  <div
                    key={d}
                    className={`shrink-0 py-1.5 px-0 border-r text-center ${
                      isToday ? "bg-primary/10" : ""
                    }`}
                    style={{ width: CELL_W }}
                  >
                    <div className="text-[9px] text-muted-foreground leading-none">
                      {format(dateObj, "EEE")}
                    </div>
                    <div
                      className={`text-xs font-bold leading-tight mt-0.5 ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {d}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Home groups ── */}
            {visibleHomes.map((home, hIdx) => (
              <div key={home.value}>
                {/* Home group header */}
                <div className="flex border-b bg-muted/40">
                  <div
                    className="shrink-0 px-3 py-1 border-r text-[11px] font-bold tracking-wide text-foreground bg-muted/40 flex items-center"
                    style={{ width: LABEL_W, position: "sticky", left: 0, zIndex: 10 }}
                  >
                    {home.label}
                  </div>
                  {/* Span remaining columns with the same background */}
                  <div className="flex-1" />
                </div>

                {/* Slot rows */}
                {SLOTS.map((slot, sIdx) => {
                  const isLastRow =
                    hIdx === visibleHomes.length - 1 && sIdx === SLOTS.length - 1;
                  return (
                    <div
                      key={slot.key}
                      className={`flex ${isLastRow ? "" : "border-b"}`}
                    >
                      {/* Frozen slot label */}
                      <div
                        className="shrink-0 border-r text-[11px] text-muted-foreground bg-background flex items-center px-3"
                        style={{ width: LABEL_W, minHeight: 40, position: "sticky", left: 0, zIndex: 10 }}
                      >
                        {slot.label}
                      </div>

                      {/* Day cells */}
                      {days.map((d) => {
                        const dateStr = isoDate(month.getFullYear(), month.getMonth(), d);
                        const isToday = dateStr === todayStr;
                        const cellRecords =
                          matrixData[home.value]?.[slot.key]?.[d] ?? [];
                        const count = cellRecords.length;
                        const hasConflict = count > 1;
                        const isHold = count === 1 && cellRecords[0].bookingStatus === "HOLD";
                        const isCancelled = count === 1 && cellRecords[0].bookingStatus === "CANCELLED";
                        const isCompleted = count === 1 && cellRecords[0].bookingStatus === "COMPLETED";
                        const hasBalance = !hasConflict && !isHold && !isCancelled && !isCompleted && cellRecords.some((r) => {
                          const total = Number(r.totalAmount ?? r.amount);
                          const rcvd = Number(r.amountReceived ?? 0);
                          return rcvd < total;
                        });
                        const photoOnly = count === 1 && cellRecords[0].donorVisitExpected === false;
                        const telecaller = count === 1 ? cellRecords[0].telecallerName : undefined;

                        let bgCls: string;
                        let textCls: string;
                        if (count === 0) {
                          bgCls = "hover:bg-muted/60";
                          textCls = "";
                        } else if (hasConflict) {
                          bgCls = "bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 border-2 border-orange-400";
                          textCls = "text-orange-900 dark:text-orange-200";
                        } else if (isHold) {
                          bgCls = "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-400 border-dashed";
                          textCls = "text-yellow-800 dark:text-yellow-300";
                        } else if (isCancelled) {
                          bgCls = "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30";
                          textCls = "text-red-700 dark:text-red-300";
                        } else if (isCompleted) {
                          bgCls = "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30";
                          textCls = "text-blue-700 dark:text-blue-300";
                        } else if (hasBalance) {
                          bgCls = "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30";
                          textCls = "text-yellow-800 dark:text-yellow-300";
                        } else {
                          bgCls = "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30";
                          textCls = "text-green-800 dark:text-green-300";
                        }

                        return (
                          <div
                            key={d}
                            title={hasConflict ? "Multiple donors booked — conflict!" : undefined}
                            className={`shrink-0 cursor-pointer transition-colors flex flex-col items-center justify-center p-0.5 gap-0 ${bgCls} ${
                              isToday ? "ring-inset ring-1 ring-primary/40" : ""
                            } ${!hasConflict ? "border-r" : ""}`}
                            style={{ width: CELL_W, minHeight: 40 }}
                            onClick={() =>
                              setSelectedCell({ day: d, slotKey: slot.key, homeValue: home.value })
                            }
                            data-testid={`matrix-cell-${home.value}-${slot.key}-${d}`}
                          >
                            {count === 0 ? (
                              <span className="text-[10px] text-muted-foreground/30 select-none">
                                —
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`text-[10px] font-semibold leading-tight text-center max-w-full truncate px-0.5 ${textCls}`}
                                >
                                  {hasConflict ? `⚠ ${count} donors` : cellRecords[0].donor.firstName}
                                </span>
                                {!hasConflict && telecaller && (
                                  <span className="text-[8px] text-muted-foreground leading-tight truncate max-w-full px-0.5">
                                    {telecaller}
                                  </span>
                                )}
                                {!hasConflict && photoOnly && (
                                  <span className="text-[8px] leading-tight text-orange-600 dark:text-orange-400">
                                    📷
                                  </span>
                                )}
                                {!hasConflict && isHold && (
                                  <span className="text-[8px] leading-tight text-yellow-600 font-bold">
                                    HOLD
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cell detail modal ── */}
      <Dialog
        open={selectedCell !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCell(null);
        }}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug">
              {modalSlotLabel}
              {selectedCell && (
                <span className="text-muted-foreground font-normal">
                  {" "}— {homeLabel(selectedCell.homeValue)}
                </span>
              )}
              {selectedCell && (
                <div className="text-sm font-normal text-muted-foreground mt-0.5">
                  {format(
                    new Date(
                      month.getFullYear(),
                      month.getMonth(),
                      selectedCell.day,
                    ),
                    "dd MMMM yyyy",
                  )}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {cellRecordsForModal.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-muted-foreground text-sm">
                No sponsorship booked for this slot.
              </p>
              {canCreate && (
                <Button
                  size="sm"
                  data-testid="calendar-add-from-empty-cell"
                  onClick={openAdd}
                >
                  + Add Sponsorship
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {cellRecordsForModal.map((r) => {
                const total = Number(r.totalAmount ?? r.amount);
                const rcvd = Number(r.amountReceived ?? 0);
                const balance = Math.max(0, total - rcvd);
                const menuCount = r.selectedMenuItems?.length ?? 0;
                return (
                  <div key={r.id} className="p-3 border rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {r.donor.firstName} {r.donor.lastName}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {r.donor.donorCode}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {FOOD_TYPE_LANG[lang][r.foodType] ?? (r.foodType === "VEG" ? "🟢 Veg" : "🔴 Non-Veg")}
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        ₹{total.toLocaleString("en-IN")}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rcvd: </span>
                        ₹{rcvd.toLocaleString("en-IN")}
                      </div>
                      <div
                        className={
                          balance > 0
                            ? "text-orange-600 font-medium"
                            : "text-green-600"
                        }
                      >
                        Bal: ₹{balance.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {r.occasionType && r.occasionType !== "NONE" && (
                      <div className="text-xs text-muted-foreground">
                        Occasion:{" "}
                        {r.occasionType.replace(/_/g, " ")}
                        {r.occasionPersonName ? ` — ${r.occasionPersonName}` : ""}
                      </div>
                    )}

                    {menuCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Menu:{" "}
                        {r.selectedMenuItems!.slice(0, 3).join(", ")}
                        {menuCount > 3 ? ` +${menuCount - 3} more` : ""}
                      </div>
                    )}

                    {r.telecallerName && (
                      <div className="text-xs text-muted-foreground">
                        {TELECALLER_LANG[lang]}: {r.telecallerName}
                      </div>
                    )}
                    {r.bookingStatus && r.bookingStatus !== "CONFIRMED" && (
                      <div className={`text-xs font-semibold ${
                        r.bookingStatus === "HOLD" ? "text-yellow-700" :
                        r.bookingStatus === "CANCELLED" ? "text-red-600" :
                        r.bookingStatus === "COMPLETED" ? "text-blue-600" : ""
                      }`}>
                        {r.bookingStatus === "HOLD" ? `⏸ ${BOOKING_STATUS_LANG[lang].HOLD}` :
                         r.bookingStatus === "CANCELLED" ? `❌ ${BOOKING_STATUS_LANG[lang].CANCELLED}` :
                         r.bookingStatus === "COMPLETED" ? `✅ ${BOOKING_STATUS_LANG[lang].COMPLETED}` : r.bookingStatus}
                      </div>
                    )}
                    {r.donorVisitExpected === false && (
                      <div className="text-xs text-orange-600 font-medium">
                        {lang === "en" ? "📷 Photo / Video only" : "📷 ఫోటో / వీడియో మాత్రమే (Photo / Video only)"}
                      </div>
                    )}

                    {/* Post-meal status badges */}
                    {(r.mealCompleted || r.donorVisited || r.promiseMade || r.extraItemsGiven || r.balancePaidAfterMeal) && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {r.mealCompleted && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 font-medium">✓ Completed</span>
                        )}
                        {r.donorVisited && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-medium">Visited</span>
                        )}
                        {r.promiseMade && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 font-medium">Promise Made</span>
                        )}
                        {r.extraItemsGiven && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 font-medium">Extra Items</span>
                        )}
                        {(r.balancePaidAfterMeal || (Number(r.postMealAmountReceived ?? 0) > 0)) && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 font-medium">Bal Cleared</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {canCreate && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  data-testid="calendar-add-another"
                  onClick={openAdd}
                >
                  + Add Another Sponsorship
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
