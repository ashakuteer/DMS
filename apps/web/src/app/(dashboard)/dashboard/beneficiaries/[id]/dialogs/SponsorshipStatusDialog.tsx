"use client";

import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Sponsorship } from "../types";

interface SponsorshipStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusChangeSponsorship: Sponsorship | null;
  statusChangeData: {
    status: string;
    note: string;
  };
  setStatusChangeData: React.Dispatch<
    React.SetStateAction<{
      status: string;
      note: string;
    }>
  >;
  statusChangeLoading: boolean;
  onSubmit: () => void;
}

export default function SponsorshipStatusDialog({
  open,
  onOpenChange,
  statusChangeSponsorship,
  statusChangeData,
  setStatusChangeData,
  statusChangeLoading,
  onSubmit,
}: SponsorshipStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Sponsorship Status</DialogTitle>
          <DialogDescription>
            {statusChangeSponsorship && (
              <>
                Update sponsorship status for{" "}
                {statusChangeSponsorship.donor.firstName}{" "}
                {statusChangeSponsorship.donor.lastName || ""}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select
              value={statusChangeData.status}
              onValueChange={(v) =>
                setStatusChangeData((prev) => ({
                  ...prev,
                  status: v,
                }))
              }
            >
              <SelectTrigger data-testid="select-new-status">
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
              value={statusChangeData.note}
              onChange={(e) =>
                setStatusChangeData((prev) => ({
                  ...prev,
                  note: e.target.value,
                }))
              }
              data-testid="input-status-change-note"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-status-change"
          >
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={statusChangeLoading || !statusChangeData.status}
            data-testid="button-confirm-status-change"
          >
            {statusChangeLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
