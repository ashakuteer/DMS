"use client";

import { Calendar, Heart, Loader2, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import type { SpecialOccasion, SpecialOccasionFormData } from "../types";
import { formatMonthDay, getOccasionTypeLabel } from "../utils";
import SpecialOccasionDialog from "../dialogs/SpecialOccasionDialog";

interface UpcomingOccasion extends SpecialOccasion {
  daysUntil: number;
}

interface DonorSpecialDaysTabProps {
  upcomingOccasions: UpcomingOccasion[];
  specialOccasions: SpecialOccasion[];
  specialOccasionsLoading: boolean;
  canEditFamilyAndSpecialDays: boolean;
  deletingSpecialOccasionId: string | null;
  onAdd: () => void;
  onEdit: (occasion: SpecialOccasion) => void;
  onDelete: (occasionId: string) => void;
  showSpecialOccasionDialog: boolean;
  setShowSpecialOccasionDialog: (open: boolean) => void;
  editingSpecialOccasion: boolean;
  specialOccasionForm: SpecialOccasionFormData;
  setSpecialOccasionForm: (form: SpecialOccasionFormData) => void;
  savingSpecialOccasion: boolean;
  handleSpecialOccasionSubmit: (e: React.FormEvent) => void;
}

export default function DonorSpecialDaysTab({
  upcomingOccasions,
  specialOccasions,
  specialOccasionsLoading,
  canEditFamilyAndSpecialDays,
  deletingSpecialOccasionId,
  onAdd,
  onEdit,
  onDelete,
  showSpecialOccasionDialog,
  setShowSpecialOccasionDialog,
  editingSpecialOccasion,
  specialOccasionForm,
  setSpecialOccasionForm,
  savingSpecialOccasion,
  handleSpecialOccasionSubmit,
}: DonorSpecialDaysTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {upcomingOccasions.length > 0 && (
        <Card className="border-[#5FA8A8] bg-[#E6F4F1]/50 dark:bg-[#5FA8A8]/20 dark:border-[#5FA8A8]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#5FA8A8]" />
              {t("donor_profile.upcoming_30_days")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {upcomingOccasions.map((occasion) => (
                <Badge
                  key={occasion.id}
                  variant="secondary"
                  className="bg-[#E6F4F1] dark:bg-[#5FA8A8]/20"
                >
                  {getOccasionTypeLabel(occasion.type)} -{" "}
                  {occasion.daysUntil === 0
                    ? t("donor_profile.today")
                    : t("donor_profile.days_count", { count: occasion.daysUntil })}
                  {occasion.relatedPersonName && ` (${occasion.relatedPersonName})`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>{t("donor_profile.tab_special_days")}</CardTitle>
            <CardDescription>
              {t("donor_profile.special_days_description")}
            </CardDescription>
          </div>

          {canEditFamilyAndSpecialDays && (
            <Button onClick={onAdd} data-testid="button-add-special-day">
              <Plus className="mr-2 h-4 w-4" />
              {t("donor_profile.add_special_day")}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {specialOccasionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : specialOccasions.length ? (
            <div className="space-y-3">
              {specialOccasions.map((occasion) => (
                <div
                  key={occasion.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`special-occasion-item-${occasion.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-full">
                      <Heart className="h-4 w-4 text-pink-600" />
                    </div>

                    <div>
                      <p className="font-medium">
                        {getOccasionTypeLabel(occasion.type)}
                      </p>

                      {occasion.relatedPersonName && (
                        <p className="text-sm text-muted-foreground">
                          {occasion.relatedPersonName}
                        </p>
                      )}

                      {occasion.notes && (
                        <p className="text-sm text-muted-foreground">
                          {occasion.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2">
                      <p className="text-sm">
                        {formatMonthDay(occasion.month, occasion.day)}
                      </p>
                    </div>

                    {canEditFamilyAndSpecialDays && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(occasion)}
                          data-testid={`button-edit-special-occasion-${occasion.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(occasion.id)}
                          disabled={deletingSpecialOccasionId === occasion.id}
                          data-testid={`button-delete-special-occasion-${occasion.id}`}
                        >
                          {deletingSpecialOccasionId === occasion.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t("donor_profile.no_special_days")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SpecialOccasionDialog
        open={showSpecialOccasionDialog}
        onOpenChange={setShowSpecialOccasionDialog}
        editingSpecialOccasion={editingSpecialOccasion}
        specialOccasionForm={specialOccasionForm}
        setSpecialOccasionForm={setSpecialOccasionForm}
        savingSpecialOccasion={savingSpecialOccasion}
        onSubmit={handleSpecialOccasionSubmit}
      />
    </div>
  );
}
