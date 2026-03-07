"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FamilyMemberFormData } from "../types";

interface FamilyMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingFamilyMember: boolean;
  familyMemberForm: FamilyMemberFormData;
  setFamilyMemberForm: (form: FamilyMemberFormData) => void;
  savingFamilyMember: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function FamilyMemberDialog({
  open,
  onOpenChange,
  editingFamilyMember,
  familyMemberForm,
  setFamilyMemberForm,
  savingFamilyMember,
  onSubmit,
  onCancel,
}: FamilyMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingFamilyMember ? "Edit Family Member" : "Add Family Member"}
          </DialogTitle>
          <DialogDescription>
            {editingFamilyMember
              ? "Update family member details"
              : "Add a new family member to this donor's profile"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fm-name" className="text-right">
                Name *
              </Label>
              <Input
                id="fm-name"
                value={familyMemberForm.name}
                onChange={(e) =>
                  setFamilyMemberForm({
                    ...familyMemberForm,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
                data-testid="input-family-member-name"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fm-relation" className="text-right">
                Relation *
              </Label>
              <Select
                value={familyMemberForm.relationType}
                onValueChange={(value) =>
                  setFamilyMemberForm({
                    ...familyMemberForm,
                    relationType: value,
                  })
                }
              >
                <SelectTrigger
                  className="col-span-3"
                  data-testid="select-family-member-relation"
                >
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPOUSE">Spouse</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                  <SelectItem value="FATHER">Father</SelectItem>
                  <SelectItem value="MOTHER">Mother</SelectItem>
                  <SelectItem value="SIBLING">Sibling</SelectItem>
                  <SelectItem value="IN_LAW">In-law</SelectItem>
                  <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Birthday (Day & Month)</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={familyMemberForm.birthDay}
                  onValueChange={(value) =>
                    setFamilyMemberForm({
                      ...familyMemberForm,
                      birthDay: value,
                    })
                  }
                >
                  <SelectTrigger
                    className="w-[100px]"
                    data-testid="select-family-member-day"
                  >
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={familyMemberForm.birthMonth}
                  onValueChange={(value) =>
                    setFamilyMemberForm({
                      ...familyMemberForm,
                      birthMonth: value,
                    })
                  }
                >
                  <SelectTrigger
                    className="flex-1"
                    data-testid="select-family-member-month"
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="col-span-4 text-right text-xs text-muted-foreground">
                Year is intentionally not collected.
              </p>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fm-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="fm-phone"
                type="tel"
                value={familyMemberForm.phone}
                onChange={(e) =>
                  setFamilyMemberForm({
                    ...familyMemberForm,
                    phone: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Optional"
                data-testid="input-family-member-phone"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fm-email" className="text-right">
                Email
              </Label>
              <Input
                id="fm-email"
                type="email"
                value={familyMemberForm.email}
                onChange={(e) =>
                  setFamilyMemberForm({
                    ...familyMemberForm,
                    email: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Optional"
                data-testid="input-family-member-email"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fm-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="fm-notes"
                value={familyMemberForm.notes}
                onChange={(e) =>
                  setFamilyMemberForm({
                    ...familyMemberForm,
                    notes: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="Optional notes"
                data-testid="input-family-member-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={savingFamilyMember}
              data-testid="button-save-family-member"
            >
              {savingFamilyMember ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingFamilyMember ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
