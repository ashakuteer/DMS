"use client";

import { Building, Lock, MapPin, MessageSquare, Phone, Star, User, Activity, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AssignDonorOwner from "./AssignDonorOwner";
import type { Donor } from "../types";
import { formatDate, getDonorLoyaltyTier } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/auth";
import { API_URL } from "@/lib/api-config";

interface DonorOverviewTabProps {
  donor: Donor;
  isDataMasked: boolean;
}

interface HealthScoreData {
  score: number;
  status: string;
  breakdown: {
    recency: number;
    frequency: number;
    lifetimeValue: number;
    yearsSupporting: number;
  };
}

interface PredictionData {
  probability: number;
  expectedDonation: number;
  averageDonation: number;
  lastDonationDate: string | null;
  donationCount: number;
}

function getHealthColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-blue-600";
  if (score >= 30) return "text-amber-600";
  return "text-red-600";
}

function getHealthBadgeClass(status: string) {
  if (status === "Healthy Donor") return "bg-green-100 text-green-800";
  if (status === "Active Donor") return "bg-blue-100 text-blue-800";
  if (status === "At Risk Donor") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function getProbabilityColor(prob: number) {
  if (prob >= 70) return "text-green-600";
  if (prob >= 45) return "text-amber-600";
  return "text-red-600";
}

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function DonorOverviewTab({
  donor,
  isDataMasked,
}: DonorOverviewTabProps) {
  const { data: healthScore, isLoading: healthLoading } =
    useQuery<HealthScoreData>({
      queryKey: ["/api/donors", donor.id, "health-score"],
      queryFn: () =>
        fetchWithAuth(`${API_URL}/api/donors/${donor.id}/health-score`).then(
          (r) => r.json()
        ),
    });

  const { data: prediction, isLoading: predLoading } =
    useQuery<PredictionData>({
      queryKey: ["/api/donors", donor.id, "prediction"],
      queryFn: () =>
        fetchWithAuth(`${API_URL}/api/donors/${donor.id}/prediction`).then(
          (r) => r.json()
        ),
    });

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

          {(() => {
            const loyalty = getDonorLoyaltyTier(donor.donorSince ?? donor.createdAt);
            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Donor Since</span>
                  <span data-testid="text-donor-since">
                    {new Date(donor.donorSince ?? donor.createdAt).getFullYear()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Supporting For</span>
                  <span data-testid="text-supporting-years">
                    {loyalty.years === 0
                      ? "Less than a year"
                      : `${loyalty.years} year${loyalty.years !== 1 ? "s" : ""}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Loyalty</span>
                  <Badge className={`text-xs ${loyalty.colorClass}`} data-testid="badge-loyalty-overview">
                    {loyalty.label}
                  </Badge>
                </div>
              </>
            );
          })()}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Created On</span>
            <span>{formatDate(donor.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-health-score">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Donor Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : healthScore ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span
                    className={`text-4xl font-bold ${getHealthColor(healthScore.score)}`}
                    data-testid="text-health-score"
                  >
                    {healthScore.score}
                    <span className="text-lg font-normal text-muted-foreground">
                      /100
                    </span>
                  </span>
                  <Badge
                    className={`text-xs ${getHealthBadgeClass(healthScore.status)}`}
                    data-testid="badge-health-status"
                  >
                    {healthScore.status}
                  </Badge>
                </div>

                <Progress value={healthScore.score} className="h-2" />

                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Score Breakdown
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recency</span>
                      <span className="font-medium">+{healthScore.breakdown.recency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium">+{healthScore.breakdown.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lifetime Value</span>
                      <span className="font-medium">+{healthScore.breakdown.lifetimeValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Years Supporting</span>
                      <span className="font-medium">+{healthScore.breakdown.yearsSupporting}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-donation-prediction">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Donation Prediction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : prediction ? (
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Donation Probability
                    </p>
                    <span
                      className={`text-4xl font-bold ${getProbabilityColor(prediction.probability)}`}
                      data-testid="text-donation-probability"
                    >
                      {prediction.probability}%
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Expected Amount
                    </p>
                    <span
                      className="text-2xl font-semibold"
                      data-testid="text-expected-donation"
                    >
                      {formatRupees(prediction.expectedDonation)}
                    </span>
                  </div>
                </div>

                <Progress value={prediction.probability} className="h-2" />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average Donation</span>
                    <span className="font-medium" data-testid="text-avg-donation">
                      {formatRupees(prediction.averageDonation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Donations</span>
                    <span className="font-medium">{prediction.donationCount}</span>
                  </div>
                  {prediction.lastDonationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Donation</span>
                      <span className="font-medium">
                        {formatDate(prediction.lastDonationDate)}
                      </span>
                    </div>
                  )}
                  {prediction.donationCount === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No donation history — probability based on new donor baseline.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
