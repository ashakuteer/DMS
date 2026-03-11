"use client";

import { ArrowLeft, Edit, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { resolveImageUrl } from "@/lib/image-url";
import type { Donor } from "../types";
import { getCategoryColor } from "../utils";

interface DonorHeaderProps {
  donor: Donor;
  donorId: string;
  isDataMasked: boolean;
  canEdit: boolean;
  requestingAccess: boolean;
  onBack: () => void;
  onEdit: () => void;
  onRequestAccess: () => void;
  getDonorName: () => string;
  getInitials: () => string;
}

export default function DonorHeader({
  donor,
  isDataMasked,
  canEdit,
  requestingAccess,
  onBack,
  onEdit,
  onRequestAccess,
  getDonorName,
  getInitials,
}: DonorHeaderProps) {
  const profileImageUrl = resolveImageUrl(donor.profilePicUrl);

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-16 w-16">
          <AvatarImage src={profileImageUrl} />
          <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
        </Avatar>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className="text-2xl font-bold text-foreground"
              data-testid="text-donor-name"
            >
              {getDonorName()}
            </h1>

            <Badge variant="outline">{donor.donorCode}</Badge>

            <Badge className={getCategoryColor(donor.category)}>
              {donor.category.replace(/_/g, " ")}
            </Badge>

            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={`flex items-center gap-1 ${
                    donor.healthStatus === "GREEN"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : donor.healthStatus === "YELLOW"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        : donor.healthStatus === "RED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                  data-testid="badge-health-score"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      donor.healthStatus === "GREEN"
                        ? "bg-green-500"
                        : donor.healthStatus === "YELLOW"
                          ? "bg-yellow-500"
                          : donor.healthStatus === "RED"
                            ? "bg-red-500"
                            : "bg-gray-400"
                    }`}
                  />
                  {donor.healthScore ?? 100}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Relationship Health:{" "}
                  {donor.healthStatus === "GREEN"
                    ? "Healthy"
                    : donor.healthStatus === "YELLOW"
                      ? "Needs Attention"
                      : donor.healthStatus === "RED"
                        ? "At Risk"
                        : "Unknown"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <p className="text-muted-foreground">
            {donor.profession || "No profession specified"}
            {donor.city && ` • ${donor.city}`}
            {donor.state && `, ${donor.state}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isDataMasked && (
          <Button
            variant="outline"
            onClick={onRequestAccess}
            disabled={requestingAccess}
            data-testid="button-request-access"
          >
            <Lock className="mr-2 h-4 w-4" />
            {requestingAccess ? "Requesting..." : "Request Full Access"}
          </Button>
        )}

        {canEdit && (
          <Button onClick={onEdit} data-testid="button-edit-donor">
            <Edit className="mr-2 h-4 w-4" />
            Edit Donor
          </Button>
        )}
      </div>
    </div>
  );
}
