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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CancelPledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelReason: string;
  setCancelReason: (value: string) => void;
  pledgeActionLoading: string | null;
  onConfirm: () => void;
}

export default function CancelPledgeDialog({
  open,
  onOpenChange,
  cancelReason,
  setCancelReason,
  pledgeActionLoading,
  onConfirm,
}: CancelPledgeDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-cancel-pledge">
        <DialogHeader>
          <DialogTitle>{t("donor_profile.cancel_pledge")}</DialogTitle>
          <DialogDescription>
            {t("donor_profile.cancel_pledge_confirm_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cancel-reason" className="text-right">
              {t("donor_profile.cancel_reason")} *
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="col-span-3"
              placeholder={t("donor_profile.cancel_reason_placeholder")}
              data-testid="input-cancel-reason"
            />
          </div>

          <p className="text-sm text-destructive">
            {t("donor_profile.cancel_permanent_warning")}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-dismiss"
          >
            {t("donor_profile.go_back")}
          </Button>

          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!!pledgeActionLoading || !cancelReason.trim()}
            data-testid="button-cancel-confirm"
          >
            {pledgeActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("donor_profile.cancelling")}
              </>
            ) : (
              t("donor_profile.confirm_cancel")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
