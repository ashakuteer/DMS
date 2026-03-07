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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-cancel-pledge">
        <DialogHeader>
          <DialogTitle>Cancel Pledge</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this pledge? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cancel-reason" className="text-right">
              Reason *
            </Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="col-span-3"
              placeholder="Why is this pledge being cancelled?"
              data-testid="input-cancel-reason"
            />
          </div>

          <p className="text-sm text-destructive">
            This action cannot be undone. The pledge will be permanently marked
            as cancelled.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-dismiss"
          >
            Go Back
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
                Cancelling...
              </>
            ) : (
              "Confirm Cancel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
