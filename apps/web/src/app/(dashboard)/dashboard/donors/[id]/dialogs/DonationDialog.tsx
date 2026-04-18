"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Utensils } from "lucide-react";
import type { DonationFormData, DonationEmailType } from "../types";

export const MEAL_SPONSORSHIP_SENTINEL = "__MEAL_SPONSORSHIP__";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorName: string;
  editingDonation?: boolean;
  donationForm: DonationFormData;
  setDonationForm: (form: DonationFormData) => void;
  submittingDonation: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onOpenMealSponsorship?: () => void;
}

const IN_KIND_TYPES = new Set(["GROCERY", "MEDICINES", "PREPARED_FOOD", "USED_ITEMS", "KIND"]);

function isInKind(donationType: string): boolean {
  return IN_KIND_TYPES.has(donationType);
}

export default function DonationDialog({
  open,
  onOpenChange,
  donorName,
  editingDonation = false,
  donationForm,
  setDonationForm,
  submittingDonation,
  onSubmit,
  onOpenMealSponsorship,
}: DonationDialogProps) {
  const { t } = useTranslation();
  const kindDonation = isInKind(donationForm.donationType);
  const isMealSponsorshipChoice = donationForm.donationType === MEAL_SPONSORSHIP_SENTINEL;

  const CATEGORY_OPTIONS = [
    {
      group: t("donor_profile.financial_donations"),
      items: [{ value: "CASH", label: t("donor_profile.cash_donation") }],
    },
    {
      group: t("donor_profile.in_kind_donations"),
      items: [
        { value: "GROCERY", label: t("donor_profile.grocery") },
        { value: "MEDICINES", label: t("donor_profile.medicines") },
        { value: "PREPARED_FOOD", label: t("donor_profile.prepared_food") },
        { value: "USED_ITEMS", label: t("donor_profile.used_items") },
        { value: "KIND", label: t("donor_profile.in_kind_other") },
      ],
    },
    ...(onOpenMealSponsorship && !editingDonation
      ? [
          {
            group: "Meals",
            items: [{ value: MEAL_SPONSORSHIP_SENTINEL, label: "Meals Sponsorship" }],
          },
        ]
      : []),
  ];

  const RECEIPT_TYPE_OPTIONS: { value: DonationEmailType; label: string; description: string }[] = [
    {
      value: "GENERAL",
      label: t("donor_profile.receipt_general_label"),
      description: t("donor_profile.receipt_general_desc"),
    },
    {
      value: "TAX",
      label: t("donor_profile.receipt_tax_label"),
      description: t("donor_profile.receipt_tax_desc"),
    },
  ];

  const handleCategoryChange = (value: string) => {
    const kind = isInKind(value);
    setDonationForm({
      ...donationForm,
      donationType: value,
      donationMode: kind ? "" : (donationForm.donationMode || "CASH"),
      emailType: kind ? "KIND" : (donationForm.emailType === "KIND" ? "GENERAL" : donationForm.emailType),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingDonation ? t("donor_profile.edit_donation") : t("donor_profile.add_donation")}
          </DialogTitle>
          <DialogDescription>
            {editingDonation
              ? t("donor_profile.dialog_donation_edit_desc", { name: donorName })
              : t("donor_profile.dialog_donation_add_desc", { name: donorName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="donationType">{t("donor_profile.purpose_category")} *</Label>
              <Select value={donationForm.donationType} onValueChange={handleCategoryChange}>
                <SelectTrigger data-testid="select-donation-type">
                  <SelectValue placeholder={t("donor_profile.select_donation_category")} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.group}
                      </div>
                      {group.items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {donationForm.donationType && !isMealSponsorshipChoice && (
                <div
                  className={[
                    "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
                    kindDonation
                      ? "bg-[#E6F4F1] text-[#5FA8A8] border border-[#5FA8A8]"
                      : "bg-blue-50 text-blue-700 border border-blue-200",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-1.5 h-1.5 rounded-full",
                      kindDonation ? "bg-[#E6F4F1]0" : "bg-blue-500",
                    ].join(" ")}
                  />
                  {kindDonation
                    ? t("donor_profile.in_kind_indicator")
                    : t("donor_profile.financial_indicator")}
                </div>
              )}
            </div>

            {isMealSponsorshipChoice ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 space-y-3">
                <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                  <Utensils className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Meals Sponsorship uses a dedicated form</p>
                    <p className="opacity-90">
                      To book meals you'll pick the meal date, slots (breakfast/lunch/snacks/dinner),
                      home(s), payment status, and (optionally) an occasion that links to People &amp;
                      Occasions automatically.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => onOpenMealSponsorship?.()}
                  data-testid="button-open-meal-sponsorship"
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  Open Meal Sponsorship Form
                </Button>
              </div>
            ) : (
            <>
            <div className="space-y-2">
              <Label htmlFor="designatedHome">{t("donor_profile.designated_home")}</Label>
              <Select
                value={donationForm.designatedHome || "NONE"}
                onValueChange={(value) =>
                  setDonationForm({ ...donationForm, designatedHome: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("donor_profile.select_home")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t("donor_profile.home_none_general")}</SelectItem>
                  <SelectItem value="GIRLS_HOME">{t("donor_profile.home_girls_home")}</SelectItem>
                  <SelectItem value="BLIND_BOYS_HOME">{t("donor_profile.home_blind_boys")}</SelectItem>
                  <SelectItem value="OLD_AGE_HOME">{t("donor_profile.home_old_age")}</SelectItem>
                  <SelectItem value="GENERAL">{t("donor_profile.home_general")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!kindDonation ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="donationAmount">{t("donor_profile.donation_amount_inr")} *</Label>
                  <Input
                    id="donationAmount"
                    type="number"
                    placeholder={t("donor_profile.enter_amount")}
                    min="1"
                    value={donationForm.donationAmount}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, donationAmount: e.target.value })
                    }
                    data-testid="input-donation-amount"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donationMode">{t("donor_profile.payment_mode")} *</Label>
                  <Select
                    value={donationForm.donationMode}
                    onValueChange={(value) =>
                      setDonationForm({ ...donationForm, donationMode: value })
                    }
                  >
                    <SelectTrigger data-testid="select-donation-mode">
                      <SelectValue placeholder={t("donor_profile.select_payment_mode")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">{t("donor_profile.mode_cash")}</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="GPAY">Google Pay</SelectItem>
                      <SelectItem value="PHONEPE">PhonePe</SelectItem>
                      <SelectItem value="BANK_TRANSFER">{t("donor_profile.mode_bank_transfer")}</SelectItem>
                      <SelectItem value="CHEQUE">{t("donor_profile.mode_cheque")}</SelectItem>
                      <SelectItem value="ONLINE">{t("donor_profile.mode_online")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="donationAmount">
                  {t("donor_profile.estimated_value")}{" "}
                  <span className="text-muted-foreground font-normal">({t("donor_profile.optional_label")})</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    id="donationAmount"
                    type="number"
                    placeholder={t("donor_profile.estimated_value_inr")}
                    min="0"
                    className="pl-7"
                    value={donationForm.donationAmount}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, donationAmount: e.target.value })
                    }
                    data-testid="input-donation-amount"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="donationDate">{t("donor_profile.date_label")} *</Label>
              <Input
                id="donationDate"
                type="date"
                value={donationForm.donationDate}
                onChange={(e) =>
                  setDonationForm({ ...donationForm, donationDate: e.target.value })
                }
                data-testid="input-donation-date"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">{t("donor_profile.notes")}</Label>
              <Textarea
                id="remarks"
                placeholder={
                  kindDonation
                    ? t("donor_profile.in_kind_notes_placeholder")
                    : t("donor_profile.donation_notes_placeholder")
                }
                value={donationForm.remarks}
                onChange={(e) =>
                  setDonationForm({ ...donationForm, remarks: e.target.value })
                }
                data-testid="input-donation-remarks"
                rows={2}
              />
            </div>

            {!kindDonation && (
              <div className="space-y-2 pt-1">
                <Label>{t("donor_profile.receipt_type")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RECEIPT_TYPE_OPTIONS.map((option) => {
                    const isSelected = (donationForm.emailType || "GENERAL") === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={`receipt-type-${option.value.toLowerCase()}`}
                        onClick={() =>
                          setDonationForm({ ...donationForm, emailType: option.value })
                        }
                        className={[
                          "text-left rounded-md border px-3 py-2.5 text-xs transition-all cursor-pointer",
                          isSelected
                            ? "border-[#243A5E] bg-[#243A5E]/5 text-[#243A5E]"
                            : "border-border bg-background text-muted-foreground hover:border-[#243A5E]/40",
                        ].join(" ")}
                      >
                        <div className="font-semibold mb-0.5">{option.label}</div>
                        <div className="opacity-70 leading-snug">{option.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {kindDonation && (
              <div className="rounded-md bg-[#E6F4F1] border border-[#5FA8A8] px-3 py-2.5 text-xs text-[#5FA8A8]">
                <span className="font-semibold">{t("donor_profile.acknowledgement")}</span>{" "}
                {t("donor_profile.in_kind_auto_ack")}
              </div>
            )}
            </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submittingDonation}
            >
              {t("common.cancel")}
            </Button>
            {!isMealSponsorshipChoice && (
              <Button
                type="submit"
                disabled={submittingDonation}
                data-testid="button-submit-donation"
              >
                {submittingDonation
                  ? t("common.saving")
                  : editingDonation
                    ? t("donor_profile.update_donation")
                    : t("donor_profile.save_donation")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
