"use client";

import { useState } from "react";
import { Receipt, MessageSquare, Mail, Send, ChevronDown, Loader2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/auth";
import type { Donor, Donation, Template } from "../types";

interface DonorQuickActionsProps {
  donor: Donor;
  donorId: string;
  templates: Template[];
  latestDonation: Donation | null;
}

function resolvePlaceholders(text: string, donor: Donor, donation: Donation | null): string {
  const donorName = [donor.firstName, donor.middleName, donor.lastName].filter(Boolean).join(" ") || donor.donorCode;
  let result = text;
  result = result.replace(/\{\{donor_name\}\}/g, donorName);
  result = result.replace(/\{\{donorName\}\}/g, donorName);
  result = result.replace(/\{\{name\}\}/g, donorName);
  result = result.replace(/\{\{phone\}\}/g, donor.primaryPhone || "");
  result = result.replace(/\{\{amount\}\}/g, donation?.donationAmount || "");
  result = result.replace(/\{\{date\}\}/g, donation?.donationDate || "");
  result = result.replace(/\{\{receipt\}\}/g, donation?.receiptNumber || "");
  result = result.replace(/\{\{receipt_number\}\}/g, donation?.receiptNumber || "");
  return result;
}

export default function DonorQuickActions({
  donor,
  donorId,
  templates,
  latestDonation,
}: DonorQuickActionsProps) {
  const { toast } = useToast();
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const hasPhone = !!(donor.whatsappPhone || donor.primaryPhone);
  const hasEmail = !!(donor.personalEmail || donor.officialEmail);
  const phone = (donor.whatsappPhone || donor.primaryPhone || "").replace(/\D/g, "");
  const email = donor.personalEmail || donor.officialEmail || "";

  const handleResendReceipt = async (emailType: "GENERAL" | "TAX") => {
    if (!latestDonation) {
      toast({ title: "No donation found", description: "This donor has no donations to send a receipt for.", variant: "destructive" });
      return;
    }
    setSendingReceipt(true);
    try {
      const res = await fetchWithAuth(`/api/donations/${latestDonation.id}/resend-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType }),
      });
      if (res.ok) {
        toast({ title: emailType === "TAX" ? "Tax receipt sent!" : "Receipt sent!", description: `Receipt emailed to ${email || "donor"}.` });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Failed to send receipt", description: data.message || "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not send receipt.", variant: "destructive" });
    } finally {
      setSendingReceipt(false);
    }
  };

  const handleSendWhatsApp = () => {
    const template = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    if (!template) return;
    const message = resolvePlaceholders(template.whatsappMessage, donor, latestDonation);
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    setWhatsappDialogOpen(false);
  };

  const handleSendEmail = () => {
    const template = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    if (!template) return;
    const subject = encodeURIComponent(resolvePlaceholders(template.emailSubject, donor, latestDonation));
    const body = encodeURIComponent(resolvePlaceholders(template.emailBody, donor, latestDonation));
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    setEmailDialogOpen(false);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap p-4 bg-muted/30 rounded-xl border border-border/50">
        <span className="text-sm font-medium text-muted-foreground mr-1">Quick Actions:</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={sendingReceipt || !hasEmail} data-testid="button-quick-receipt">
              {sendingReceipt ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5 mr-1.5" />}
              Receipt
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Send Receipt</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleResendReceipt("GENERAL")} data-testid="button-resend-receipt">
              <Receipt className="h-4 w-4 mr-2" />
              Resend Receipt
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleResendReceipt("TAX")} data-testid="button-send-tax-receipt">
              <Receipt className="h-4 w-4 mr-2 text-orange-500" />
              Send Tax Receipt (80G)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasPhone || templates.length === 0}
          onClick={() => {
            setSelectedTemplateId(templates[0]?.id || "");
            setWhatsappDialogOpen(true);
          }}
          className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
          data-testid="button-quick-whatsapp"
        >
          <SiWhatsapp className="h-3.5 w-3.5 mr-1.5" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasEmail || templates.length === 0}
          onClick={() => {
            setSelectedTemplateId(templates[0]?.id || "");
            setEmailDialogOpen(true);
          }}
          data-testid="button-quick-email"
        >
          <Mail className="h-3.5 w-3.5 mr-1.5" />
          Email
        </Button>

        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {latestDonation && (
            <Badge variant="outline" className="text-xs">
              Latest: ₹{latestDonation.donationAmount} · {latestDonation.receiptNumber || "No receipt"}
            </Badge>
          )}
          {!hasEmail && <span className="text-orange-500">No email on file</span>}
          {!hasPhone && <span className="text-orange-500">No phone on file</span>}
        </div>
      </div>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SiWhatsapp className="h-5 w-5 text-green-600" />
              Send WhatsApp Message
            </DialogTitle>
            <DialogDescription>
              Select a template. Message will open in WhatsApp Web with donor details filled in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Template</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger data-testid="select-whatsapp-template">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div>
                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Preview</label>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm whitespace-pre-wrap text-green-900 dark:text-green-100 max-h-40 overflow-y-auto">
                  {resolvePlaceholders(selectedTemplate.whatsappMessage, donor, latestDonation)}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setWhatsappDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSendWhatsApp}
                data-testid="button-confirm-whatsapp"
              >
                <Send className="h-4 w-4 mr-2" />
                Open WhatsApp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Email
            </DialogTitle>
            <DialogDescription>
              Select a template. Your email client will open with donor details filled in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Template</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger data-testid="select-email-template">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
                  <div className="bg-muted rounded px-3 py-2 text-sm mt-1">
                    {resolvePlaceholders(selectedTemplate.emailSubject, donor, latestDonation)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body Preview</label>
                  <div className="bg-muted rounded px-3 py-2 text-sm mt-1 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {resolvePlaceholders(selectedTemplate.emailBody, donor, latestDonation)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendEmail}
                data-testid="button-confirm-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                Open Email Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
