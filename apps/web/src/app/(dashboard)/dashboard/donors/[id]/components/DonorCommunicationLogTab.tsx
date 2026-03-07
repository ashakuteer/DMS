"use client";

import { Check, Copy, ExternalLink, Mail, MessageSquare, MessageSquareText } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Donation, Template } from "../types";
import { formatCurrency, formatDate } from "../utils";

interface DonorCommunicationTabProps {
  templates: Template[];
  donations: Donation[];
  copiedField: string | null;
  canSendWhatsApp: boolean;
  canSendEmail: boolean;
  hasWhatsAppNumber: boolean;
  hasEmail: boolean;
  donorName: string;
  resolvePlaceholders: (template: string, donation?: Donation) => string;
  copyToClipboard: (text: string, fieldId: string) => void;
  openWhatsApp: (
    message: string,
    templateId?: string,
    donationId?: string,
    type?: string,
  ) => void;
  openEmailComposer: (template: Template | null, donation: Donation | null) => void;
}

export default function DonorCommunicationTab({
  templates,
  donations,
  copiedField,
  canSendWhatsApp,
  canSendEmail,
  hasWhatsAppNumber,
  hasEmail,
  donorName,
  resolvePlaceholders,
  copyToClipboard,
  openWhatsApp,
  openEmailComposer,
}: DonorCommunicationTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-primary" />
          <CardTitle>Communication Templates</CardTitle>
        </div>
        <CardDescription>
          Copy personalized messages to send via WhatsApp or Email. No messages are sent automatically.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No templates available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {donations.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 border mb-4">
                <p className="text-sm font-medium mb-2">
                  Latest Donation Details (used for placeholders):
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant="outline">
                    Amount: {formatCurrency(donations[0].donationAmount)}
                  </Badge>
                  <Badge variant="outline">
                    Date: {formatDate(donations[0].donationDate)}
                  </Badge>
                  {donations[0].receiptNumber && (
                    <Badge variant="outline">
                      Receipt: {donations[0].receiptNumber}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => {
                const latestDonation = donations[0];
                const whatsappResolved = resolvePlaceholders(
                  template.whatsappMessage,
                  latestDonation,
                );
                const emailSubjectResolved = resolvePlaceholders(
                  template.emailSubject,
                  latestDonation,
                );
                const emailBodyResolved = resolvePlaceholders(
                  template.emailBody,
                  latestDonation,
                );

                return (
                  <Card
                    key={template.id}
                    className="border"
                    data-testid={`comm-template-${template.type.toLowerCase()}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                          <MessageSquare className="h-3 w-3" />
                          WhatsApp Message
                        </Label>

                        <div className="bg-muted/50 rounded p-2 text-xs max-h-24 overflow-y-auto whitespace-pre-wrap border">
                          {whatsappResolved}
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              copyToClipboard(whatsappResolved, `wa-${template.id}`)
                            }
                            data-testid={`button-copy-whatsapp-${template.type.toLowerCase()}`}
                          >
                            {copiedField === `wa-${template.id}` ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" /> Copy
                              </>
                            )}
                          </Button>

                          {canSendWhatsApp && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex-1">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      const typeMap: Record<string, string> = {
                                        THANK_YOU: "THANK_YOU",
                                        GENTLE_FOLLOWUP: "FOLLOW_UP",
                                        MONTHLY_REMINDER: "FOLLOW_UP",
                                        FESTIVAL_GREETING: "GREETING",
                                        RECEIPT_RESEND: "RECEIPT",
                                        BIRTHDAY_ANNIVERSARY: "GREETING",
                                      };

                                      openWhatsApp(
                                        whatsappResolved,
                                        template.id,
                                        latestDonation?.id,
                                        typeMap[template.type] || "GENERAL",
                                      );
                                    }}
                                    disabled={!hasWhatsAppNumber}
                                    data-testid={`button-send-whatsapp-${template.type.toLowerCase()}`}
                                  >
                                    <SiWhatsapp className="h-3 w-3 mr-1" />
                                    Send
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </Button>
                                </span>
                              </TooltipTrigger>

                              {!hasWhatsAppNumber && (
                                <TooltipContent>
                                  <p>No phone number available for this donor</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </Label>

                        <div className="space-y-1">
                          <div className="bg-muted/50 rounded p-2 text-xs border">
                            <span className="text-muted-foreground">Subject: </span>
                            {emailSubjectResolved}
                          </div>

                          <div className="bg-muted/50 rounded p-2 text-xs max-h-20 overflow-y-auto whitespace-pre-wrap border">
                            {emailBodyResolved}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              copyToClipboard(emailSubjectResolved, `subj-${template.id}`)
                            }
                            data-testid={`button-copy-subject-${template.type.toLowerCase()}`}
                          >
                            {copiedField === `subj-${template.id}` ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" /> Subject
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              copyToClipboard(emailBodyResolved, `body-${template.id}`)
                            }
                            data-testid={`button-copy-body-${template.type.toLowerCase()}`}
                          >
                            {copiedField === `body-${template.id}` ? (
                              <>
                                <Check className="h-3 w-3 mr-1" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 mr-1" /> Body
                              </>
                            )}
                          </Button>

                          {canSendEmail && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex-1">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => openEmailComposer(template, latestDonation)}
                                    disabled={!hasEmail}
                                    data-testid={`button-send-email-${template.type.toLowerCase()}`}
                                  >
                                    <Mail className="h-3 w-3 mr-1" />
                                    Send
                                  </Button>
                                </span>
                              </TooltipTrigger>

                              {!hasEmail && (
                                <TooltipContent>
                                  <p>No email address available for this donor</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
