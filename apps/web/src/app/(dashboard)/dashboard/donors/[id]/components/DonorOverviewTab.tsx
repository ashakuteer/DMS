"use client";

import { Building, Lock, MapPin, MessageSquare, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AssignDonorOwner from "./AssignDonorOwner";
import type { Donor } from "../types";
import { formatDate } from "../utils";

interface DonorOverviewTabProps {
  donor: Donor;
  isDataMasked: boolean;
}

export default function DonorOverviewTab({
  donor,
  isDataMasked,
}: DonorOverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {donor.primaryPhone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Primary Phone</span>
                <span
                  className="flex items-center gap-1"
                  data-testid="text-primary-phone"
                >
                  {donor.primaryPhoneCode} {donor.primaryPhone}
                  {isDataMasked && donor.primaryPhone?.includes("*") && (
                    <Lock className="h-3 w-3 text-amber-500" />
                  )}
                </span>
              </div>
            )}

            {donor.alternatePhone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Alternate Phone</span>
                <span>{donor.alternatePhone}</span>
              </div>
            )}

            {donor.whatsappPhone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">WhatsApp</span>
                <span>{donor.whatsappPhone}</span>
              </div>
            )}

            {donor.personalEmail && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Personal Email</span>
                <span
                  className="flex items-center gap-1"
                  data-testid="text-personal-email"
                >
                  {donor.personalEmail}
                  {isDataMasked && donor.personalEmail?.includes("*") && (
                    <Lock className="h-3 w-3 text-amber-500" />
                  )}
                </span>
              </div>
            )}

            {donor.officialEmail && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Official Email</span>
                <span>{donor.officialEmail}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {donor.address && (
              <div>
                <span className="text-muted-foreground block mb-1">
                  Street Address
                </span>
                <span>{donor.address}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">City</span>
              <span>{donor.city || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">State</span>
              <span>{donor.state || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Country</span>
              <span>{donor.country || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pincode</span>
              <span>{donor.pincode || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gender</span>
              <span>{donor.gender?.replace(/_/g, " ") || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Age</span>
              <span>
                {donor.approximateAge ? `~${donor.approximateAge} years` : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Religion</span>
              <span>{donor.religion || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Profession</span>
              <span>{donor.profession || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Income Level</span>
              <span>{donor.incomeSpectrum?.replace(/_/g, " ") || "-"}</span>
            </div>
            {donor.pan && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">PAN</span>
                <span>{donor.pan}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Donation Frequency</span>
              <span>{donor.donationFrequency?.replace(/_/g, " ") || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Timezone</span>
              <span>{donor.timezone || "-"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-2">
                Communication
              </span>
              <div className="flex flex-wrap gap-2">
                {donor.prefEmail && <Badge variant="secondary">Email</Badge>}
                {donor.prefWhatsapp && <Badge variant="secondary">WhatsApp</Badge>}
                {donor.prefSms && <Badge variant="secondary">SMS</Badge>}
                {donor.prefReminders && <Badge variant="secondary">Reminders</Badge>}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-2">
                Support Preferences
              </span>
              <div className="flex flex-wrap gap-2">
                {donor.supportPreferences && donor.supportPreferences.length > 0 ? (
                  donor.supportPreferences.map((pref: string) => (
                    <Badge
                      key={pref}
                      variant="secondary"
                      data-testid={`badge-support-pref-${pref.toLowerCase()}`}
                    >
                      {pref.charAt(0) + pref.slice(1).toLowerCase()}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">None</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-2">
                Special Flags
              </span>
              <div className="flex flex-wrap gap-2">
                {donor.isUnder18Helper && <Badge>Under 18 Helper</Badge>}
                {donor.isSeniorCitizen && <Badge>Senior Citizen</Badge>}
                {donor.isSingleParent && <Badge>Single Parent</Badge>}
                {donor.isDisabled && <Badge>Disabled</Badge>}
                {!donor.isUnder18Helper &&
                  !donor.isSeniorCitizen &&
                  !donor.isSingleParent &&
                  !donor.isDisabled && (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {donor.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{donor.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Source & Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source</span>
            <span>{donor.sourceOfDonor?.replace(/_/g, " ") || "-"}</span>
          </div>

          {donor.sourceDetails && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Source Details</span>
              <span>{donor.sourceDetails}</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground pt-2">Assigned To</span>
            <div className="w-[320px] max-w-full">
              <AssignDonorOwner
                donorId={donor.id}
                currentOwner={donor.assignedTo ?? null}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created By</span>
            <span>{donor.createdBy?.name || "-"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Donor Since</span>
            <span>{formatDate(donor.donorSince ?? donor.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created On</span>
            <span>{formatDate(donor.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
