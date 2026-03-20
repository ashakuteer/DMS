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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface FulfillFormData {
  autoCreateDonation: boolean;
  donationAmount: string;
  donationDate: string;
  donationMode: string;
  remarks: string;
}

interface FulfillPledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fulfillForm: FulfillFormData;
  setFulfillForm: (form: FulfillFormData) => void;
  pledgeActionLoading: string | null;
  onConfirm: () => void;
}

export default function FulfillPledgeDialog({
  open,
  onOpenChange,
  fulfillForm,
  setFulfillForm,
  pledgeActionLoading,
  onConfirm,
}: FulfillPledgeDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-fulfill-pledge">
        <DialogHeader>
          <DialogTitle>{t("donor_profile.fulfill_pledge")}</DialogTitle>
          <DialogDescription>
            {t("donor_profile.fulfill_pledge_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fulfill-auto-donation">
              {t("donor_profile.auto_create_donation")}
            </Label>
            <Switch
              id="fulfill-auto-donation"
              checked={fulfillForm.autoCreateDonation}
              onCheckedChange={(checked) =>
                setFulfillForm({ ...fulfillForm, autoCreateDonation: checked })
              }
              data-testid="switch-fulfill-auto-donation"
            />
          </div>

          {fulfillForm.autoCreateDonation && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-amount" className="text-right">
                  {t("donor_profile.amount_label")}
                </Label>
                <Input
                  id="fulfill-amount"
                  type="number"
                  value={fulfillForm.donationAmount}
                  onChange={(e) =>
                    setFulfillForm({ ...fulfillForm, donationAmount: e.target.value })
                  }
                  className="col-span-3"
                  placeholder={t("donor_profile.donation_amount_placeholder")}
                  data-testid="input-fulfill-amount"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-date" className="text-right">
                  {t("donor_profile.date_label")}
                </Label>
                <Input
                  id="fulfill-date"
                  type="date"
                  value={fulfillForm.donationDate}
                  onChange={(e) =>
                    setFulfillForm({ ...fulfillForm, donationDate: e.target.value })
                  }
                  className="col-span-3"
                  data-testid="input-fulfill-date"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-mode" className="text-right">
                  {t("donor_profile.payment_mode")}
                </Label>
                <Select
                  value={fulfillForm.donationMode}
                  onValueChange={(value) =>
                    setFulfillForm({ ...fulfillForm, donationMode: value })
                  }
                >
                  <SelectTrigger className="col-span-3" data-testid="select-fulfill-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">{t("donor_profile.mode_cash")}</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">{t("donor_profile.mode_bank_transfer")}</SelectItem>
                    <SelectItem value="CHEQUE">{t("donor_profile.mode_cheque")}</SelectItem>
                    <SelectItem value="ONLINE">{t("donor_profile.mode_online")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-remarks" className="text-right">
                  {t("donor_profile.remarks_label")}
                </Label>
                <Textarea
                  id="fulfill-remarks"
                  value={fulfillForm.remarks}
                  onChange={(e) =>
                    setFulfillForm({ ...fulfillForm, remarks: e.target.value })
                  }
                  className="col-span-3"
                  placeholder={t("donor_profile.optional_remarks")}
                  data-testid="input-fulfill-remarks"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-fulfill-cancel"
          >
            {t("common.cancel")}
          </Button>

          <Button
            onClick={onConfirm}
            disabled={!!pledgeActionLoading}
            data-testid="button-fulfill-confirm"
          >
            {pledgeActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("donor_profile.fulfilling")}
              </>
            ) : (
              t("donor_profile.confirm_fulfill")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
