"use client";

import { Copy, Edit, ExternalLink, Heart, History, Loader2, Plus, Trash2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SponsoredBeneficiary } from "../types";
import { getSponsorStatusBadgeVariant } from "../utils";

interface DonorSponsorshipsTabProps {
  sponsoredBeneficiaries: SponsoredBeneficiary[];
  sponsoredBeneficiariesLoading: boolean;
  canEditSponsorship: boolean;
  donorPhone?: string | null;
  donorId?: string | null;
  onViewAllBeneficiaries: () => void;
  onOpenStatusChange: (sponsorship: SponsoredBeneficiary) => void;
  onViewHistory: (sponsorship: SponsoredBeneficiary) => void;
  onSendWhatsApp: (sponsorship: SponsoredBeneficiary, message: string) => void;
  onCopyMessage: (message: string) => void;
  onViewBeneficiary: (beneficiaryId: string) => void;
  onAddSponsorship?: () => void;
  onDeleteSponsorship?: (sponsorshipId: string) => void;
}

export default function DonorSponsorshipsTab({
  sponsoredBeneficiaries,
  sponsoredBeneficiariesLoading,
  canEditSponsorship,
  onViewAllBeneficiaries,
  onOpenStatusChange,
  onViewHistory,
  onSendWhatsApp,
  onCopyMessage,
  onViewBeneficiary,
  onAddSponsorship,
  onDeleteSponsorship,
}: DonorSponsorshipsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>Sponsored Beneficiaries</CardTitle>
            <CardDescription>
              Children and elderly this donor supports
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {canEditSponsorship && onAddSponsorship && (
              <Button onClick={onAddSponsorship} data-testid="button-add-sponsorship">
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsorship
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onViewAllBeneficiaries}
              data-testid="button-view-all-beneficiaries"
            >
              View All Beneficiaries
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sponsoredBeneficiariesLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sponsoredBeneficiaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Heart className="h-10 w-10 mb-2 opacity-50" />
            <p>No sponsored beneficiaries yet</p>
            <p className="text-sm">
              Link this donor as a sponsor from the beneficiary&apos;s profile
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sponsoredBeneficiaries.map((sponsorship) => {
              const homeLabel =
                sponsorship.beneficiary.homeType === "ORPHAN_GIRLS"
                  ? "Orphan Girls Home"
                  : sponsorship.beneficiary.homeType === "BLIND_BOYS"
                    ? "Blind Boys Home"
                    : "Old Age Home";

              const frequencyLabel =
                sponsorship.frequency === "MONTHLY"
                  ? "Monthly"
                  : sponsorship.frequency === "QUARTERLY"
                    ? "Quarterly"
                    : sponsorship.frequency === "YEARLY"
                      ? "Yearly"
                      : sponsorship.frequency === "ONE_TIME"
                        ? "One-Time"
                        : sponsorship.frequency;

              const sponsorshipMessage = `Hello! I wanted to connect with you about the sponsorship of ${sponsorship.beneficiary.fullName} at ${homeLabel}. Thank you for your continued support!`;

              const statusLabel =
                sponsorship.status || (sponsorship.isActive ? "ACTIVE" : "STOPPED");

              return (
                <Card
                  key={sponsorship.id}
                  data-testid={`card-donor-sponsorship-${sponsorship.id}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => onViewBeneficiary(sponsorship.beneficiaryId)}
                      >
                        <AvatarImage
                          src={sponsorship.beneficiary.photoUrl || undefined}
                          alt={sponsorship.beneficiary.fullName}
                        />
                        <AvatarFallback>
                          {sponsorship.beneficiary.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className="font-medium truncate cursor-pointer"
                            onClick={() => onViewBeneficiary(sponsorship.beneficiaryId)}
                          >
                            {sponsorship.beneficiary.fullName}
                          </p>

                          <Badge
                            variant={getSponsorStatusBadgeVariant(statusLabel)}
                            className="flex-shrink-0"
                            data-testid={`badge-donor-sponsorship-status-${sponsorship.id}`}
                          >
                            {statusLabel}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground font-mono">
                          {sponsorship.beneficiary.code}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className={
                              sponsorship.beneficiary.homeType === "ORPHAN_GIRLS"
                                ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                                : sponsorship.beneficiary.homeType === "BLIND_BOYS"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            }
                          >
                            {sponsorship.beneficiary.homeType === "ORPHAN_GIRLS"
                              ? "Orphan Girls"
                              : sponsorship.beneficiary.homeType === "BLIND_BOYS"
                                ? "Blind Boys"
                                : "Old Age"}
                          </Badge>

                          <Badge variant="secondary">
                            {sponsorship.sponsorshipType}
                          </Badge>

                          <Badge variant="outline">{frequencyLabel}</Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            {sponsorship.amount ? (
                              <p
                                className="font-semibold"
                                data-testid={`text-donor-sponsorship-amount-${sponsorship.id}`}
                              >
                                {sponsorship.currency === "INR" ? "₹" : "$"}
                                {sponsorship.amount.toLocaleString()}
                                <span className="text-xs font-normal text-muted-foreground">
                                  /{frequencyLabel.toLowerCase()}
                                </span>
                              </p>
                            ) : sponsorship.inKindItem ? (
                              <p className="text-sm">{sponsorship.inKindItem}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">-</p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">Start Date</p>
                            <p
                              className="text-sm"
                              data-testid={`text-donor-sponsorship-start-${sponsorship.id}`}
                            >
                              {sponsorship.startDate
                                ? new Date(sponsorship.startDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : sponsorship.createdAt
                                  ? new Date(sponsorship.createdAt).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">End Date</p>
                            <p
                              className="text-sm"
                              data-testid={`text-donor-sponsorship-end-${sponsorship.id}`}
                            >
                              {sponsorship.endDate
                                ? new Date(sponsorship.endDate).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Ongoing"}
                            </p>
                          </div>
                        </div>

                        {sponsorship.beneficiary.updates &&
                          sponsorship.beneficiary.updates.length > 0 && (
                            <div className="mt-3 border-t pt-3 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Latest Updates
                              </p>

                              {sponsorship.beneficiary.updates.map((update) => (
                                <div
                                  key={update.id}
                                  className="flex items-start gap-2 text-sm"
                                  data-testid={`text-update-${update.id}`}
                                >
                                  <Badge
                                    variant="outline"
                                    className="text-xs flex-shrink-0 mt-0.5"
                                  >
                                    {update.updateType}
                                  </Badge>

                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">
                                      {update.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {update.content}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {new Date(update.createdAt).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                        <div className="flex gap-2 mt-3 flex-wrap">
                          {canEditSponsorship && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onOpenStatusChange(sponsorship)}
                                  data-testid={`button-change-status-donor-sponsorship-${sponsorship.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Status
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Change sponsorship status</TooltipContent>
                            </Tooltip>
                          )}

                          {canEditSponsorship && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onViewHistory(sponsorship)}
                                  data-testid={`button-history-donor-sponsorship-${sponsorship.id}`}
                                >
                                  <History className="h-4 w-4 mr-1" />
                                  History
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View change history</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSendWhatsApp(sponsorship, sponsorshipMessage)}
                                data-testid={`button-whatsapp-sponsorship-${sponsorship.id}`}
                              >
                                <SiWhatsapp className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send WhatsApp message</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onCopyMessage(sponsorshipMessage)}
                                data-testid={`button-copy-sponsorship-${sponsorship.id}`}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy message to clipboard</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewBeneficiary(sponsorship.beneficiaryId)}
                                data-testid={`button-view-beneficiary-${sponsorship.id}`}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View beneficiary profile</TooltipContent>
                          </Tooltip>

                          {canEditSponsorship && onDeleteSponsorship && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => onDeleteSponsorship(sponsorship.id)}
                                  data-testid={`button-delete-sponsorship-${sponsorship.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete sponsorship</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
