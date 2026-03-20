"use client";

import { Loader2 } from "lucide-react";
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
import type { SpecialOccasionFormData } from "../types";

interface SpecialOccasionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSpecialOccasion: boolean;
  specialOccasionForm: SpecialOccasionFormData;
  setSpecialOccasionForm: (form: SpecialOccasionFormData) => void;
  savingSpecialOccasion: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SpecialOccasionDialog({
  open,
  onOpenChange,
  editingSpecialOccasion,
  specialOccasionForm,
  setSpecialOccasionForm,
  savingSpecialOccasion,
  onSubmit,
}: SpecialOccasionDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingSpecialOccasion
              ? t("donor_profile.edit_special_day_title")
              : t("donor_profile.add_special_day")}
          </DialogTitle>
          <DialogDescription>
            {editingSpecialOccasion
              ? t("donor_profile.update_special_day_desc")
              : t("donor_profile.new_special_day_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="so-type" className="text-right">
                {t("donor_profile.occasion_type")} *
              </Label>

              <Select
                value={specialOccasionForm.type}
                onValueChange={(value) =>
                  setSpecialOccasionForm({ ...specialOccasionForm, type: value })
                }
              >
                <SelectTrigger className="col-span-3" data-testid="select-special-occasion-type">
                  <SelectValue placeholder={t("donor_profile.select_type")} />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="DOB_SELF">{t("donor_profile.occasion_dob_self")}</SelectItem>
                  <SelectItem value="DOB_SPOUSE">{t("donor_profile.occasion_dob_spouse")}</SelectItem>
                  <SelectItem value="DOB_CHILD">{t("donor_profile.occasion_dob_child")}</SelectItem>
                  <SelectItem value="ANNIVERSARY">{t("donor_profile.occasion_anniversary")}</SelectItem>
                  <SelectItem value="DEATH_ANNIVERSARY">
                    {t("donor_profile.occasion_death_anniversary")}
                  </SelectItem>
                  <SelectItem value="OTHER">{t("common.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("donor_profile.day_month_label")} *</Label>

              <div className="col-span-3 flex gap-2">
                <Select
                  value={specialOccasionForm.day}
                  onValueChange={(value) =>
                    setSpecialOccasionForm({ ...specialOccasionForm, day: value })
                  }
                >
                  <SelectTrigger className="w-[100px]" data-testid="select-special-occasion-day">
                    <SelectValue placeholder={t("donor_profile.day")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={specialOccasionForm.month}
                  onValueChange={(value) =>
                    setSpecialOccasionForm({ ...specialOccasionForm, month: value })
                  }
                >
                  <SelectTrigger className="flex-1" data-testid="select-special-occasion-month">
                    <SelectValue placeholder={t("donor_profile.month")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="col-span-4 text-right text-xs text-muted-foreground">
                {t("donor_profile.year_not_collected")}
              </p>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="so-person" className="text-right">
                {t("donor_profile.person_name")}
              </Label>
              <Input
                id="so-person"
                value={specialOccasionForm.relatedPersonName || ""}
                onChange={(e) =>
                  setSpecialOccasionForm({ ...specialOccasionForm, relatedPersonName: e.target.value })
                }
                className="col-span-3"
                placeholder={t("donor_profile.person_name_placeholder")}
                data-testid="input-special-occasion-person"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="so-notes" className="text-right">
                {t("donor_profile.notes")}
              </Label>
              <Textarea
                id="so-notes"
                value={specialOccasionForm.notes || ""}
                onChange={(e) =>
                  setSpecialOccasionForm({ ...specialOccasionForm, notes: e.target.value })
                }
                className="col-span-3"
                placeholder={t("donor_profile.optional_notes")}
                data-testid="input-special-occasion-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>

            <Button type="submit" disabled={savingSpecialOccasion} data-testid="button-save-special-occasion">
              {savingSpecialOccasion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : editingSpecialOccasion ? (
                t("common.update")
              ) : (
                t("common.add")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
