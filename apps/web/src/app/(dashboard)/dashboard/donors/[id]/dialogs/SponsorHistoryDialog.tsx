"use client";

import { History, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SponsoredBeneficiary } from "../types";
import { getSponsorStatusBadgeVariant } from "../utils";

interface SponsorHistoryEntry {
  id: string;
  oldStatus: string;
  newStatus: string;
  oldAmount?: number;
  newAmount?: number;
  currency?: string;
  note?: string;
  changedAt: string;
  changedBy?: {
    name: string;
  };
}

interface SponsorHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsorHistoryTarget: SponsoredBeneficiary | null;
  sponsorHistoryEntries: SponsorHistoryEntry[];
  sponsorHistoryLoading: boolean;
}

export default function SponsorHistoryDialog({
  open,
  onOpenChange,
  sponsorHistoryTarget,
  sponsorHistoryEntries,
  sponsorHistoryLoading,
}: SponsorHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sponsorship History
          </DialogTitle>
          <DialogDescription>
            {sponsorHistoryTarget && (
              <>
                Change history for sponsorship of{" "}
                {sponsorHistoryTarget.beneficiary.fullName}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {sponsorHistoryLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sponsorHistoryEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No changes recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {sponsorHistoryEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-md p-3 space-y-1"
                  data-testid={`donor-history-entry-${entry.id}`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getSponsorStatusBadgeVariant(entry.oldStatus)}
                        className="text-xs"
                      >
                        {entry.oldStatus}
                      </Badge>

                      <span className="text-muted-foreground text-xs">
                        &rarr;
                      </span>

                      <Badge
                        variant={getSponsorStatusBadgeVariant(entry.newStatus)}
                        className="text-xs"
                      >
                        {entry.newStatus}
                      </Badge>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.changedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {entry.oldAmount !== entry.newAmount &&
                    entry.newAmount !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Amount: {entry.currency === "INR" ? "₹" : "$"}
                        {(entry.oldAmount || 0).toLocaleString()} &rarr;{" "}
                        {entry.currency === "INR" ? "₹" : "$"}
                        {entry.newAmount.toLocaleString()}
                      </p>
                    )}

                  {entry.note && <p className="text-sm">{entry.note}</p>}

                  {entry.changedBy && (
                    <p className="text-xs text-muted-foreground">
                      By: {entry.changedBy.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
