"use client";

import { Mail, Plus, Receipt, Send } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Donation, DonationFormData, Template } from "../types";
import { formatCurrency, formatDate } from "../utils";
import DonationDialog from "../dialogs/DonationDialog";

interface DonorDonationsTabProps {
  donations: Donation[];
  donationsLoading: boolean;
  isAdmin: boolean;
  canSendWhatsApp: boolean;
  canSendEmail: boolean;
  hasWhatsAppNumber: boolean;
  hasEmail: boolean;
  templates: Template[];
  donorName: string;
  resendingReceiptId: string | null;
  onAddDonation: () => void;
  onSendWhatsApp: (donation: Donation) => void;
  onSendEmail: (donation: Donation) => void;
  onResendReceipt: (donationId: string) => void;
  showDonationDialog: boolean;
  setShowDonationDialog: (open: boolean) => void;
  donationForm: DonationFormData;
  setDonationForm: (form: DonationFormData) => void;
  submittingDonation: boolean;
  handleDonationSubmit: (e: React.FormEvent) => void;
}

export default function DonorDonationsTab({
  donations,
  donationsLoading,
  isAdmin,
  canSendWhatsApp,
  canSendEmail,
  hasWhatsAppNumber,
  hasEmail,
  templates,
  donorName,
  resendingReceiptId,
  onAddDonation,
  onSendWhatsApp,
  onSendEmail,
  onResendReceipt,
  showDonationDialog,
  setShowDonationDialog,
  donationForm,
  setDonationForm,
  submittingDonation,
  handleDonationSubmit,
}: DonorDonationsTabProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Donations</CardTitle>
            <CardDescription>All donations from this donor</CardDescription>
          </div>

          {isAdmin && (
            <Button onClick={onAddDonation} data-testid="button-add-donation">
              <Plus className="mr-2 h-4 w-4" />
              Add Donation
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {donationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : donations.length ? (
            <div className="space-y-3">
              {donations.map((donation) => {
                const thankYouTemplate = templates.find(
                  (t) => t.type === "THANK_YOU",
                );

                const donationMessage = thankYouTemplate
                  ? thankYouTemplate.whatsappMessage
                  : `Dear ${donorName}, thank you for your generous donation of ${formatCurrency(
                      donation.donationAmount,
                      donation.currency,
                    )} on ${formatDate(donation.donationDate)}!`;

                return (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 border rounded-lg gap-3"
                    data-testid={`donation-item-${donation.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">
                          {formatCurrency(
                            donation.donationAmount,
                            donation.currency,
                          )}
                        </p>

                        {donation.receiptNumber && (
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" />
                            {donation.receiptNumber}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {donation.donationType} via {donation.donationMode}
                      </p>

                      {donation.remarks && (
                        <p className="text-sm text-muted-foreground truncate">
                          {donation.remarks}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm">{formatDate(donation.donationDate)}</p>
                      </div>

                      {canSendWhatsApp && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                onClick={() => onSendWhatsApp(donation)}
                                disabled={!hasWhatsAppNumber}
                                data-testid={`button-whatsapp-donation-${donation.id}`}
                              >
                                <SiWhatsapp className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasWhatsAppNumber
                              ? "Send Thank You via WhatsApp"
                              : "No phone number available"}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {canSendEmail && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onSendEmail(donation)}
                                disabled={!hasEmail}
                                data-testid={`button-email-donation-${donation.id}`}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasEmail
                              ? "Send Thank You via Email"
                              : "No email address available"}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {canSendEmail && donation.receiptNumber && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onResendReceipt(donation.id)}
                                disabled={
                                  !hasEmail || resendingReceiptId === donation.id
                                }
                                data-testid={`button-resend-receipt-${donation.id}`}
                              >
                                {resendingReceiptId === donation.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasEmail
                              ? "Re-send Receipt via Email"
                              : "No email address available"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No donations recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DonationDialog
        open={showDonationDialog}
        onOpenChange={setShowDonationDialog}
        donorName={donorName}
        donationForm={donationForm}
        setDonationForm={setDonationForm}
        submittingDonation={submittingDonation}
        onSubmit={handleDonationSubmit}
      />
    </>
  );
}
