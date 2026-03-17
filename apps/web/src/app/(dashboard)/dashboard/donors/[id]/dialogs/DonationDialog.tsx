"use client";

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
import type { DonationFormData, DonationEmailType } from "../types";

interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorName: string;
  donationForm: DonationFormData;
  setDonationForm: (form: DonationFormData) => void;
  submittingDonation: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const EMAIL_TYPE_OPTIONS: { value: DonationEmailType; label: string; description: string }[] = [
  {
    value: "GENERAL",
    label: "General Thank You",
    description: "Warm acknowledgement for regular donations",
  },
  {
    value: "TAX",
    label: "Tax Receipt",
    description: "Formal receipt with 80G tax exemption details",
  },
  {
    value: "KIND",
    label: "Kind Donation",
    description: "For food, clothes, groceries, or material support",
  },
];

export default function DonationDialog({
  open,
  onOpenChange,
  donorName,
  donationForm,
  setDonationForm,
  submittingDonation,
  onSubmit,
}: DonationDialogProps) {
  const selectedEmailType = EMAIL_TYPE_OPTIONS.find(
    (o) => o.value === (donationForm.emailType || "GENERAL")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Donation</DialogTitle>
          <DialogDescription>
            Record a new donation for {donorName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="donationAmount">Amount (INR) *</Label>
              <Input
                id="donationAmount"
                type="number"
                placeholder="Enter amount"
                value={donationForm.donationAmount}
                onChange={(e) =>
                  setDonationForm({
                    ...donationForm,
                    donationAmount: e.target.value,
                  })
                }
                data-testid="input-donation-amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donationDate">Date *</Label>
              <Input
                id="donationDate"
                type="date"
                value={donationForm.donationDate}
                onChange={(e) =>
                  setDonationForm({
                    ...donationForm,
                    donationDate: e.target.value,
                  })
                }
                data-testid="input-donation-date"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designatedHome">Designated Home</Label>
              <Select
                value={donationForm.designatedHome}
                onValueChange={(value) =>
                  setDonationForm({ ...donationForm, designatedHome: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select home" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="GIRLS_HOME">Girls Home</SelectItem>
                  <SelectItem value="BLIND_BOYS_HOME">Blind Boys Home</SelectItem>
                  <SelectItem value="OLD_AGE_HOME">Old Age Home</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donationMode">Payment Mode</Label>
              <Select
                value={donationForm.donationMode}
                onValueChange={(value) =>
                  setDonationForm({ ...donationForm, donationMode: value })
                }
              >
                <SelectTrigger data-testid="select-donation-mode">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="GPAY">Google Pay</SelectItem>
                  <SelectItem value="PHONEPE">PhonePe</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donationType">Purpose / Category</Label>
              <Select
                value={donationForm.donationType}
                onValueChange={(value) =>
                  setDonationForm({ ...donationForm, donationType: value })
                }
              >
                <SelectTrigger data-testid="select-donation-type">
                  <SelectValue placeholder="Select donation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash Donation</SelectItem>
                  <SelectItem value="GROCERY">Grocery</SelectItem>
                  <SelectItem value="MEDICINES">Medicines</SelectItem>
                  <SelectItem value="PREPARED_FOOD">Prepared Food</SelectItem>
                  <SelectItem value="USED_ITEMS">Used Items</SelectItem>
                  <SelectItem value="KIND">In Kind</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Notes</Label>
              <Textarea
                id="remarks"
                placeholder="Optional notes about this donation"
                value={donationForm.remarks}
                onChange={(e) =>
                  setDonationForm({
                    ...donationForm,
                    remarks: e.target.value,
                  })
                }
                data-testid="input-donation-remarks"
              />
            </div>

            {/* EMAIL TYPE SELECTOR */}
            <div className="space-y-2 pt-1">
              <Label>Acknowledgement Email Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {EMAIL_TYPE_OPTIONS.map((option) => {
                  const isSelected = (donationForm.emailType || "GENERAL") === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-testid={`email-type-${option.value.toLowerCase()}`}
                      onClick={() =>
                        setDonationForm({ ...donationForm, emailType: option.value })
                      }
                      className={[
                        "text-left rounded-md border px-3 py-2.5 text-xs transition-all cursor-pointer",
                        isSelected
                          ? "border-[#1F3B64] bg-[#1F3B64]/5 text-[#1F3B64]"
                          : "border-border bg-background text-muted-foreground hover:border-[#1F3B64]/40",
                      ].join(" ")}
                    >
                      <div className="font-semibold mb-0.5">{option.label}</div>
                      <div className="opacity-70 leading-snug">{option.description}</div>
                    </button>
                  );
                })}
              </div>
              {selectedEmailType && (
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  Selected: <span className="font-medium text-foreground">{selectedEmailType.label}</span>
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submittingDonation}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submittingDonation}
              data-testid="button-submit-donation"
            >
              {submittingDonation ? "Saving..." : "Save Donation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
