"use client";

import { useState } from "react";
import { Building, Lock, MapPin, MessageSquare, Phone, Star, User, Activity, TrendingUp, Loader2, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import type { Donor } from "../types";
import { formatDate, getDonorLoyaltyTier } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { fetchWithAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

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
  if (score >= 30) return "text-[#5FA8A8]";
  return "text-red-600";
}

function getHealthBadgeClass(status: string) {
  if (status === "Healthy Donor") return "bg-green-100 text-green-800";
  if (status === "Active Donor") return "bg-blue-100 text-blue-800";
  if (status === "At Risk Donor") return "bg-[#E6F4F1] text-[#5FA8A8]";
  return "bg-red-100 text-red-800";
}

function getProbabilityColor(prob: number) {
  if (prob >= 70) return "text-green-600";
  if (prob >= 45) return "text-[#5FA8A8]";
  return "text-red-600";
}

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function DonorOverviewTab({
  donor,
  isDataMasked,
}: DonorOverviewTabProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  // Local optimistic state for inline-editable status fields
  const [twilioStatus, setTwilioStatus] = useState<string>(
    donor.twilioStatus ?? "UNKNOWN",
  );
  const [googleReviewStatus, setGoogleReviewStatus] = useState<string>(
    donor.googleReviewStatus ?? "UNKNOWN",
  );
  const [savingTwilio, setSavingTwilio] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);

  async function handleStatusChange(
    field: "twilioStatus" | "googleReviewStatus",
    value: string,
    setter: (v: string) => void,
    prevValue: string,
    setSaving: (v: boolean) => void,
  ) {
    setter(value);
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/donors/${donor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Saved", description: "Status updated successfully." });
    } catch {
      setter(prevValue); // revert on failure
      toast({ title: "Error", description: "Could not save status.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const { data: healthScore, isLoading: healthLoading } =
    useQuery<HealthScoreData>({
      queryKey: ["/api/donors", donor.id, "health-score"],
      queryFn: () =>
        apiClient<HealthScoreData>(`/api/donors/${donor.id}/health-score`),
    });

  const { data: prediction, isLoading: predLoading } =
    useQuery<PredictionData>({
      queryKey: ["/api/donors", donor.id, "prediction"],
      queryFn: () =>
        apiClient<PredictionData>(`/api/donors/${donor.id}/prediction`),
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              {t("donor_profile.contact_information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {donor.primaryPhone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("donor_profile.primary_phone")}</span>
                <span
                  className="flex items-center gap-1"
                  data-testid="text-primary-phone"
                >
                  {donor.primaryPhoneCode} {donor.primaryPhone}
                  {isDataMasked && donor.primaryPhone?.includes("*") && (
                    <Lock className="h-3 w-3 text-[#5FA8A8]" />
                  )}
                </span>
              </div>
            )}

            {donor.alternatePhone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("donor_profile.alternate_phone")}</span>
                <span>{donor.alternatePhone}</span>
              </div>
            )}

            {donor.whatsappPhone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("donor_profile.whatsapp")}</span>
                <span>{donor.whatsappPhone}</span>
              </div>
            )}

            {donor.personalEmail && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("donor_profile.personal_email")}</span>
                <span
                  className="flex items-center gap-1"
                  data-testid="text-personal-email"
                >
                  {donor.personalEmail}
                  {isDataMasked && donor.personalEmail?.includes("*") && (
                    <Lock className="h-3 w-3 text-[#5FA8A8]" />
                  )}
                </span>
              </div>
            )}

            {donor.officialEmail && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("donor_profile.official_email")}</span>
                <span>{donor.officialEmail}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("donor_profile.address")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {donor.address && (
              <div>
                <span className="text-muted-foreground block mb-1">
                  {t("donor_profile.street_address")}
                </span>
                <span>{donor.address}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.city")}</span>
              <span>{donor.city || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.state")}</span>
              <span>{donor.state || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.country")}</span>
              <span>{donor.country || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.pincode")}</span>
              <span>{donor.pincode || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("donor_profile.personal_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.gender")}</span>
              <span>{donor.gender?.replace(/_/g, " ") || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.age")}</span>
              <span>
                {donor.approximateAge ? t("donor_profile.approx_years", { age: donor.approximateAge }) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.religion")}</span>
              <span>{donor.religion || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.profession")}</span>
              <span>{donor.profession || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.income_level")}</span>
              <span>{donor.incomeSpectrum?.replace(/_/g, " ") || "-"}</span>
            </div>
            {donor.pan && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("donor_profile.pan")}</span>
                <span>{donor.pan}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("donor_profile.preferences")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.donation_frequency")}</span>
              <span>{donor.donationFrequency?.replace(/_/g, " ") || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.timezone")}</span>
              <span>{donor.timezone || "-"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-2">
                {t("donor_profile.communication")}
              </span>
              <div className="flex flex-wrap gap-2">
                {donor.prefEmail && <Badge variant="secondary">{t("donor_profile.pref_email")}</Badge>}
                {donor.prefWhatsapp && <Badge variant="secondary">{t("donor_profile.pref_whatsapp")}</Badge>}
                {donor.prefSms && <Badge variant="secondary">{t("donor_profile.pref_sms")}</Badge>}
                {donor.prefReminders && <Badge variant="secondary">{t("donor_profile.pref_reminders")}</Badge>}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-2">
                {t("donor_profile.support_preferences")}
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
                  <span className="text-sm text-muted-foreground">{t("donor_profile.none")}</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-2">
                {t("donor_profile.special_flags")}
              </span>
              <div className="flex flex-wrap gap-2">
                {donor.isUnder18Helper && <Badge>{t("donor_profile.flag_under18")}</Badge>}
                {donor.isSeniorCitizen && <Badge>{t("donor_profile.flag_senior")}</Badge>}
                {donor.isSingleParent && <Badge>{t("donor_profile.flag_single_parent")}</Badge>}
                {donor.isDisabled && <Badge>{t("donor_profile.flag_disabled")}</Badge>}
                {!donor.isUnder18Helper &&
                  !donor.isSeniorCitizen &&
                  !donor.isSingleParent &&
                  !donor.isDisabled && (
                    <span className="text-sm text-muted-foreground">{t("donor_profile.none")}</span>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {donor.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t("donor_profile.notes")}</CardTitle>
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
            {t("donor_profile.source_assignment")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("donor_profile.source")}</span>
            <span>{donor.sourceOfDonor?.replace(/_/g, " ") || "-"}</span>
          </div>

          {donor.sourceDetails && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("donor_profile.source_details")}</span>
              <span>{donor.sourceDetails}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("donor_profile.assigned_to")}</span>
            <span data-testid="text-assigned-to">
              {donor.assignedTo ? donor.assignedTo.name : t("donor_profile.unassigned")}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("donor_profile.created_by")}</span>
            <span>{donor.createdBy?.name || "-"}</span>
          </div>

          {(() => {
            const loyalty = getDonorLoyaltyTier(donor.donorSince ?? donor.createdAt);
            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("donor_profile.donor_since_label")}</span>
                  <span data-testid="text-donor-since">
                    {new Date(donor.donorSince ?? donor.createdAt).getFullYear()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("donor_profile.supporting_for")}</span>
                  <span data-testid="text-supporting-years">
                    {loyalty.years === 0
                      ? t("donor_profile.less_than_year")
                      : t("donor_profile.years_count", { count: loyalty.years })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("donor_profile.loyalty")}</span>
                  <Badge className={`text-xs ${loyalty.colorClass}`} data-testid="badge-loyalty-overview">
                    {loyalty.label}
                  </Badge>
                </div>
              </>
            );
          })()}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("donor_profile.created_on")}</span>
            <span>{formatDate(donor.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-health-score">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("donor_profile.health_score_title")}
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
                    {t("donor_profile.score_breakdown")}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("donor_profile.recency")}</span>
                      <span className="font-medium">+{healthScore.breakdown.recency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("donor_profile.frequency")}</span>
                      <span className="font-medium">+{healthScore.breakdown.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("donor_profile.lifetime_value")}</span>
                      <span className="font-medium">+{healthScore.breakdown.lifetimeValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("donor_profile.years_supporting")}</span>
                      <span className="font-medium">+{healthScore.breakdown.yearsSupporting}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("donor_profile.no_data")}</p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-donation-prediction">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("donor_profile.donation_prediction")}
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
                      {t("donor_profile.donation_probability")}
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
                      {t("donor_profile.expected_amount")}
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
                    <span className="text-muted-foreground">{t("donor_profile.average_donation")}</span>
                    <span className="font-medium" data-testid="text-avg-donation">
                      {formatRupees(prediction.averageDonation)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("donor_profile.total_donations")}</span>
                    <span className="font-medium">{prediction.donationCount}</span>
                  </div>
                  {prediction.lastDonationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t("donor_profile.last_donation")}</span>
                      <span className="font-medium">
                        {formatDate(prediction.lastDonationDate)}
                      </span>
                    </div>
                  )}
                  {prediction.donationCount === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      {t("donor_profile.no_donation_history")}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("donor_profile.no_data")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Outreach Status Card ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Outreach Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Twilio / WhatsApp Status */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Twilio / WhatsApp Status</p>
              <p className="text-xs text-muted-foreground">
                Whether this donor's number is reachable via Twilio
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {savingTwilio && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Select
                value={twilioStatus}
                onValueChange={(val) =>
                  handleStatusChange(
                    "twilioStatus",
                    val,
                    setTwilioStatus,
                    twilioStatus,
                    setSavingTwilio,
                  )
                }
                disabled={savingTwilio}
              >
                <SelectTrigger
                  className="w-36 h-8 text-xs"
                  data-testid="select-twilio-status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNKNOWN">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                      Unknown
                    </span>
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="NOT_ACTIVE">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                      Not Active
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${
                  twilioStatus === "ACTIVE"
                    ? "border-green-400 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300"
                    : twilioStatus === "NOT_ACTIVE"
                    ? "border-red-400 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300"
                    : "border-gray-300 text-gray-500"
                }`}
                data-testid="badge-twilio-status"
              >
                {twilioStatus === "ACTIVE" ? "Active" : twilioStatus === "NOT_ACTIVE" ? "Not Active" : "Unknown"}
              </Badge>
            </div>
          </div>

          <div className="border-t" />

          {/* Google Review Status */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Google Review Status</p>
              <p className="text-xs text-muted-foreground">
                Whether this donor has submitted a Google review
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {savingGoogle && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Select
                value={googleReviewStatus}
                onValueChange={(val) =>
                  handleStatusChange(
                    "googleReviewStatus",
                    val,
                    setGoogleReviewStatus,
                    googleReviewStatus,
                    setSavingGoogle,
                  )
                }
                disabled={savingGoogle}
              >
                <SelectTrigger
                  className="w-36 h-8 text-xs"
                  data-testid="select-google-review-status"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNKNOWN">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
                      Unknown
                    </span>
                  </SelectItem>
                  <SelectItem value="GIVEN">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      Given
                    </span>
                  </SelectItem>
                  <SelectItem value="NOT_GIVEN">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                      Not Given
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${
                  googleReviewStatus === "GIVEN"
                    ? "border-green-400 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300"
                    : googleReviewStatus === "NOT_GIVEN"
                    ? "border-yellow-400 text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300"
                    : "border-gray-300 text-gray-500"
                }`}
                data-testid="badge-google-review-status"
              >
                {googleReviewStatus === "GIVEN" ? "Given" : googleReviewStatus === "NOT_GIVEN" ? "Not Given" : "Unknown"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
