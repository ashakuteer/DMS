"use client";

import { format } from "date-fns";
import { Copy, Edit, ExternalLink, Heart, History, Trash2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { Beneficiary, Sponsorship } from "../types";
import { formatAmount, getStatusBadgeVariant } from "../utils";

interface BeneficiarySponsorsTabProps {
  beneficiary: Beneficiary;
  canEdit: boolean;
  onOpenAddSponsor: () => void;
  onOpenStatusChange: (sponsorship: Sponsorship) => void;
  onViewHistory: (sponsorship: Sponsorship) => void;
  onDeleteSponsorship: (sponsorshipId: string) => void;
  onCopyMessage: (sponsorship: Sponsorship) => void;
  onViewDonorProfile: (donorId: string) => void;
  onSendWhatsApp: (sponsorship: Sponsorship) => void;
}

export default function BeneficiarySponsorsTab({
  beneficiary,
  canEdit,
  onOpenAddSponsor,
  onOpenStatusChange,
  onViewHistory,
  onDeleteSponsorship,
  onCopyMessage,
  onViewDonorProfile,
  onSendWhatsApp,
}: BeneficiarySponsorsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold" data-testid="text-sponsors-count">
          Sponsors ({beneficiary.sponsorships.length})
        </h3>

        {canEdit && (
          <Button onClick={onOpenAddSponsor} data-testid="button-add-sponsor">
            <Heart className="h-4 w-4 mr-2" />
            Link Sponsor
          </Button>
        )}
      </div>

      {beneficiary.sponsorships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <Heart className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No sponsors yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {beneficiary.sponsorships.map((sponsorship) => (
            <Card key={sponsorship.id} data-testid={`card-sponsorship-${sponsorship.id}`}>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {sponsorship.donor.firstName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">
                        {sponsorship.donor.firstName} {sponsorship.donor.lastName || ""}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {sponsorship.donor.donorCode}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={getStatusBadgeVariant(sponsorship.status)}
                      data-testid={`badge-status-${sponsorship.id}`}
                    >
                      {sponsorship.status || "ACTIVE"}
                    </Badge>
                    <Badge variant="outline">{sponsorship.sponsorshipType}</Badge>
                    <Badge variant="outline">{sponsorship.frequency}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  {sponsorship.amount ? (
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p
                        className="font-semibold text-lg"
                        data-testid={`text-amount-${sponsorship.id}`}
                      >
                        {formatAmount(sponsorship.amount, sponsorship.currency)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          /{sponsorship.frequency?.toLowerCase()}
                        </span>
                      </p>
                    </div>
                  ) : sponsorship.inKindItem ? (
                    <div>
                      <p className="text-xs text-muted-foreground">In-Kind</p>
                      <p
                        className="font-medium"
                        data-testid={`text-inkind-${sponsorship.id}`}
                      >
                        {sponsorship.inKindItem}
                      </p>
                    </div>
                  ) : (
                    <div />
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p
                      className="text-sm"
                      data-testid={`text-start-date-${sponsorship.id}`}
                    >
                      {sponsorship.startDate
                        ? format(new Date(sponsorship.startDate), "dd MMM yyyy")
                        : format(new Date(sponsorship.createdAt), "dd MMM yyyy")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p
                      className="text-sm"
                      data-testid={`text-end-date-${sponsorship.id}`}
                    >
                      {sponsorship.endDate
                        ? format(new Date(sponsorship.endDate), "dd MMM yyyy")
                        : "Ongoing"}
                    </p>
                  </div>
                </div>

                {sponsorship.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{sponsorship.notes}</p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap">
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenStatusChange(sponsorship)}
                      data-testid={`button-change-status-${sponsorship.id}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Change Status
                    </Button>
                  )}

                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewHistory(sponsorship)}
                      data-testid={`button-view-history-${sponsorship.id}`}
                    >
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDonorProfile(sponsorship.donorId)}
                    data-testid={`button-view-donor-${sponsorship.id}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Donor Profile
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopyMessage(sponsorship)}
                    data-testid={`button-copy-message-${sponsorship.id}`}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Message
                  </Button>

                  {sponsorship.donor.primaryPhone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendWhatsApp(sponsorship)}
                      data-testid={`button-whatsapp-${sponsorship.id}`}
                    >
                      <SiWhatsapp className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                  )}

                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteSponsorship(sponsorship.id)}
                      className="ml-auto text-destructive"
                      data-testid={`button-delete-sponsorship-${sponsorship.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
