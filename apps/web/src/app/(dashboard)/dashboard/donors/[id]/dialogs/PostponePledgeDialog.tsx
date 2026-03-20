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
import { Textarea } from "@/components/ui/textarea";

interface PostponeFormData {
  newDate: string;
  notes: string;
}

interface PostponePledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postponeForm: PostponeFormData;
  setPostponeForm: (form: PostponeFormData) => void;
  pledgeActionLoading: string | null;
  onConfirm: () => void;
}

export default function PostponePledgeDialog({
  open,
  onOpenChange,
  postponeForm,
  setPostponeForm,
  pledgeActionLoading,
  onConfirm,
}: PostponePledgeDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-postpone-pledge">
        <DialogHeader>
          <DialogTitle>{t("donor_profile.postpone_pledge")}</DialogTitle>
          <DialogDescription>
            {t("donor_profile.postpone_pledge_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="postpone-date" className="text-right">
              {t("donor_profile.new_date")} *
            </Label>
            <Input
              id="postpone-date"
              type="date"
              value={postponeForm.newDate}
              onChange={(e) =>
                setPostponeForm({ ...postponeForm, newDate: e.target.value })
              }
              className="col-span-3"
              data-testid="input-postpone-date"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="postpone-notes" className="text-right">
              {t("donor_profile.postpone_reason")}
            </Label>
            <Textarea
              id="postpone-notes"
              value={postponeForm.notes}
              onChange={(e) =>
                setPostponeForm({ ...postponeForm, notes: e.target.value })
              }
              className="col-span-3"
              placeholder={t("donor_profile.postpone_reason_placeholder")}
              data-testid="input-postpone-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-postpone-cancel"
          >
            {t("common.cancel")}
          </Button>

          <Button
            onClick={onConfirm}
            disabled={!!pledgeActionLoading || !postponeForm.newDate}
            data-testid="button-postpone-confirm"
          >
            {pledgeActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("donor_profile.postponing")}
              </>
            ) : (
              t("donor_profile.confirm_postpone")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
