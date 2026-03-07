"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Camera, Edit, Heart, Link, Loader2, MessageSquare, Stethoscope, User, X } from "lucide-react";

import type { Beneficiary } from "../types";
import {
  formatAge,
  getHealthStatusBadgeClass,
  getHealthStatusLabel,
  getHomeTypeBadgeColor,
  getHomeTypeLabel,
} from "../utils";

interface BeneficiaryHeaderProps {
  beneficiary: Beneficiary;
  canEdit: boolean;
  isAdmin: boolean;
  photoUploading: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoRemove: () => void;
  onOpenLinkPhoto: () => void;
  onOpenEdit: () => void;
}

export default function BeneficiaryHeader({
  beneficiary,
  canEdit,
  isAdmin,
  photoUploading,
  onPhotoUpload,
  onPhotoRemove,
  onOpenLinkPhoto,
  onOpenEdit,
}: BeneficiaryHeaderProps) {
  return (
    <div className="pt-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0 relative group">
          <Avatar className="h-24 w-24">
            <AvatarImage src={beneficiary.photoUrl || undefined} alt={beneficiary.fullName} />
            <AvatarFallback className="text-2xl">
              {beneficiary.fullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {canEdit && (
            <>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="photo-upload"
                onChange={onPhotoUpload}
                data-testid="input-photo-upload"
              />

              <label
                htmlFor="photo-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                data-testid="button-upload-photo"
              >
                {photoUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </label>

              {beneficiary.photoUrl && (
                <button
                  onClick={onPhotoRemove}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 invisible group-hover:visible"
                  disabled={photoUploading}
                  data-testid="button-remove-photo"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          )}

          {isAdmin && !beneficiary.photoUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={onOpenLinkPhoto}
              data-testid="button-link-existing-photo"
            >
              <Link className="h-3 w-3 mr-1" />
              Link Photo
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-beneficiary-name">
                {beneficiary.fullName}
              </h1>
              <p className="text-muted-foreground font-mono" data-testid="text-beneficiary-code">
                {beneficiary.code}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getHomeTypeBadgeColor(beneficiary.homeType)}>
                {getHomeTypeLabel(beneficiary.homeType)}
              </Badge>

              <Badge variant={beneficiary.status === "ACTIVE" ? "default" : "secondary"}>
                {beneficiary.status}
              </Badge>

              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenEdit}
                  data-testid="button-edit-beneficiary"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatAge(
                beneficiary.dobDay,
                beneficiary.dobMonth,
                beneficiary.dobYear,
                beneficiary.approxAge
              )}
            </span>

            {beneficiary.gender && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {beneficiary.gender}
              </span>
            )}

            {beneficiary.currentHealthStatus && (
              <Badge
                className={getHealthStatusBadgeClass(beneficiary.currentHealthStatus)}
                data-testid="badge-current-health-status"
              >
                <Stethoscope className="h-3 w-3 mr-1" />
                {getHealthStatusLabel(beneficiary.currentHealthStatus)}
              </Badge>
            )}

            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-pink-500" />
              {beneficiary.activeSponsorsCount} Sponsors
            </span>

            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {beneficiary.updatesCount} Updates
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
