"use client";

import { Loader2 } from "lucide-react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Sponsorship Status</DialogTitle>
          <DialogDescription>
            {sponsorStatusTarget && (
              <>
                Update sponsorship status for{" "}
                {sponsorStatusTarget.beneficiary.fullName}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Status</Label>
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="STOPPED">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Reason for status change..."
              value={sponsorStatusData.note}
              onChange={(e) =>
                setSponsorStatusData({
                  ...sponsorStatusData,
                  note: e.target.value,
                })
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
            Cancel
          </Button>

          <Button
            onClick={onConfirm}
            disabled={sponsorStatusLoading || !sponsorStatusData.status}
            data-testid="button-confirm-donor-sponsorship-status"
          >
            {sponsorStatusLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
