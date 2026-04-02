"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { authStorage } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import type {
  FamilyMember,
  SpecialOccasion,
  PeopleAndOccasionEntry,
  PeopleAndOccasionsFormData,
} from "../types";
import { getOccasionTypeLabel, getRelationTypeLabel } from "../utils";

const EMPTY_FORM: PeopleAndOccasionsFormData = {
  name: "",
  relationType: "SELF",
  occasionType: "BIRTHDAY_SELF",
  month: "",
  day: "",
  phone: "",
  email: "",
  notes: "",
};

function mapDbOccasionTypeToFormType(dbType: string): string {
  const map: Record<string, string> = {
    DOB_SELF: "BIRTHDAY_SELF",
    DOB_SPOUSE: "BIRTHDAY",
    DOB_CHILD: "BIRTHDAY",
    ANNIVERSARY: "ANNIVERSARY_SELF",
    DEATH_ANNIVERSARY: "MEMORIAL_DAY",
    OTHER: "OTHER",
  };
  return map[dbType] || "OTHER";
}

function mapFormTypeToDbOccasionType(formType: string): string {
  const map: Record<string, string> = {
    ANNIVERSARY_SELF: "ANNIVERSARY",
    ANNIVERSARY: "ANNIVERSARY",
    MEMORIAL_DAY: "DEATH_ANNIVERSARY",
    OTHER: "OTHER",
  };
  return map[formType] || "OTHER";
}

function isSpecialOccasionRoute(occasionType: string): boolean {
  return ["ANNIVERSARY_SELF", "ANNIVERSARY", "MEMORIAL_DAY", "OTHER"].includes(occasionType);
}

interface SpecialOccasionDefaults {
  name: string;
  relationType: string;
  occasionLabel: string;
}

function resolveSpecialOccasionDefaults(
  type: string,
  relatedPersonName: string | undefined,
  donorName: string
): SpecialOccasionDefaults {
  const personName = relatedPersonName?.trim() || "";

  switch (type) {
    case "DOB_SELF":
      return {
        name: personName || donorName || "Donor",
        relationType: "SELF",
        occasionLabel: "Birthday (Self)",
      };
    case "DOB_SPOUSE":
      return {
        name: personName || "Spouse",
        relationType: "SPOUSE",
        occasionLabel: "Spouse Birthday",
      };
    case "DOB_CHILD":
      return {
        name: personName || "Child",
        relationType: "CHILD",
        occasionLabel: "Child Birthday",
      };
    case "ANNIVERSARY":
      return {
        name: personName || `${donorName || "Donor"} & Spouse`,
        relationType: "SELF_AND_SPOUSE",
        occasionLabel: "Wedding Anniversary (Self)",
      };
    case "DEATH_ANNIVERSARY":
      return {
        name: personName || "Loved One",
        relationType: "OTHER",
        occasionLabel: "Memorial Day",
      };
    default:
      return {
        name: personName || "Other",
        relationType: "OTHER",
        occasionLabel: "Other",
      };
  }
}

function buildMergedList(
  familyMembers: FamilyMember[],
  specialOccasions: SpecialOccasion[],
  donorName: string
): PeopleAndOccasionEntry[] {
  const fromFamily: PeopleAndOccasionEntry[] = familyMembers.map((m) => ({
    id: m.id,
    source: "FAMILY",
    name: m.name,
    relationType: m.relationType,
    occasionLabel: m.birthDay && m.birthMonth ? "Birthday" : "—",
    month: m.birthMonth,
    day: m.birthDay,
    phone: m.phone,
    email: m.email,
    notes: m.notes,
  }));

  const fromSpecial: PeopleAndOccasionEntry[] = specialOccasions.map((o) => {
    const defaults = resolveSpecialOccasionDefaults(o.type, o.relatedPersonName, donorName);
    return {
      id: o.id,
      source: "SPECIAL",
      name: defaults.name,
      relationType: defaults.relationType,
      occasionLabel: defaults.occasionLabel,
      month: o.month,
      day: o.day,
      notes: o.notes,
    };
  });

  return [...fromFamily, ...fromSpecial];
}

export function usePeopleAndOccasions(
  donorId: string,
  donorName: string,
  enabled: boolean = false
) {
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [specialOccasions, setSpecialOccasions] = useState<SpecialOccasion[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PeopleAndOccasionEntry | null>(null);
  const [form, setForm] = useState<PeopleAndOccasionsFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const hasFetched = useRef(false);

  const user = authStorage.getUser();
  const canEdit = hasPermission(user?.role, "donors", "edit");

  const mergedList = buildMergedList(familyMembers, specialOccasions, donorName);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [familyData, specialData] = await Promise.all([
        apiClient<FamilyMember[]>(`/api/donor-relations/donors/${donorId}/family-members`),
        apiClient<SpecialOccasion[]>(`/api/donor-relations/donors/${donorId}/special-occasions`),
      ]);
      setFamilyMembers(Array.isArray(familyData) ? familyData : []);
      setSpecialOccasions(Array.isArray(specialData) ? specialData : []);
    } catch {
      console.error("Failed to fetch people & occasions");
      setFamilyMembers([]);
      setSpecialOccasions([]);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    if (enabled && !hasFetched.current) {
      hasFetched.current = true;
      fetchAll();
    }
  }, [enabled, fetchAll]);

  const onAdd = useCallback(() => {
    setIsEditing(false);
    setEditingEntry(null);
    setForm({ ...EMPTY_FORM });
    setShowDialog(true);
  }, []);

  const onEdit = useCallback((entry: PeopleAndOccasionEntry) => {
    setIsEditing(true);
    setEditingEntry(entry);

    if (entry.source === "FAMILY") {
      const member = entry as PeopleAndOccasionEntry;
      setForm({
        name: member.name,
        relationType: member.relationType,
        occasionType: "BIRTHDAY",
        month: member.month?.toString() || "",
        day: member.day?.toString() || "",
        phone: member.phone || "",
        email: member.email || "",
        notes: member.notes || "",
      });
    } else {
      const raw = specialOccasions.find((o) => o.id === entry.id);
      setForm({
        name: raw?.relatedPersonName || "",
        relationType: "SELF",
        occasionType: mapDbOccasionTypeToFormType(raw?.type || "OTHER"),
        month: entry.month?.toString() || "",
        day: entry.day?.toString() || "",
        phone: "",
        email: "",
        notes: raw?.notes || "",
      });
    }
    setShowDialog(true);
  }, [specialOccasions]);

  const onDelete = useCallback(async (entry: PeopleAndOccasionEntry) => {
    if (!confirm("Are you sure you want to delete this entry? This cannot be undone.")) return;
    setDeletingId(entry.id);
    try {
      if (entry.source === "FAMILY") {
        await apiClient(`/api/donor-relations/family-members/${entry.id}`, { method: "DELETE" });
        setFamilyMembers((prev) => prev.filter((m) => m.id !== entry.id));
      } else {
        await apiClient(`/api/donor-relations/special-occasions/${entry.id}`, { method: "DELETE" });
        setSpecialOccasions((prev) => prev.filter((o) => o.id !== entry.id));
      }
      toast({ title: "Entry Deleted", description: "The entry has been removed." });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err?.message || "Could not delete.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }, [toast]);

  const handleRelationChange = useCallback((relationType: string) => {
    setForm((prev) => {
      const updated = { ...prev, relationType };
      if (relationType === "SELF" && !isEditing) {
        updated.name = donorName;
        updated.occasionType = "BIRTHDAY_SELF";
      } else if (relationType === "SELF_AND_SPOUSE" && !isEditing) {
        updated.name = `${donorName} & Spouse`;
      }
      return updated;
    });
  }, [donorName, isEditing]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setForm({ ...EMPTY_FORM });
    setEditingEntry(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && editingEntry) {
        if (editingEntry.source === "FAMILY") {
          await apiClient(`/api/donor-relations/family-members/${editingEntry.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: form.name,
              relationType: form.relationType,
              birthMonth: form.month ? parseInt(form.month) : undefined,
              birthDay: form.day ? parseInt(form.day) : undefined,
              phone: form.phone || undefined,
              email: form.email || undefined,
              notes: form.notes || undefined,
            }),
          });
        } else {
          await apiClient(`/api/donor-relations/special-occasions/${editingEntry.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              type: mapFormTypeToDbOccasionType(form.occasionType),
              month: parseInt(form.month),
              day: parseInt(form.day),
              relatedPersonName: form.name || undefined,
              notes: form.notes || undefined,
            }),
          });
        }
        toast({ title: "Entry Updated", description: "Saved successfully." });
      } else {
        if (isSpecialOccasionRoute(form.occasionType)) {
          await apiClient(`/api/donor-relations/donors/${donorId}/special-occasions`, {
            method: "POST",
            body: JSON.stringify({
              type: mapFormTypeToDbOccasionType(form.occasionType),
              month: parseInt(form.month),
              day: parseInt(form.day),
              relatedPersonName: form.name || undefined,
              notes: form.notes || undefined,
            }),
          });
        } else {
          await apiClient(`/api/donor-relations/donors/${donorId}/family-members`, {
            method: "POST",
            body: JSON.stringify({
              name: form.name,
              relationType: form.relationType,
              birthMonth: form.month ? parseInt(form.month) : undefined,
              birthDay: form.day ? parseInt(form.day) : undefined,
              phone: form.phone || undefined,
              email: form.email || undefined,
              notes: form.notes || undefined,
            }),
          });
        }
        toast({ title: "Entry Added", description: "Saved successfully." });
      }
      setShowDialog(false);
      setForm({ ...EMPTY_FORM });
      setEditingEntry(null);
      await fetchAll();
    } catch (err: any) {
      toast({ title: "Save Failed", description: err?.message || "Please check the details and try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [donorId, form, isEditing, editingEntry, fetchAll, toast]);

  // Unique people/groups: deduplicate by normalized name + relationType
  const uniquePeopleCount = new Set(
    mergedList.map(
      (entry) =>
        entry.name.toLowerCase().trim() + "|" + entry.relationType
    )
  ).size;

  // Total occasions = every row in the merged table
  const totalOccasionsCount = mergedList.length;

  return {
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
    uniquePeopleCount,
    totalOccasionsCount,
    // kept for DonorStatsCards at the top of the page
    familyMembersCount: familyMembers.length,
    specialOccasionsCount: specialOccasions.length,
  };
}
