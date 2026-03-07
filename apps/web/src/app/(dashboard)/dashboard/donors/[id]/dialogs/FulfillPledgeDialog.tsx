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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-fulfill-pledge">
        <DialogHeader>
          <DialogTitle>Fulfill Pledge</DialogTitle>
          <DialogDescription>
            Mark this pledge as fulfilled and optionally create a donation
            record.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fulfill-auto-donation">
              Auto-create donation & receipt
            </Label>
            <Switch
              id="fulfill-auto-donation"
              checked={fulfillForm.autoCreateDonation}
              onCheckedChange={(checked) =>
                setFulfillForm({
                  ...fulfillForm,
                  autoCreateDonation: checked,
                })
              }
              data-testid="switch-fulfill-auto-donation"
            />
          </div>

          {fulfillForm.autoCreateDonation && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-amount" className="text-right">
                  Amount
                </Label>
                <Input
                  id="fulfill-amount"
                  type="number"
                  value={fulfillForm.donationAmount}
                  onChange={(e) =>
                    setFulfillForm({
                      ...fulfillForm,
                      donationAmount: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Donation amount"
                  data-testid="input-fulfill-amount"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="fulfill-date"
                  type="date"
                  value={fulfillForm.donationDate}
                  onChange={(e) =>
                    setFulfillForm({
                      ...fulfillForm,
                      donationDate: e.target.value,
                    })
                  }
                  className="col-span-3"
                  data-testid="input-fulfill-date"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-mode" className="text-right">
                  Payment Mode
                </Label>
                <Select
                  value={fulfillForm.donationMode}
                  onValueChange={(value) =>
                    setFulfillForm({ ...fulfillForm, donationMode: value })
                  }
                >
                  <SelectTrigger
                    className="col-span-3"
                    data-testid="select-fulfill-mode"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fulfill-remarks" className="text-right">
                  Remarks
                </Label>
                <Textarea
                  id="fulfill-remarks"
                  value={fulfillForm.remarks}
                  onChange={(e) =>
                    setFulfillForm({
                      ...fulfillForm,
                      remarks: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="Optional remarks"
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
            Cancel
          </Button>

          <Button
            onClick={onConfirm}
            disabled={!!pledgeActionLoading}
            data-testid="button-fulfill-confirm"
          >
            {pledgeActionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fulfilling...
              </>
            ) : (
              "Confirm Fulfill"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
