"use client";

import { Heart, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { FREQUENCIES, SPONSORSHIP_TYPES } from "../constants";

interface AddSponsorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiaryName: string;

  selectedDonor: any;
  donorSearch: string;
  donorSearchResults: any[];
  donorSearchLoading: boolean;

  newSponsorship: any;
  addSponsorLoading: boolean;

  setSelectedDonor: (v: any) => void;
  setDonorSearch: (v: string) => void;
  setDonorSearchResults: (v: any[]) => void;
  setNewSponsorship: (v: any) => void;

  onSubmit: () => void;
}

export default function AddSponsorDialog({
  open,
  onOpenChange,
  beneficiaryName,
  selectedDonor,
  donorSearch,
  donorSearchResults,
  donorSearchLoading,
  newSponsorship,
  addSponsorLoading,
  setSelectedDonor,
  setDonorSearch,
  setDonorSearchResults,
  setNewSponsorship,
  onSubmit,
}: AddSponsorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Link Sponsor
          </DialogTitle>
          <DialogDescription>
            Connect a donor as a sponsor for {beneficiaryName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

          <div className="space-y-2">
            <Label>Search Donor *</Label>

            {selectedDonor ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">
                    {selectedDonor.firstName} {selectedDonor.lastName || ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDonor.donorCode}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDonor(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Search by name, code, or phone..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                />

                {donorSearchLoading && (
                  <p className="text-sm text-muted-foreground">Searching...</p>
                )}

                {donorSearchResults.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {donorSearchResults.map((donor) => (
                      <button
                        key={donor.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted flex justify-between"
                        onClick={() => {
                          setSelectedDonor(donor);
                          setDonorSearch("");
                          setDonorSearchResults([]);
                        }}
                      >
                        <span>
                          {donor.firstName} {donor.lastName || ""}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {donor.donorCode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newSponsorship.sponsorshipType}
                onValueChange={(v) =>
                  setNewSponsorship((prev: any) => ({
                    ...prev,
                    sponsorshipType: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {SPONSORSHIP_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>

              <Select
                value={newSponsorship.frequency}
                onValueChange={(v) =>
                  setNewSponsorship((prev: any) => ({
                    ...prev,
                    frequency: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={newSponsorship.notes}
              onChange={(e) =>
                setNewSponsorship((prev: any) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={addSponsorLoading || !selectedDonor}
          >
            {addSponsorLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}

            Link Sponsor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
