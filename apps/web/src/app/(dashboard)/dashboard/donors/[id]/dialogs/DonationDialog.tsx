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

const IN_KIND_TYPES = new Set(["GROCERY", "MEDICINES", "PREPARED_FOOD", "USED_ITEMS", "KIND"]);

function isInKind(donationType: string): boolean {
  return IN_KIND_TYPES.has(donationType);
}

const CATEGORY_OPTIONS = [
  { group: "Financial Donations", items: [{ value: "CASH", label: "Cash Donation" }] },
  {
    group: "In-Kind Donations",
    items: [
      { value: "GROCERY", label: "Grocery" },
      { value: "MEDICINES", label: "Medicines" },
      { value: "PREPARED_FOOD", label: "Prepared Food" },
      { value: "USED_ITEMS", label: "Used Items" },
      { value: "KIND", label: "In Kind (Other)" },
    ],
  },
];

const RECEIPT_TYPE_OPTIONS: { value: DonationEmailType; label: string; description: string }[] = [
  {
    value: "GENERAL",
    label: "General Thank You",
    description: "Warm acknowledgement, no tax details",
  },
  {
    value: "TAX",
    label: "Tax Receipt (80G)",
    description: "Formal receipt with Section 80G exemption",
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
  const kindDonation = isInKind(donationForm.donationType);

  const handleCategoryChange = (value: string) => {
    const kind = isInKind(value);
    setDonationForm({
      ...donationForm,
      donationType: value,
      donationMode: kind ? "" : (donationForm.donationMode || "CASH"),
      emailType: kind ? "KIND" : (donationForm.emailType === "KIND" ? "GENERAL" : donationForm.emailType),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Donation</DialogTitle>
          <DialogDescription>Record a new donation for {donorName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-4 py-4">

            {/* 1. PURPOSE / CATEGORY — FIRST */}
            <div className="space-y-2">
              <Label htmlFor="donationType">Purpose / Category *</Label>
              <Select
                value={donationForm.donationType}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger data-testid="select-donation-type">
                  <SelectValue placeholder="Select donation category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((group) => (
                    <div key={group.group}>
                      <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.group}
                      </div>
                      {group.items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {/* Category indicator badge */}
              {donationForm.donationType && (
                <div
                  className={[
                    "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
                    kindDonation
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-1.5 h-1.5 rounded-full",
                      kindDonation ? "bg-amber-500" : "bg-blue-500",
                    ].join(" ")}
                  />
                  {kindDonation ? "In-Kind Donation → Acknowledgement will be generated" : "Financial Donation → Receipt will be generated"}
                </div>
              )}
            </div>

            {/* 2. DESIGNATED HOME */}
            <div className="space-y-2">
              <Label htmlFor="designatedHome">Designated Home</Label>
              <Select
                value={donationForm.designatedHome || "NONE"}
                onValueChange={(value) =>
                  setDonationForm({ ...donationForm, designatedHome: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select home" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (General)</SelectItem>
                  <SelectItem value="GIRLS_HOME">Girls Home</SelectItem>
                  <SelectItem value="BLIND_BOYS_HOME">Blind Boys Home</SelectItem>
                  <SelectItem value="OLD_AGE_HOME">Old Age Home</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. DYNAMIC FIELDS BASED ON CATEGORY */}
            {!kindDonation ? (
              /* FINANCIAL FIELDS */
              <>
                <div className="space-y-2">
                  <Label htmlFor="donationAmount">Amount (INR) *</Label>
                  <Input
                    id="donationAmount"
                    type="number"
                    placeholder="Enter amount"
                    min="1"
                    value={donationForm.donationAmount}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, donationAmount: e.target.value })
                    }
                    data-testid="input-donation-amount"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donationMode">Payment Mode *</Label>
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
              </>
            ) : (
              /* IN-KIND FIELDS */
              <div className="space-y-2">
                <Label htmlFor="donationAmount">
                  Estimated Value / Worth{" "}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₹
                  </span>
                  <Input
                    id="donationAmount"
                    type="number"
                    placeholder="Estimated value in INR"
                    min="0"
                    className="pl-7"
                    value={donationForm.donationAmount}
                    onChange={(e) =>
                      setDonationForm({ ...donationForm, donationAmount: e.target.value })
                    }
                    data-testid="input-donation-amount"
                  />
                </div>
              </div>
            )}

            {/* 4. DATE */}
            <div className="space-y-2">
              <Label htmlFor="donationDate">Date *</Label>
              <Input
                id="donationDate"
                type="date"
                value={donationForm.donationDate}
                onChange={(e) =>
                  setDonationForm({ ...donationForm, donationDate: e.target.value })
                }
                data-testid="input-donation-date"
                required
              />
            </div>

            {/* 5. NOTES */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Notes</Label>
              <Textarea
                id="remarks"
                placeholder={
                  kindDonation
                    ? "Describe the items, quantity, or any other details..."
                    : "Optional notes about this donation"
                }
                value={donationForm.remarks}
                onChange={(e) =>
                  setDonationForm({ ...donationForm, remarks: e.target.value })
                }
                data-testid="input-donation-remarks"
                rows={2}
              />
            </div>

            {/* 6. RECEIPT TYPE — ONLY FOR FINANCIAL */}
            {!kindDonation && (
              <div className="space-y-2 pt-1">
                <Label>Receipt Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RECEIPT_TYPE_OPTIONS.map((option) => {
                    const isSelected = (donationForm.emailType || "GENERAL") === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={`receipt-type-${option.value.toLowerCase()}`}
                        onClick={() =>
                          setDonationForm({ ...donationForm, emailType: option.value })
                        }
                        className={[
                          "text-left rounded-md border px-3 py-2.5 text-xs transition-all cursor-pointer",
                          isSelected
                            ? "border-[#243A5E] bg-[#243A5E]/5 text-[#243A5E]"
                            : "border-border bg-background text-muted-foreground hover:border-[#243A5E]/40",
                        ].join(" ")}
                      >
                        <div className="font-semibold mb-0.5">{option.label}</div>
                        <div className="opacity-70 leading-snug">{option.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* IN-KIND: auto acknowledgement note */}
            {kindDonation && (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
                <span className="font-semibold">Acknowledgement</span> will be automatically generated and sent — no tax receipt or payment details required.
              </div>
            )}
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
