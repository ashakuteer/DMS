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
import type { PledgeFormData } from "../types";

interface PledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPledge: boolean;
  pledgeForm: PledgeFormData;
  setPledgeForm: (form: PledgeFormData) => void;
  savingPledge: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PledgeDialog({
  open,
  onOpenChange,
  editingPledge,
  pledgeForm,
  setPledgeForm,
  savingPledge,
  onSubmit,
}: PledgeDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPledge ? t("donor_profile.edit_pledge_title") : t("donor_profile.add_pledge")}
          </DialogTitle>
          <DialogDescription>
            {editingPledge
              ? t("donor_profile.update_pledge_desc")
              : t("donor_profile.new_pledge_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pledge-type" className="text-right">
                {t("donor_profile.pledge_type_label")} *
              </Label>
              <Select
                value={pledgeForm.pledgeType}
                onValueChange={(value) =>
                  setPledgeForm({ ...pledgeForm, pledgeType: value })
                }
              >
                <SelectTrigger className="col-span-3" data-testid="select-pledge-type">
                  <SelectValue placeholder={t("donor_profile.select_type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONEY">{t("donor_profile.pledge_money")}</SelectItem>
                  <SelectItem value="RICE">{t("donor_profile.pledge_rice")}</SelectItem>
                  <SelectItem value="GROCERIES">{t("donor_profile.grocery")}</SelectItem>
                  <SelectItem value="MEDICINES">{t("donor_profile.medicines")}</SelectItem>
                  <SelectItem value="MEAL_SPONSOR">{t("donor_profile.pledge_meal_sponsor")}</SelectItem>
                  <SelectItem value="VISIT">{t("donor_profile.timeline_visits")}</SelectItem>
                  <SelectItem value="OTHER">{t("common.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pledgeForm.pledgeType === "MONEY" ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledge-amount" className="text-right">
                  {t("donor_profile.amount_label")} *
                </Label>
                <Input
                  id="pledge-amount"
                  type="number"
                  value={pledgeForm.amount}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, amount: e.target.value })
                  }
                  className="col-span-3"
                  placeholder={t("donor_profile.enter_amount")}
                  data-testid="input-pledge-amount"
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledge-quantity" className="text-right">
                  {t("donor_profile.quantity")}
                </Label>
                <Input
                  id="pledge-quantity"
                  value={pledgeForm.quantity}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, quantity: e.target.value })
                  }
                  className="col-span-3"
                  placeholder={t("donor_profile.quantity_placeholder")}
                  data-testid="input-pledge-quantity"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pledge-date" className="text-right">
                {t("donor_profile.expected_date")} *
              </Label>
              <Input
                id="pledge-date"
                type="date"
                value={pledgeForm.expectedFulfillmentDate}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, expectedFulfillmentDate: e.target.value })
                }
                className="col-span-3"
                data-testid="input-pledge-date"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pledge-notes" className="text-right">
                {t("donor_profile.notes")}
              </Label>
              <Textarea
                id="pledge-notes"
                value={pledgeForm.notes}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, notes: e.target.value })
                }
                className="col-span-3"
                placeholder={t("donor_profile.pledge_notes_placeholder")}
                data-testid="input-pledge-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>

            <Button type="submit" disabled={savingPledge} data-testid="button-save-pledge">
              {savingPledge ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : editingPledge ? (
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
