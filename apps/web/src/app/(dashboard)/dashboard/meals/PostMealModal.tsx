"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────────────────────

const EXTRA_ITEM_TYPES = [
  "Sweets",
  "Fruits",
  "Groceries",
  "Biscuits / Snacks",
  "Clothes",
  "Medicines",
  "Stationery",
  "Toiletries",
  "Other",
];

const CANCELLATION_BY_OPTIONS = [
  { value: "OUR_SIDE", label: "Our side" },
  { value: "DONOR_SIDE", label: "Donor side" },
  { value: "OTHER", label: "Other" },
];

// ── Types ────────────────────────────────────────────────────────────────────

export interface PostMealMeal {
  id: string;
  totalAmount?: string | null;
  amountReceived?: string;
  postMealAmountReceived?: string | null;
  paymentType?: string;
  mealServiceDate: string;
  donor: { firstName: string; lastName: string; donorCode: string };
  // existing post-meal values (for re-open / edit)
  mealCompleted?: boolean | null;
  mealCompletedAt?: string | null;
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
  // Phase 3B
  mealCancelled?: boolean | null;
  cancellationBy?: string | null;
  cancellationReason?: string | null;
  amountReturned?: boolean | null;
  refundAmount?: string | null;
  refundDate?: string | null;
  refundNotes?: string | null;
}

interface PostMealFormState {
  mealCompleted: boolean;
  mealCompletedAt: string;
  donorVisited: boolean;
  donorVisitNotes: string;
  balancePaidAfterMeal: boolean;
  postMealAmountReceived: string;
  promiseMade: boolean;
  promiseNotes: string;
  thankYouSent: boolean;
  reviewRequested: boolean;
  askedToSendHi: boolean;
  extraItemsGiven: boolean;
  extraItemTypes: string[];
  extraItemNotes: string;
  extraItemEstimatedValue: string;
  // Phase 3B
  mealCancelled: boolean;
  cancellationBy: string;
  cancellationReason: string;
  amountReturned: boolean;
  refundAmount: string;
  refundDate: string;
  refundNotes: string;
}

function buildInitialState(meal: PostMealMeal): PostMealFormState {
  return {
    mealCompleted: meal.mealCompleted ?? false,
    mealCompletedAt: meal.mealCompletedAt
      ? new Date(meal.mealCompletedAt).toISOString().slice(0, 16)
      : "",
    donorVisited: meal.donorVisited ?? false,
    donorVisitNotes: meal.donorVisitNotes ?? "",
    balancePaidAfterMeal: meal.balancePaidAfterMeal ?? false,
    postMealAmountReceived: meal.postMealAmountReceived
      ? String(Number(meal.postMealAmountReceived))
      : "",
    promiseMade: meal.promiseMade ?? false,
    promiseNotes: meal.promiseNotes ?? "",
    thankYouSent: meal.thankYouSent ?? false,
    reviewRequested: meal.reviewRequested ?? false,
    askedToSendHi: meal.askedToSendHi ?? false,
    extraItemsGiven: meal.extraItemsGiven ?? false,
    extraItemTypes: meal.extraItemTypes ?? [],
    extraItemNotes: meal.extraItemNotes ?? "",
    extraItemEstimatedValue: meal.extraItemEstimatedValue
      ? String(Number(meal.extraItemEstimatedValue))
      : "",
    // Phase 3B
    mealCancelled: meal.mealCancelled ?? false,
    cancellationBy: meal.cancellationBy ?? "",
    cancellationReason: meal.cancellationReason ?? "",
    amountReturned: meal.amountReturned ?? false,
    refundAmount: meal.refundAmount ? String(Number(meal.refundAmount)) : "",
    refundDate: meal.refundDate
      ? new Date(meal.refundDate).toISOString().slice(0, 10)
      : "",
    refundNotes: meal.refundNotes ?? "",
  };
}

// ── YesNo Button Toggle ──────────────────────────────────────────────────────

function YesNo({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-sm" id={`yn-label-${id}`}>{label}</span>
      <div className="flex rounded-md border overflow-hidden flex-shrink-0" role="group" aria-labelledby={`yn-label-${id}`}>
        <button
          type="button"
          data-testid={`pm-no-${id}`}
          onClick={() => onChange(false)}
          className={cn(
            "px-3 py-1 text-xs font-medium transition-colors border-r",
            !value
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          No
        </button>
        <button
          type="button"
          data-testid={`pm-yes-${id}`}
          onClick={() => onChange(true)}
          className={cn(
            "px-3 py-1 text-xs font-medium transition-colors",
            value
              ? "bg-green-50 text-green-700"
              : "bg-background text-muted-foreground hover:bg-muted"
          )}
        >
          Yes
        </button>
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1 mb-2 mt-4">
      {children}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  meal: PostMealMeal | null;
  open: boolean;
  onClose: () => void;
}

export function PostMealModal({ meal, open, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PostMealFormState | null>(null);

  useEffect(() => {
    if (meal) setForm(buildInitialState(meal));
  }, [meal]);

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetchWithAuth(`/api/meals/${meal!.id}/post-meal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to save post-meal data");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meals/pending-actions"] });
      toast({ title: "Post-meal update saved" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (!meal || !form) return null;

  const total = meal.totalAmount != null ? Number(meal.totalAmount) : 0;
  const alreadyReceived = Number(meal.amountReceived ?? 0);
  const postMealAmt = parseFloat(form.postMealAmountReceived) || 0;
  const effectiveReceived = alreadyReceived + postMealAmt;
  const effectiveBalance = Math.max(0, total - effectiveReceived);

  function set<K extends keyof PostMealFormState>(key: K, val: PostMealFormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  function toggleExtraType(type: string) {
    setForm((prev) => {
      if (!prev) return prev;
      const has = prev.extraItemTypes.includes(type);
      return {
        ...prev,
        extraItemTypes: has
          ? prev.extraItemTypes.filter((t) => t !== type)
          : [...prev.extraItemTypes, type],
      };
    });
  }

  function handleSubmit() {
    if (!form) return;
    const payload: Record<string, unknown> = {
      mealCompleted: form.mealCompleted,
      donorVisited: form.donorVisited,
      balancePaidAfterMeal: form.balancePaidAfterMeal,
      promiseMade: form.promiseMade,
      thankYouSent: form.thankYouSent,
      reviewRequested: form.reviewRequested,
      askedToSendHi: form.askedToSendHi,
      extraItemsGiven: form.extraItemsGiven,
      extraItemTypes: form.extraItemTypes,
      // Phase 3B
      mealCancelled: form.mealCancelled,
      amountReturned: form.amountReturned,
    };
    if (form.mealCompletedAt) payload.mealCompletedAt = form.mealCompletedAt;
    if (form.donorVisitNotes.trim()) payload.donorVisitNotes = form.donorVisitNotes.trim();
    if (form.postMealAmountReceived !== "")
      payload.postMealAmountReceived = parseFloat(form.postMealAmountReceived);
    if (form.promiseNotes.trim()) payload.promiseNotes = form.promiseNotes.trim();
    if (form.extraItemNotes.trim()) payload.extraItemNotes = form.extraItemNotes.trim();
    if (form.extraItemEstimatedValue !== "")
      payload.extraItemEstimatedValue = parseFloat(form.extraItemEstimatedValue);

    // Cancellation detail fields (only when mealCancelled = true)
    if (form.mealCancelled) {
      if (form.cancellationBy) payload.cancellationBy = form.cancellationBy;
      if (form.cancellationReason.trim()) payload.cancellationReason = form.cancellationReason.trim();
    } else {
      // clear cancellation detail if toggled off
      payload.cancellationBy = null;
      payload.cancellationReason = null;
    }

    // Refund detail fields (only when amountReturned = true)
    if (form.amountReturned) {
      if (form.refundAmount !== "") payload.refundAmount = parseFloat(form.refundAmount);
      if (form.refundDate) payload.refundDate = form.refundDate;
      if (form.refundNotes.trim()) payload.refundNotes = form.refundNotes.trim();
    } else {
      // clear refund details if toggled off
      payload.refundAmount = null;
      payload.refundDate = null;
      payload.refundNotes = null;
    }

    mutation.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Post-Meal Update
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {meal.donor.firstName} {meal.donor.lastName} ·{" "}
            {new Date(meal.mealServiceDate).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            })}
          </p>
        </DialogHeader>

        <div className="space-y-1 pb-1">

          {/* A. Meal Completion */}
          <SectionHead>A · Meal Completion</SectionHead>
          <YesNo id="mealCompleted" value={form.mealCompleted} onChange={(v) => set("mealCompleted", v)} label="Meal was completed" />
          {form.mealCompleted && (
            <div className="space-y-1 pl-2 pt-1">
              <Label className="text-xs text-muted-foreground">Completed at (optional)</Label>
              <Input
                type="datetime-local"
                value={form.mealCompletedAt}
                onChange={(e) => set("mealCompletedAt", e.target.value)}
                data-testid="pm-input-completedAt"
                className="text-sm"
              />
            </div>
          )}

          {/* B. Donor Visit */}
          <SectionHead>B · Donor Visit</SectionHead>
          <YesNo id="donorVisited" value={form.donorVisited} onChange={(v) => set("donorVisited", v)} label="Donor visited" />
          {form.donorVisited && (
            <div className="pl-2 pt-1">
              <Textarea
                placeholder="Visit notes (optional)"
                value={form.donorVisitNotes}
                onChange={(e) => set("donorVisitNotes", e.target.value)}
                rows={2}
                data-testid="pm-textarea-visitNotes"
                className="text-sm"
              />
            </div>
          )}

          {/* C. Balance / Payment */}
          <SectionHead>C · Balance & Payment</SectionHead>
          {total > 0 && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 space-y-0.5">
              <div>Original received: ₹{alreadyReceived.toLocaleString("en-IN")}</div>
              {postMealAmt > 0 && <div>Post-meal: +₹{postMealAmt.toLocaleString("en-IN")}</div>}
              <div className={effectiveBalance > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                Effective balance: ₹{effectiveBalance.toLocaleString("en-IN")}
              </div>
            </div>
          )}
          <YesNo id="balancePaidAfterMeal" value={form.balancePaidAfterMeal} onChange={(v) => set("balancePaidAfterMeal", v)} label="Balance paid after meal" />
          <div className="space-y-1 pt-1">
            <Label className="text-xs text-muted-foreground">Additional amount received after meal (₹)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={form.postMealAmountReceived}
              onChange={(e) => set("postMealAmountReceived", e.target.value)}
              placeholder="0"
              data-testid="pm-input-postMealAmt"
              className="text-sm"
            />
          </div>

          {/* D. Promise */}
          <SectionHead>D · Promise</SectionHead>
          <YesNo id="promiseMade" value={form.promiseMade} onChange={(v) => set("promiseMade", v)} label="Promise made by donor" />
          {form.promiseMade && (
            <div className="pl-2 pt-1">
              <Textarea
                placeholder="Promise notes"
                value={form.promiseNotes}
                onChange={(e) => set("promiseNotes", e.target.value)}
                rows={2}
                data-testid="pm-textarea-promiseNotes"
                className="text-sm"
              />
            </div>
          )}

          {/* E. Extra Items */}
          <SectionHead>E · Extra Items Given</SectionHead>
          <YesNo id="extraItemsGiven" value={form.extraItemsGiven} onChange={(v) => set("extraItemsGiven", v)} label="Donor brought extra items" />
          {form.extraItemsGiven && (
            <div className="pl-2 space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {EXTRA_ITEM_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      id={`extra-${type}`}
                      checked={form.extraItemTypes.includes(type)}
                      onCheckedChange={() => toggleExtraType(type)}
                      data-testid={`pm-checkbox-extra-${type.replace(/\s+/g, "-")}`}
                    />
                    <Label htmlFor={`extra-${type}`} className="text-sm font-normal cursor-pointer">{type}</Label>
                  </div>
                ))}
              </div>
              <Textarea
                placeholder="Extra item notes (optional)"
                value={form.extraItemNotes}
                onChange={(e) => set("extraItemNotes", e.target.value)}
                rows={2}
                data-testid="pm-textarea-extraNotes"
                className="text-sm"
              />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Estimated value (₹, optional)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.extraItemEstimatedValue}
                  onChange={(e) => set("extraItemEstimatedValue", e.target.value)}
                  placeholder="0"
                  data-testid="pm-input-extraValue"
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* F. Follow-up Actions */}
          <SectionHead>F · Follow-up Actions</SectionHead>
          <YesNo id="thankYouSent" value={form.thankYouSent} onChange={(v) => set("thankYouSent", v)} label="Thank-you sent" />
          <YesNo id="reviewRequested" value={form.reviewRequested} onChange={(v) => set("reviewRequested", v)} label="Review requested from donor" />
          <YesNo id="askedToSendHi" value={form.askedToSendHi} onChange={(v) => set("askedToSendHi", v)} label='Asked donor to send "Hi" to 9700711700' />

          {/* G. Cancellation / Refund */}
          <SectionHead>G · Cancellation / Refund</SectionHead>
          <YesNo id="mealCancelled" value={form.mealCancelled} onChange={(v) => set("mealCancelled", v)} label="Was meal cancelled?" />

          {form.mealCancelled && (
            <div className="pl-2 space-y-3 pt-1">
              {/* Cancelled by */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cancelled by</Label>
                <div className="flex gap-2 flex-wrap">
                  {CANCELLATION_BY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid={`pm-cancelby-${opt.value}`}
                      onClick={() => set("cancellationBy", form.cancellationBy === opt.value ? "" : opt.value)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                        form.cancellationBy === opt.value
                          ? "bg-orange-100 text-orange-800 border-orange-300"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cancellation reason */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cancellation reason (optional)</Label>
                <Textarea
                  placeholder="Describe why the meal was cancelled..."
                  value={form.cancellationReason}
                  onChange={(e) => set("cancellationReason", e.target.value)}
                  rows={2}
                  data-testid="pm-textarea-cancellationReason"
                  className="text-sm"
                />
              </div>

              {/* Amount returned */}
              <YesNo id="amountReturned" value={form.amountReturned} onChange={(v) => set("amountReturned", v)} label="Was amount returned / refunded?" />

              {form.amountReturned && (
                <div className="pl-2 space-y-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Refund amount (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.refundAmount}
                      onChange={(e) => set("refundAmount", e.target.value)}
                      placeholder="0"
                      data-testid="pm-input-refundAmount"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Refund date</Label>
                    <Input
                      type="date"
                      value={form.refundDate}
                      onChange={(e) => set("refundDate", e.target.value)}
                      data-testid="pm-input-refundDate"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Refund notes (optional)</Label>
                    <Textarea
                      placeholder="e.g. Refunded via UPI to donor"
                      value={form.refundNotes}
                      onChange={(e) => set("refundNotes", e.target.value)}
                      rows={2}
                      data-testid="pm-textarea-refundNotes"
                      className="text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending} data-testid="pm-button-save">
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Post-Meal Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
