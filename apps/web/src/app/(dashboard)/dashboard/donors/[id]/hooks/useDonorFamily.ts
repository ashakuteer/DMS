import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export function useDonorFamily(donorId: string) {
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFamilyMembers = useCallback(async () => {
    try {
      setLoading(true);

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
      setLoading(false);
    }
  }, [donorId]);

  return {
    familyMembers,
    loading,
    fetchFamilyMembers,
  };
}
