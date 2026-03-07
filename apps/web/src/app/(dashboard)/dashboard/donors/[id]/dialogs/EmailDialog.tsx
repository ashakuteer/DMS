"use client";

import { Mail, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

interface EmailFormData {
  toEmail: string;
  subject: string;
  body: string;
  attachReceipt?: boolean;
}

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donorName: string;
  emailForm: EmailFormData;
  setEmailForm: (form: EmailFormData) => void;
  sendingEmail: boolean;
  receiptNumber?: string | null;
  onSend: () => void;
}

export default function EmailDialog({
  open,
  onOpenChange,
  donorName,
  emailForm,
  setEmailForm,
  sendingEmail,
  receiptNumber,
  onSend,
}: EmailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
          <DialogDescription>Send an email to {donorName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="toEmail">To *</Label>
            <Input
              id="toEmail"
              type="email"
              placeholder="Recipient email"
              value={emailForm.toEmail}
              onChange={(e) =>
                setEmailForm({ ...emailForm, toEmail: e.target.value })
              }
              data-testid="input-email-to"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSubject">Subject *</Label>
            <Input
              id="emailSubject"
              placeholder="Email subject"
              value={emailForm.subject}
              onChange={(e) =>
                setEmailForm({ ...emailForm, subject: e.target.value })
              }
              data-testid="input-email-subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBody">Message *</Label>
            <Textarea
              id="emailBody"
              placeholder="Email body"
              rows={6}
              value={emailForm.body}
              onChange={(e) =>
                setEmailForm({ ...emailForm, body: e.target.value })
              }
              data-testid="input-email-body"
              required
            />
          </div>

          {receiptNumber && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={emailForm.attachReceipt ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setEmailForm({
                    ...emailForm,
                    attachReceipt: !emailForm.attachReceipt,
                  })
                }
                data-testid="button-toggle-receipt"
              >
                <Receipt className="h-4 w-4 mr-1" />
                {emailForm.attachReceipt
                  ? "Receipt Attached"
                  : "Attach Receipt PDF"}
              </Button>

              {emailForm.attachReceipt && (
                <Badge variant="secondary">{receiptNumber}</Badge>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendingEmail}
          >
            Cancel
          </Button>

          <Button
            onClick={onSend}
            disabled={sendingEmail}
            data-testid="button-send-email"
          >
            {sendingEmail ? (
              "Sending..."
            ) : (
              <>
                <Mail className="h-4 w-4 mr-1" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
