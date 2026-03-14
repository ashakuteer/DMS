import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export function useDonorData(donorId: string) {
  const [donor, setDonor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDonor = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(`/api/donors/${donorId}`);

      if (res.ok) {
        const data = await res.json();
        setDonor(data);
      }
    } catch (error) {
      console.error("Error fetching donor:", error);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchDonor();
  }, [fetchDonor]);

  const getDonorName = useCallback(() => {
    if (!donor) return "";
    const parts = [donor.firstName, donor.middleName, donor.lastName].filter(Boolean);
    return parts.join(" ") || donor.donorCode || "Unknown Donor";
  }, [donor]);

  const getInitials = useCallback(() => {
    if (!donor) return "?";
    const first = donor.firstName?.[0] ?? "";
    const last = donor.lastName?.[0] ?? "";
    return (first + last).toUpperCase() || "?";
  }, [donor]);

  return {
    donor,
    loading,
    fetchDonor,
    getDonorName,
    getInitials,
  };
}
