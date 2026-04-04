"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, getDaysInMonth, addMonths, subMonths } from "date-fns";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarMealRecord {
  id: string;
  mealServiceDate: string;
  breakfast: boolean;
  lunch: boolean;
  eveningSnacks: boolean;
  dinner: boolean;
  homes: string[];
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
}

type SlotKey = "breakfast" | "lunch" | "eveningSnacks" | "dinner";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOME_OPTIONS = [
  { value: "GIRLS_HOME", label: "Girls Home" },
  { value: "BLIND_BOYS_HOME", label: "Blind Boys Home" },
  { value: "OLD_AGE_HOME", label: "Old Age Home" },
];

const SLOTS: { key: SlotKey; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "eveningSnacks", label: "Evening Snacks" },
  { key: "dinner", label: "Dinner" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function homeLabel(h: string) {
  return HOME_OPTIONS.find((x) => x.value === h)?.label ?? h;
}

function isoDate(year: number, month0: number, day: number) {
  return format(new Date(year, month0, day), "yyyy-MM-dd");
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
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [homeFilter, setHomeFilter] = useState("all");
  const [selectedCell, setSelectedCell] = useState<{
    day: number;
    slot: { key: SlotKey; label: string };
  } | null>(null);

  const firstDay = startOfMonth(month);
  const lastDay = endOfMonth(month);
  const daysInMonth = getDaysInMonth(month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const { data, isLoading } = useQuery<{ items: CalendarMealRecord[] }>({
    queryKey: ["/api/meals/calendar", format(month, "yyyy-MM"), homeFilter],
    queryFn: async () => {
      const p = new URLSearchParams();
      p.set("mealServiceDate", format(firstDay, "yyyy-MM-dd"));
      p.set("mealServiceDateTo", format(lastDay, "yyyy-MM-dd"));
      if (homeFilter !== "all") p.set("home", homeFilter);
      p.set("limit", "500");
      const res = await fetchWithAuth(`/api/meals?${p.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch meals");
      return res.json();
    },
    staleTime: 60_000,
  });

  const records = data?.items ?? [];

  const byDay = useMemo(() => {
    const map: Record<number, CalendarMealRecord[]> = {};
    for (const r of records) {
      const d = new Date(r.mealServiceDate).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(r);
    }
    return map;
  }, [records]);

  function getCellRecords(day: number, slotKey: SlotKey): CalendarMealRecord[] {
    return (byDay[day] ?? []).filter((r) => r[slotKey] === true);
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const cellRecordsForModal = selectedCell
    ? getCellRecords(selectedCell.day, selectedCell.slot.key)
    : [];

  function openAdd(day: number, slot: { key: SlotKey; label: string }) {
    setSelectedCell(null);
    const slotPayload: Partial<Record<SlotKey, boolean>> = { [slot.key]: true };
    const dateStr = isoDate(month.getFullYear(), month.getMonth(), day);
    onAddWithPrefill(dateStr, slotPayload, homeFilter !== "all" ? homeFilter : "");
  }

  return (
    <div className="space-y-4">
      {/* ── Controls ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
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

        <Select value={homeFilter} onValueChange={setHomeFilter}>
          <SelectTrigger className="w-44" data-testid="calendar-home-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Homes</SelectItem>
            {HOME_OPTIONS.map((h) => (
              <SelectItem key={h.value} value={h.value}>
                {h.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-green-200 dark:bg-green-900/60 border border-green-300" />
          Fully paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300" />
          Balance pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-muted border" />
          Available
        </span>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <div className="min-w-max">
            {/* Header: Slot label column + day columns */}
            <div className="flex border-b bg-muted/50">
              <div className="w-32 shrink-0 p-2 border-r text-xs font-semibold text-muted-foreground">
                Slot
              </div>
              {days.map((d) => {
                const dateStr = isoDate(month.getFullYear(), month.getMonth(), d);
                const isToday = dateStr === todayStr;
                const dateObj = new Date(month.getFullYear(), month.getMonth(), d);
                return (
                  <div
                    key={d}
                    className={`w-[72px] shrink-0 py-1.5 px-0.5 border-r text-center ${
                      isToday ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="text-[10px] text-muted-foreground">
                      {format(dateObj, "EEE")}
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {d}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Slot rows */}
            {SLOTS.map((slot) => (
              <div key={slot.key} className="flex border-b last:border-b-0">
                {/* Row label */}
                <div className="w-32 shrink-0 p-2 border-r text-xs font-semibold bg-muted/20 flex items-center">
                  {slot.label}
                </div>

                {/* Day cells */}
                {days.map((d) => {
                  const cellRecords = getCellRecords(d, slot.key);
                  const count = cellRecords.length;
                  const hasBalance = cellRecords.some((r) => {
                    const total = Number(r.totalAmount ?? r.amount);
                    const rcvd = Number(r.amountReceived ?? 0);
                    return rcvd < total;
                  });

                  let bgClass = "";
                  if (count > 0) {
                    bgClass = hasBalance
                      ? "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                      : "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30";
                  } else {
                    bgClass = "hover:bg-muted/60";
                  }

                  return (
                    <div
                      key={d}
                      className={`w-[72px] shrink-0 min-h-[52px] border-r cursor-pointer transition-colors flex flex-col items-center justify-center p-1 gap-0.5 ${bgClass}`}
                      onClick={() => setSelectedCell({ day: d, slot })}
                      data-testid={`calendar-cell-${slot.key}-${d}`}
                    >
                      {count === 0 ? (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">
                            {count}
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight text-center max-w-full truncate px-0.5">
                            {cellRecords[0].donor.firstName}
                            {count > 1 ? ` +${count - 1}` : ""}
                          </span>
                        </>
                      )}
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
        onOpenChange={(open) => { if (!open) setSelectedCell(null); }}
      >
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.slot.label}
              {" — "}
              {selectedCell
                ? format(
                    new Date(
                      month.getFullYear(),
                      month.getMonth(),
                      selectedCell.day,
                    ),
                    "dd MMM yyyy",
                  )
                : ""}
              {homeFilter !== "all" && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({homeLabel(homeFilter)})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {cellRecordsForModal.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-muted-foreground text-sm">No sponsorship for this slot.</p>
              {selectedCell && (
                <Button
                  size="sm"
                  data-testid="calendar-add-from-empty-cell"
                  onClick={() => openAdd(selectedCell.day, selectedCell.slot)}
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

                    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      <span>{r.foodType === "VEG" ? "🟢 Veg" : "🔴 Non-Veg"}</span>
                      {r.homes.map((h) => (
                        <span key={h} className="bg-muted px-1.5 py-0.5 rounded">
                          {homeLabel(h)}
                        </span>
                      ))}
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
                          balance > 0 ? "text-orange-600 font-medium" : "text-green-600"
                        }
                      >
                        Bal: ₹{balance.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {r.occasionType && r.occasionType !== "NONE" && (
                      <div className="text-xs text-muted-foreground">
                        Occasion:{" "}
                        {r.occasionType.replace(/_/g, " ")}
                        {r.occasionPersonName && ` — ${r.occasionPersonName}`}
                      </div>
                    )}

                    {menuCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Menu: {r.selectedMenuItems!.slice(0, 3).join(", ")}
                        {menuCount > 3 ? ` +${menuCount - 3} more` : ""}
                      </div>
                    )}

                    {r.telecallerName && (
                      <div className="text-xs text-muted-foreground">
                        Telecaller: {r.telecallerName}
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedCell && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  data-testid="calendar-add-another"
                  onClick={() => openAdd(selectedCell.day, selectedCell.slot)}
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
