import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export function useDonorDonations(donorId: string) {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(
        `/api/donations?donorId=${donorId}&limit=100`
      );

      if (res.ok) {
        const data = await res.json();
        setDonations(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  return {
    donations,
    loading,
    fetchDonations,
  };
}
