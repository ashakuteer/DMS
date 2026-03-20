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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SponsoredBeneficiary } from "../types";

interface SponsorStatusData {
  status: string;
  note: string;
}

interface SponsorStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsorStatusTarget: SponsoredBeneficiary | null;
  sponsorStatusData: SponsorStatusData;
  setSponsorStatusData: (data: SponsorStatusData) => void;
  sponsorStatusLoading: boolean;
  onConfirm: () => void;
}

export default function SponsorStatusDialog({
  open,
  onOpenChange,
  sponsorStatusTarget,
  sponsorStatusData,
  setSponsorStatusData,
  sponsorStatusLoading,
  onConfirm,
}: SponsorStatusDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("donor_profile.change_status_title")}</DialogTitle>
          <DialogDescription>
            {sponsorStatusTarget && (
              t("donor_profile.update_status_for", { name: sponsorStatusTarget.beneficiary.fullName })
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t("donor_profile.new_status")}</Label>
            <Select
              value={sponsorStatusData.status}
              onValueChange={(v) =>
                setSponsorStatusData({ ...sponsorStatusData, status: v })
              }
            >
              <SelectTrigger data-testid="select-donor-sponsorship-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("donor_profile.status_active")}</SelectItem>
                <SelectItem value="PAUSED">{t("donor_profile.status_paused")}</SelectItem>
                <SelectItem value="COMPLETED">{t("donor_profile.status_completed")}</SelectItem>
                <SelectItem value="STOPPED">{t("donor_profile.status_stopped")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("donor_profile.note_optional")}</Label>
            <Textarea
              placeholder={t("donor_profile.status_change_reason")}
              value={sponsorStatusData.note}
              onChange={(e) =>
                setSponsorStatusData({ ...sponsorStatusData, note: e.target.value })
              }
              data-testid="input-donor-sponsorship-status-note"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-donor-sponsorship-status"
          >
            {t("common.cancel")}
          </Button>

          <Button
            onClick={onConfirm}
            disabled={sponsorStatusLoading || !sponsorStatusData.status}
            data-testid="button-confirm-donor-sponsorship-status"
          >
            {sponsorStatusLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            {t("donor_profile.update_status")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
