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
  };
}

// ── BoolToggle ────────────────────────────────────────────────────────────────

function BoolToggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        data-testid={`pm-checkbox-${id}`}
      />
      <Label htmlFor={id} className="text-sm font-normal cursor-pointer">
        {label}
      </Label>
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
    };
    if (form.mealCompletedAt) payload.mealCompletedAt = form.mealCompletedAt;
    if (form.donorVisitNotes.trim()) payload.donorVisitNotes = form.donorVisitNotes.trim();
    if (form.postMealAmountReceived !== "")
      payload.postMealAmountReceived = parseFloat(form.postMealAmountReceived);
    if (form.promiseNotes.trim()) payload.promiseNotes = form.promiseNotes.trim();
    if (form.extraItemNotes.trim()) payload.extraItemNotes = form.extraItemNotes.trim();
    if (form.extraItemEstimatedValue !== "")
      payload.extraItemEstimatedValue = parseFloat(form.extraItemEstimatedValue);
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
          <BoolToggle id="mealCompleted" checked={form.mealCompleted} onChange={(v) => set("mealCompleted", v)} label="Meal was completed" />
          {form.mealCompleted && (
            <div className="space-y-1 pl-6 pt-1">
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
          <BoolToggle id="donorVisited" checked={form.donorVisited} onChange={(v) => set("donorVisited", v)} label="Donor visited" />
          {form.donorVisited && (
            <div className="pl-6 pt-1">
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
          <BoolToggle id="balancePaidAfterMeal" checked={form.balancePaidAfterMeal} onChange={(v) => set("balancePaidAfterMeal", v)} label="Balance paid after meal" />
          <div className="space-y-1">
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
          <BoolToggle id="promiseMade" checked={form.promiseMade} onChange={(v) => set("promiseMade", v)} label="Promise made by donor" />
          {form.promiseMade && (
            <div className="pl-6 pt-1">
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
          <BoolToggle id="extraItemsGiven" checked={form.extraItemsGiven} onChange={(v) => set("extraItemsGiven", v)} label="Donor brought extra items" />
          {form.extraItemsGiven && (
            <div className="pl-6 space-y-2 pt-1">
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
          <BoolToggle id="thankYouSent" checked={form.thankYouSent} onChange={(v) => set("thankYouSent", v)} label="Thank-you sent" />
          <BoolToggle id="reviewRequested" checked={form.reviewRequested} onChange={(v) => set("reviewRequested", v)} label="Review requested from donor" />
          <BoolToggle id="askedToSendHi" checked={form.askedToSendHi} onChange={(v) => set("askedToSendHi", v)} label='Asked donor to send "Hi" to 9700711700' />

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
