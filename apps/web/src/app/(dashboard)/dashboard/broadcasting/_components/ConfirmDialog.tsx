"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Send } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: "WHATSAPP" | "EMAIL" | null;
  reachable: number;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, onOpenChange, channel, reachable, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Broadcast</DialogTitle>
          <DialogDescription>
            You are about to send a {channel === "WHATSAPP" ? "WhatsApp" : "Email"} broadcast to{" "}
            <span className="font-semibold">{reachable}</span> reachable donor(s).
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-send">
            Cancel
          </Button>
          <Button onClick={onConfirm} data-testid="button-confirm-send">
            <Send className="mr-2 h-4 w-4" />
            Confirm & Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
