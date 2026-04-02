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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PeopleAndOccasionsFormData } from "../types";

interface PeopleAndOccasionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  form: PeopleAndOccasionsFormData;
  setForm: (form: PeopleAndOccasionsFormData) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onRelationChange: (relation: string) => void;
}

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function PeopleAndOccasionsDialog({
  open,
  onOpenChange,
  isEditing,
  form,
  setForm,
  saving,
  onSubmit,
  onCancel,
  onRelationChange,
}: PeopleAndOccasionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Entry" : "Add Person & Occasion"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this person or occasion."
              : "Add a person and their occasion to track important dates."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pao-name" className="text-right">
                Name *
              </Label>
              <Input
                id="pao-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="col-span-3"
                placeholder="Full name"
                data-testid="input-pao-name"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pao-relation" className="text-right">
                Relation *
              </Label>
              <Select
                value={form.relationType}
                onValueChange={(value) => {
                  setForm({ ...form, relationType: value });
                  onRelationChange(value);
                }}
              >
                <SelectTrigger className="col-span-3" data-testid="select-pao-relation">
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Groups</SelectLabel>
                    <SelectItem value="SELF">Self</SelectItem>
                    <SelectItem value="SELF_AND_SPOUSE">Self &amp; Spouse</SelectItem>
                    <SelectItem value="PARENTS">Parents</SelectItem>
                    <SelectItem value="IN_LAW">In-Laws</SelectItem>
                    <SelectItem value="GRANDPARENTS">Grandparents</SelectItem>
                    <SelectItem value="GRANDCHILDREN">Grandchildren</SelectItem>
                    <SelectItem value="FAMILY">Family</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Immediate Family</SelectLabel>
                    <SelectItem value="SPOUSE">Spouse</SelectItem>
                    <SelectItem value="SON">Son</SelectItem>
                    <SelectItem value="DAUGHTER">Daughter</SelectItem>
                    <SelectItem value="CHILD">Child</SelectItem>
                    <SelectItem value="FATHER">Father</SelectItem>
                    <SelectItem value="MOTHER">Mother</SelectItem>
                    <SelectItem value="BROTHER">Brother</SelectItem>
                    <SelectItem value="SISTER">Sister</SelectItem>
                    <SelectItem value="SIBLING">Sibling</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>In-Laws</SelectLabel>
                    <SelectItem value="FATHER_IN_LAW">Father-in-law</SelectItem>
                    <SelectItem value="MOTHER_IN_LAW">Mother-in-law</SelectItem>
                    <SelectItem value="BROTHER_IN_LAW">Brother-in-law</SelectItem>
                    <SelectItem value="SISTER_IN_LAW">Sister-in-law</SelectItem>
                    <SelectItem value="SON_IN_LAW">Son-in-law</SelectItem>
                    <SelectItem value="DAUGHTER_IN_LAW">Daughter-in-law</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Extended Family</SelectLabel>
                    <SelectItem value="GRANDFATHER">Grandfather</SelectItem>
                    <SelectItem value="GRANDMOTHER">Grandmother</SelectItem>
                    <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
                    <SelectItem value="GRANDSON">Grandson</SelectItem>
                    <SelectItem value="GRANDDAUGHTER">Granddaughter</SelectItem>
                    <SelectItem value="GRANDCHILD">Grandchild</SelectItem>
                    <SelectItem value="COUSIN">Cousin</SelectItem>
                    <SelectItem value="UNCLE">Uncle</SelectItem>
                    <SelectItem value="AUNT">Aunt</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Partner</SelectLabel>
                    <SelectItem value="FIANCE">Fiancé</SelectItem>
                    <SelectItem value="FIANCEE">Fiancée</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Other</SelectLabel>
                    <SelectItem value="FRIEND">Friend</SelectItem>
                    <SelectItem value="COLLEAGUE">Colleague</SelectItem>
                    <SelectItem value="BOSS">Boss</SelectItem>
                    <SelectItem value="MENTOR">Mentor</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pao-occasion" className="text-right">
                Occasion *
              </Label>
              <Select
                value={form.occasionType}
                onValueChange={(value) => setForm({ ...form, occasionType: value })}
              >
                <SelectTrigger className="col-span-3" data-testid="select-pao-occasion">
                  <SelectValue placeholder="Select occasion type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIRTHDAY_SELF">Birthday (Self)</SelectItem>
                  <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                  <SelectItem value="ANNIVERSARY_SELF">Wedding Anniversary (Self)</SelectItem>
                  <SelectItem value="ANNIVERSARY">Wedding Anniversary</SelectItem>
                  <SelectItem value="MEMORIAL_DAY">Memorial Day</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Day &amp; Month *</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={form.day}
                  onValueChange={(value) => setForm({ ...form, day: value })}
                >
                  <SelectTrigger className="w-[90px]" data-testid="select-pao-day">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={form.month}
                  onValueChange={(value) => setForm({ ...form, month: value })}
                >
                  <SelectTrigger className="flex-1" data-testid="select-pao-month">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="col-span-4 text-right text-xs text-muted-foreground">
                Year is not collected — only day and month are stored.
              </p>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pao-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="pao-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="col-span-3"
                placeholder="Optional"
                data-testid="input-pao-phone"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pao-email" className="text-right">
                Email
              </Label>
              <Input
                id="pao-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="col-span-3"
                placeholder="Optional"
                data-testid="input-pao-email"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pao-notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="pao-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="col-span-3"
                placeholder="Optional notes"
                data-testid="input-pao-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} data-testid="button-save-pao">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEditing ? (
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
