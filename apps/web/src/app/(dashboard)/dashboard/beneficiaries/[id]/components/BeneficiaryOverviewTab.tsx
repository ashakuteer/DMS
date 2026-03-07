"use client";

import { Book, Ruler, Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import type { Beneficiary } from "../types";
import { getHealthStatusBadgeClass, getHealthStatusLabel } from "../utils";

interface BeneficiaryOverviewTabProps {
  beneficiary: Beneficiary;
}

export default function BeneficiaryOverviewTab({
  beneficiary,
}: BeneficiaryOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Book className="h-5 w-5" />
              Education & Background
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {beneficiary.educationClassOrRole && (
              <div>
                <Label className="text-xs text-muted-foreground">Class / Role</Label>
                <p>{beneficiary.educationClassOrRole}</p>
              </div>
            )}

            {beneficiary.schoolOrCollege && (
              <div>
                <Label className="text-xs text-muted-foreground">School / College</Label>
                <p>{beneficiary.schoolOrCollege}</p>
              </div>
            )}

            {beneficiary.background && (
              <div>
                <Label className="text-xs text-muted-foreground">Background</Label>
                <p className="text-sm">{beneficiary.background}</p>
              </div>
            )}

            {beneficiary.currentHealthStatus && (
              <div>
                <Label className="text-xs text-muted-foreground">Current Health Status</Label>
                <Badge className={`mt-1 ${getHealthStatusBadgeClass(beneficiary.currentHealthStatus)}`}>
                  {getHealthStatusLabel(beneficiary.currentHealthStatus)}
                </Badge>
              </div>
            )}

            {beneficiary.healthNotes && (
              <div>
                <Label className="text-xs text-muted-foreground">Health Notes</Label>
                <p className="text-sm">{beneficiary.healthNotes}</p>
              </div>
            )}

            {!beneficiary.educationClassOrRole &&
              !beneficiary.schoolOrCollege &&
              !beneficiary.background &&
              !beneficiary.healthNotes &&
              !beneficiary.currentHealthStatus && (
                <p className="text-muted-foreground text-sm">
                  No education information available
                </p>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5" />
              Interests & Aspirations
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {beneficiary.dreamCareer && (
              <div>
                <Label className="text-xs text-muted-foreground">Dream Career</Label>
                <p>{beneficiary.dreamCareer}</p>
              </div>
            )}

            {beneficiary.hobbies && (
              <div>
                <Label className="text-xs text-muted-foreground">Hobbies</Label>
                <p>{beneficiary.hobbies}</p>
              </div>
            )}

            {beneficiary.favouriteSubject && (
              <div>
                <Label className="text-xs text-muted-foreground">Favourite Subject</Label>
                <p>{beneficiary.favouriteSubject}</p>
              </div>
            )}

            {beneficiary.favouriteGame && (
              <div>
                <Label className="text-xs text-muted-foreground">Favourite Game</Label>
                <p>{beneficiary.favouriteGame}</p>
              </div>
            )}

            {beneficiary.favouriteActivityAtHome && (
              <div>
                <Label className="text-xs text-muted-foreground">Favourite Activity at Home</Label>
                <p>{beneficiary.favouriteActivityAtHome}</p>
              </div>
            )}

            {beneficiary.bestFriend && (
              <div>
                <Label className="text-xs text-muted-foreground">Best Friend</Label>
                <p>{beneficiary.bestFriend}</p>
              </div>
            )}

            {beneficiary.sourceOfPrideOrHappiness && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Source of Pride / Happiness
                </Label>
                <p>{beneficiary.sourceOfPrideOrHappiness}</p>
              </div>
            )}

            {beneficiary.funFact && (
              <div>
                <Label className="text-xs text-muted-foreground">Fun Fact</Label>
                <p className="text-sm">{beneficiary.funFact}</p>
              </div>
            )}

            {!beneficiary.dreamCareer &&
              !beneficiary.hobbies &&
              !beneficiary.favouriteSubject &&
              !beneficiary.favouriteGame &&
              !beneficiary.favouriteActivityAtHome &&
              !beneficiary.bestFriend &&
              !beneficiary.sourceOfPrideOrHappiness &&
              !beneficiary.funFact && (
                <p className="text-muted-foreground text-sm">
                  No interests information available
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {(beneficiary.heightCmAtJoin || beneficiary.weightKgAtJoin) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Initial Measurements (at Join)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-6">
              {beneficiary.heightCmAtJoin && (
                <div data-testid="text-height-at-join">
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <p className="text-lg font-semibold">{beneficiary.heightCmAtJoin} cm</p>
                </div>
              )}

              {beneficiary.weightKgAtJoin && (
                <div data-testid="text-weight-at-join">
                  <Label className="text-xs text-muted-foreground">Weight</Label>
                  <p className="text-lg font-semibold">{beneficiary.weightKgAtJoin} kg</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {beneficiary.additionalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Notes</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm">{beneficiary.additionalNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
