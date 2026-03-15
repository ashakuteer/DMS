"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Plus, Trash2, Users } from "lucide-react";
import type { FamilyMember, FamilyMemberFormData } from "../types";
import { formatMonthDay, getRelationTypeLabel } from "../utils";
import FamilyMemberDialog from "../dialogs/FamilyMemberDialog";

interface DonorFamilyTabProps {
  familyMembers: FamilyMember[];
  familyMembersLoading: boolean;
  canEditFamilyAndSpecialDays: boolean;
  deletingFamilyMemberId: string | null;
  onAdd: () => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  showFamilyDialog: boolean;
  setShowFamilyDialog: (open: boolean) => void;
  editingFamilyMember: boolean;
  familyMemberForm: FamilyMemberFormData;
  setFamilyMemberForm: (form: FamilyMemberFormData) => void;
  savingFamilyMember: boolean;
  handleFamilySubmit: (e: React.FormEvent) => void;
  handleFamilyCancel: () => void;
}

export default function DonorFamilyTab({
  familyMembers,
  familyMembersLoading,
  canEditFamilyAndSpecialDays,
  deletingFamilyMemberId,
  onAdd,
  onEdit,
  onDelete,
  showFamilyDialog,
  setShowFamilyDialog,
  editingFamilyMember,
  familyMemberForm,
  setFamilyMemberForm,
  savingFamilyMember,
  handleFamilySubmit,
  handleFamilyCancel,
}: DonorFamilyTabProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Family Members</CardTitle>
            <CardDescription>
              Spouse, children, and other family members
            </CardDescription>
          </div>

          {canEditFamilyAndSpecialDays && (
            <Button onClick={onAdd} data-testid="button-add-family-member">
              <Plus className="mr-2 h-4 w-4" />
              Add Family Member
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {familyMembersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : familyMembers.length ? (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`family-member-item-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="font-medium">{member.name}</p>

                      <Badge variant="outline">
                        {getRelationTypeLabel(member.relationType)}
                      </Badge>

                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                        {member.birthMonth && member.birthDay && (
                          <span>
                            Birthday: {formatMonthDay(member.birthMonth, member.birthDay)}
                          </span>
                        )}
                        {member.phone && <span>Phone: {member.phone}</span>}
                        {member.email && <span>Email: {member.email}</span>}
                      </div>

                      {member.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {member.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {canEditFamilyAndSpecialDays && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(member)}
                        data-testid={`button-edit-family-member-${member.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(member.id)}
                        disabled={deletingFamilyMemberId === member.id}
                        data-testid={`button-delete-family-member-${member.id}`}
                      >
                        {deletingFamilyMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No family members recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      <FamilyMemberDialog
        open={showFamilyDialog}
        onOpenChange={setShowFamilyDialog}
        editingFamilyMember={editingFamilyMember}
        familyMemberForm={familyMemberForm}
        setFamilyMemberForm={setFamilyMemberForm}
        savingFamilyMember={savingFamilyMember}
        onSubmit={handleFamilySubmit}
        onCancel={handleFamilyCancel}
      />
    </>
  );
}
