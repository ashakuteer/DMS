"use client";

import { format } from "date-fns";
import { History, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";

import type { Sponsorship, SponsorshipHistoryEntry } from "../types";
import { formatAmount, getStatusBadgeVariant } from "../utils";

interface SponsorshipHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historySponsorship: Sponsorship | null;
  historyEntries: SponsorshipHistoryEntry[];
  historyLoading: boolean;
}

export default function SponsorshipHistoryDialog({
  open,
  onOpenChange,
  historySponsorship,
  historyEntries,
  historyLoading,
}: SponsorshipHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Sponsorship History
          </DialogTitle>
          <DialogDescription>
            {historySponsorship && (
              <>
                Change history for {historySponsorship.donor.firstName}{" "}
                {historySponsorship.donor.lastName || ""}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historyEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No changes recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {historyEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-md p-3 space-y-1"
                  data-testid={`history-entry-${entry.id}`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getStatusBadgeVariant(entry.oldStatus)}
                        className="text-xs"
                      >
                        {entry.oldStatus}
                      </Badge>

                      <span className="text-muted-foreground text-xs">&rarr;</span>

                      <Badge
                        variant={getStatusBadgeVariant(entry.newStatus)}
                        className="text-xs"
                      >
                        {entry.newStatus}
                      </Badge>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.changedAt), "dd MMM yyyy, HH:mm")}
                    </span>
                  </div>

                  {entry.oldAmount !== entry.newAmount &&
                    entry.newAmount !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Amount: {formatAmount(entry.oldAmount || 0, "INR")} &rarr;{" "}
                        {formatAmount(entry.newAmount, "INR")}
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
