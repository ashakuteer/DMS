"use client";

import { Mail, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t("donor_profile.compose_email")}</DialogTitle>
          <DialogDescription>
            {t("donor_profile.send_email_to", { name: donorName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="toEmail">{t("donor_profile.to_label")} *</Label>
            <Input
              id="toEmail"
              type="email"
              placeholder={t("donor_profile.recipient_email")}
              value={emailForm.toEmail}
              onChange={(e) => setEmailForm({ ...emailForm, toEmail: e.target.value })}
              data-testid="input-email-to"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailSubject">{t("donor_profile.subject")} *</Label>
            <Input
              id="emailSubject"
              placeholder={t("donor_profile.email_subject_placeholder")}
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              data-testid="input-email-subject"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailBody">{t("donor_profile.message_label")} *</Label>
            <Textarea
              id="emailBody"
              placeholder={t("donor_profile.email_body_placeholder")}
              rows={6}
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
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
                  setEmailForm({ ...emailForm, attachReceipt: !emailForm.attachReceipt })
                }
                data-testid="button-toggle-receipt"
              >
                <Receipt className="h-4 w-4 mr-1" />
                {emailForm.attachReceipt
                  ? t("donor_profile.receipt_attached")
                  : t("donor_profile.attach_receipt_pdf")}
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
            {t("common.cancel")}
          </Button>

          <Button onClick={onSend} disabled={sendingEmail} data-testid="button-send-email">
            {sendingEmail ? (
              t("donor_profile.sending")
            ) : (
              <>
                <Mail className="h-4 w-4 mr-1" />
                {t("donor_profile.send_email")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
