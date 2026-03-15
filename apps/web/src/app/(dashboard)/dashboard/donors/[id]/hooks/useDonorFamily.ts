import { useState, useCallback, useEffect } from "react";
import { authStorage } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import type { FamilyMember, FamilyMemberFormData } from "../types";

const EMPTY_FAMILY_FORM: FamilyMemberFormData = {
  name: "",
  relationType: "SPOUSE",
  birthMonth: "",
  birthDay: "",
  phone: "",
  email: "",
  notes: "",
};

export function useDonorFamily(donorId: string) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMembersLoading, setFamilyMembersLoading] = useState(false);
  const [deletingFamilyMemberId, setDeletingFamilyMemberId] = useState<string | null>(null);

  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [editingFamilyMember, setEditingFamilyMember] = useState(false);
  const [editingFamilyMemberId, setEditingFamilyMemberId] = useState<string | null>(null);
  const [familyMemberForm, setFamilyMemberForm] = useState<FamilyMemberFormData>(EMPTY_FAMILY_FORM);
  const [savingFamilyMember, setSavingFamilyMember] = useState(false);

  const user = authStorage.getUser();
  const canEditFamilyAndSpecialDays = hasPermission(user?.role, "donors", "edit");

  const fetchFamilyMembers = useCallback(async () => {
    setFamilyMembersLoading(true);
    try {
      const data = await apiClient<FamilyMember[]>(
        `/api/donor-relations/donors/${donorId}/family-members`
      );
      setFamilyMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching family members:", error);
      setFamilyMembers([]);
    } finally {
      setFamilyMembersLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  const onDelete = useCallback(async (memberId: string) => {
    setDeletingFamilyMemberId(memberId);
    try {
      await apiClient(
        `/api/donor-relations/family-members/${memberId}`,
        { method: "DELETE" }
      );
      setFamilyMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      console.error("Failed to delete family member");
    } finally {
      setDeletingFamilyMemberId(null);
    }
  }, []);

  const onAdd = useCallback(() => {
    setEditingFamilyMember(false);
    setEditingFamilyMemberId(null);
    setFamilyMemberForm(EMPTY_FAMILY_FORM);
    setShowFamilyDialog(true);
  }, []);

  const onEdit = useCallback((member: FamilyMember) => {
    setEditingFamilyMember(true);
    setEditingFamilyMemberId(member.id);
    setFamilyMemberForm({
      name: member.name,
      relationType: member.relationType,
      birthMonth: member.birthMonth?.toString() || "",
      birthDay: member.birthDay?.toString() || "",
      phone: member.phone || "",
      email: member.email || "",
      notes: member.notes || "",
    });
    setShowFamilyDialog(true);
  }, []);

  const handleFamilyCancel = useCallback(() => {
    setShowFamilyDialog(false);
    setFamilyMemberForm(EMPTY_FAMILY_FORM);
    setEditingFamilyMemberId(null);
  }, []);

  const handleFamilySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFamilyMember(true);
    try {
      const body = {
        name: familyMemberForm.name,
        relationType: familyMemberForm.relationType,
        birthMonth: familyMemberForm.birthMonth ? parseInt(familyMemberForm.birthMonth) : undefined,
        birthDay: familyMemberForm.birthDay ? parseInt(familyMemberForm.birthDay) : undefined,
        phone: familyMemberForm.phone || undefined,
        email: familyMemberForm.email || undefined,
        notes: familyMemberForm.notes || undefined,
      };
      const url = editingFamilyMemberId
        ? `/api/donor-relations/family-members/${editingFamilyMemberId}`
        : `/api/donor-relations/donors/${donorId}/family-members`;
      const method = editingFamilyMemberId ? "PATCH" : "POST";
      await apiClient(url, { method, body: JSON.stringify(body) });
      setShowFamilyDialog(false);
      setFamilyMemberForm(EMPTY_FAMILY_FORM);
      setEditingFamilyMemberId(null);
      await fetchFamilyMembers();
    } catch {
      console.error("Failed to save family member");
    } finally {
      setSavingFamilyMember(false);
    }
  }, [donorId, familyMemberForm, editingFamilyMemberId, fetchFamilyMembers]);

  return {
    familyMembers,
    familyMembersLoading,
    canEditFamilyAndSpecialDays,
    deletingFamilyMemberId,
    fetchFamilyMembers,
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
  };
}
