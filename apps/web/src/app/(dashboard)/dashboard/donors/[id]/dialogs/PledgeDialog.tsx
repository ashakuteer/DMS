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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingPledge ? "Edit Pledge" : "Add Pledge"}</DialogTitle>
          <DialogDescription>
            {editingPledge
              ? "Update pledge details"
              : "Record a new promise from this donor"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pledge-type" className="text-right">
                Type *
              </Label>
              <Select
                value={pledgeForm.pledgeType}
                onValueChange={(value) =>
                  setPledgeForm({ ...pledgeForm, pledgeType: value })
                }
              >
                <SelectTrigger
                  className="col-span-3"
                  data-testid="select-pledge-type"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONEY">Money</SelectItem>
                  <SelectItem value="RICE">Rice</SelectItem>
                  <SelectItem value="GROCERIES">Groceries</SelectItem>
                  <SelectItem value="MEDICINES">Medicines</SelectItem>
                  <SelectItem value="MEAL_SPONSOR">Meal Sponsor</SelectItem>
                  <SelectItem value="VISIT">Visit</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {pledgeForm.pledgeType === "MONEY" ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledge-amount" className="text-right">
                  Amount *
                </Label>
                <Input
                  id="pledge-amount"
                  type="number"
                  value={pledgeForm.amount}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, amount: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter amount"
                  data-testid="input-pledge-amount"
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pledge-quantity" className="text-right">
                  Quantity
                </Label>
                <Input
                  id="pledge-quantity"
                  value={pledgeForm.quantity}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, quantity: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="e.g., 10 kg, 1 event"
                  data-testid="input-pledge-quantity"
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pledge-date" className="text-right">
                Expected Date *
              </Label>
              <Input
                id="pledge-date"
                type="date"
                value={pledgeForm.expectedFulfillmentDate}
                onChange={(e) =>
                  setPledgeForm({
                    ...pledgeForm,
                    expectedFulfillmentDate: e.target.value,
                  })
                }
                className="col-span-3"
                data-testid="input-pledge-date"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pledge-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="pledge-notes"
                value={pledgeForm.notes}
                onChange={(e) =>
                  setPledgeForm({ ...pledgeForm, notes: e.target.value })
                }
                className="col-span-3"
                placeholder="Optional notes about this pledge"
                data-testid="input-pledge-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={savingPledge}
              data-testid="button-save-pledge"
            >
              {savingPledge ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingPledge ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
