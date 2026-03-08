"use client";

import { Loader2, Mail, Send } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sending: boolean;
  sponsorCount: number;
  onSendEmail: () => void;
  onSendWhatsapp: () => void;
}

export default function SendToSponsorsDialog({
  open,
  onOpenChange,
  sending,
  sponsorCount,
  onSendEmail,
  onSendWhatsapp,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Update to Sponsors
          </DialogTitle>

          <DialogDescription>
            This update will be sent to {sponsorCount} sponsors.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 py-6">

          <Button
            className="flex-1"
            variant="outline"
            onClick={onSendEmail}
            disabled={sending}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>

          <Button
            className="flex-1"
            variant="outline"
            onClick={onSendWhatsapp}
            disabled={sending}
          >
            WhatsApp
          </Button>

        </div>

        {sending && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
