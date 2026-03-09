import { useState, useCallback } from "react";
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

  return {
    donor,
    loading,
    fetchDonor,
  };
}
