"use client";

import { Calendar, Heart, Loader2, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <div className="space-y-4">
      {upcomingOccasions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              Upcoming in Next 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {upcomingOccasions.map((occasion) => (
                <Badge
                  key={occasion.id}
                  variant="secondary"
                  className="bg-amber-100 dark:bg-amber-900/30"
                >
                  {getOccasionTypeLabel(occasion.type)} -{" "}
                  {occasion.daysUntil === 0
                    ? "Today!"
                    : `${occasion.daysUntil} days`}
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
            <CardTitle>Special Days</CardTitle>
            <CardDescription>
              Birthdays, anniversaries, and other important dates
            </CardDescription>
          </div>

          {canEditFamilyAndSpecialDays && (
            <Button onClick={onAdd} data-testid="button-add-special-day">
              <Plus className="mr-2 h-4 w-4" />
              Add Special Day
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
              <p>No special days recorded</p>
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
