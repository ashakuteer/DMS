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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-postpone-pledge">
        <DialogHeader>
          <DialogTitle>Postpone Pledge</DialogTitle>
          <DialogDescription>
            Set a new expected fulfillment date for this pledge.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="postpone-date" className="text-right">
              New Date *
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
              Reason
            </Label>
            <Textarea
              id="postpone-notes"
              value={postponeForm.notes}
              onChange={(e) =>
                setPostponeForm({ ...postponeForm, notes: e.target.value })
              }
              className="col-span-3"
              placeholder="Reason for postponing (optional)"
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
            Cancel
          </Button>

          <Button
            onClick={onConfirm}
            disabled={!!pledgeActionLoading || !postponeForm.newDate}
            data-testid="button-postpone-confirm"
          >
            {pledgeActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Postponing...
              </>
            ) : (
              "Confirm Postpone"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
