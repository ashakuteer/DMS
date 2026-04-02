"use client";

import { Loader2, Plus, Pencil, Trash2, Users, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PeopleAndOccasionsDialog from "../dialogs/PeopleAndOccasionsDialog";
import type { PeopleAndOccasionEntry, PeopleAndOccasionsFormData } from "../types";
import { formatMonthDay, getRelationTypeLabel } from "../utils";

interface DonorPeopleAndOccasionsTabProps {
  mergedList: PeopleAndOccasionEntry[];
  loading: boolean;
  canEdit: boolean;
  deletingId: string | null;
  showDialog: boolean;
  setShowDialog: (open: boolean) => void;
  isEditing: boolean;
  form: PeopleAndOccasionsFormData;
  setForm: (form: PeopleAndOccasionsFormData) => void;
  saving: boolean;
  onAdd: () => void;
  onEdit: (entry: PeopleAndOccasionEntry) => void;
  onDelete: (entry: PeopleAndOccasionEntry) => void;
  handleRelationChange: (relation: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleCancel: () => void;
  familyMembersCount: number;
  specialOccasionsCount: number;
}

export default function DonorPeopleAndOccasionsTab({
  mergedList,
  loading,
  canEdit,
  deletingId,
  showDialog,
  setShowDialog,
  isEditing,
  form,
  setForm,
  saving,
  onAdd,
  onEdit,
  onDelete,
  handleRelationChange,
  handleSubmit,
  handleCancel,
  familyMembersCount,
  specialOccasionsCount,
}: DonorPeopleAndOccasionsTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">People &amp; Occasions</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3" />
                  {familyMembersCount} {familyMembersCount === 1 ? "person" : "people"}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <CalendarHeart className="h-3 w-3" />
                  {specialOccasionsCount} {specialOccasionsCount === 1 ? "occasion" : "occasions"}
                </Badge>
              </div>
            </div>
            {canEdit && (
              <Button
                size="sm"
                onClick={onAdd}
                className="flex items-center gap-1"
                data-testid="button-add-pao"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : mergedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Users className="h-10 w-10 opacity-30" />
              <p className="text-sm">No people or occasions added yet.</p>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={onAdd} data-testid="button-add-pao-empty">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Person &amp; Occasion
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Occasion</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Contact</TableHead>
                  {canEdit && <TableHead className="w-[80px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedList.map((entry) => (
                  <TableRow key={`${entry.source}-${entry.id}`} data-testid={`row-pao-${entry.id}`}>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell>
                      {entry.relationType === "—" ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {getRelationTypeLabel(entry.relationType)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.source === "FAMILY" ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {entry.occasionLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatMonthDay(entry.month, entry.day)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {entry.phone ? (
                        <a
                          href={`tel:${entry.phone}`}
                          className="hover:underline"
                          data-testid={`link-phone-${entry.id}`}
                        >
                          {entry.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEdit(entry)}
                            data-testid={`button-edit-pao-${entry.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => onDelete(entry)}
                            disabled={deletingId === entry.id}
                            data-testid={`button-delete-pao-${entry.id}`}
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PeopleAndOccasionsDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        isEditing={isEditing}
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onRelationChange={handleRelationChange}
      />
    </div>
  );
}
