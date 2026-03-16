"use client";

import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Users, X, Send } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { DonorUpdate, DonorResult } from "./types";

interface SendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sendChannel: "EMAIL" | "WHATSAPP";
  setSendChannel: (v: "EMAIL" | "WHATSAPP") => void;
  updates: DonorUpdate[];
  sendUpdateId: string | null;
  handleAutoSelectDonors: (mode: "home" | "beneficiary") => void;
  donorSearch: string;
  setDonorSearch: (v: string) => void;
  donorSearchLoading: boolean;
  donorResults: DonorResult[];
  addDonor: (d: DonorResult) => void;
  selectedDonors: DonorResult[];
  setSelectedDonors: Dispatch<SetStateAction<DonorResult[]>>;
  actionLoading: string | null;
  handleSend: () => void;
}

export function SendDialog({
  open,
  onOpenChange,
  sendChannel,
  setSendChannel,
  updates,
  sendUpdateId,
  handleAutoSelectDonors,
  donorSearch,
  setDonorSearch,
  donorSearchLoading,
  donorResults,
  addDonor,
  selectedDonors,
  setSelectedDonors,
  actionLoading,
  handleSend,
}: SendDialogProps) {
  const update = updates.find((u) => u.id === sendUpdateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Update to Donors</DialogTitle>
          <DialogDescription>Select donors and channel to send this update</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Channel</Label>
            <Select value={sendChannel} onValueChange={(v) => setSendChannel(v as "EMAIL" | "WHATSAPP")}>
              <SelectTrigger data-testid="select-channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">
                  <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</span>
                </SelectItem>
                <SelectItem value="WHATSAPP">
                  <span className="flex items-center gap-2"><SiWhatsapp className="h-4 w-4" /> WhatsApp</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {update && (update.relatedHomeTypes.length > 0 || update.relatedBeneficiaryIds.length > 0) && (
            <div>
              <Label>Quick Add Sponsors</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {update.relatedHomeTypes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAutoSelectDonors("home")}
                    data-testid="button-auto-select-home"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Add sponsors of related homes
                  </Button>
                )}
                {update.relatedBeneficiaryIds.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAutoSelectDonors("beneficiary")}
                    data-testid="button-auto-select-beneficiary"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Add sponsors of related beneficiaries
                  </Button>
                )}
              </div>
            </div>
          )}

          <div>
            <Label>Search & Add Donors</Label>
            <div className="relative mt-1">
              <Input
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                placeholder="Search by name, code, email, phone..."
                data-testid="input-donor-search"
              />
              {donorSearchLoading && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {donorResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {donorResults.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => addDonor(d)}
                      className="w-full text-left px-3 py-2 text-sm hover-elevate"
                      data-testid={`button-add-donor-${d.id}`}
                    >
                      <div className="font-medium">{d.firstName} {d.lastName || ""} ({d.donorCode})</div>
                      <div className="text-xs text-muted-foreground">
                        {d.personalEmail || d.officialEmail || "No email"} | {d.whatsappPhone || d.primaryPhone || "No phone"}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedDonors.length > 0 && (
            <div>
              <Label>Selected Donors ({selectedDonors.length})</Label>
              <div className="flex flex-wrap gap-1 mt-1 max-h-40 overflow-y-auto">
                {selectedDonors.map((d) => (
                  <Badge key={d.id} variant="secondary" className="gap-1">
                    {d.firstName} {d.lastName || ""} ({d.donorCode})
                    <button onClick={() => setSelectedDonors((prev) => prev.filter((sd) => sd.id !== d.id))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-send">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={actionLoading === "send" || selectedDonors.length === 0}
            data-testid="button-confirm-send"
          >
            {actionLoading === "send" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send to {selectedDonors.length} Donor(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
