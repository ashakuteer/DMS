import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { FamilyMember } from "../types";

export function useDonorFamily(donorId: string) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familyMembersLoading, setFamilyMembersLoading] = useState(false);
  const [deletingFamilyMemberId, setDeletingFamilyMemberId] = useState<string | null>(null);

  const user = authStorage.getUser();
  const canEditFamilyAndSpecialDays = hasPermission(user?.role, "donors", "edit");

  const fetchFamilyMembers = useCallback(async () => {
    setFamilyMembersLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/donor-relations/donors/${donorId}/family-members`
      );
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data || []);
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
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
      const res = await fetchWithAuth(
        `/api/donor-relations/family-members/${memberId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setFamilyMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {
      console.error("Failed to delete family member");
    } finally {
      setDeletingFamilyMemberId(null);
    }
  }, []);

  const onAdd = useCallback(() => {}, []);
  const onEdit = useCallback((_member: FamilyMember) => {}, []);

  return {
    familyMembers,
    familyMembersLoading,
    canEditFamilyAndSpecialDays,
    deletingFamilyMemberId,
    fetchFamilyMembers,
    onAdd,
    onEdit,
    onDelete,
  };
}
