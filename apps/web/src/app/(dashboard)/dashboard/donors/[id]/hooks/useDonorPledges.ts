import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export function useDonorPledges(donorId: string) {
  const [pledges, setPledges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPledges = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(`/api/pledges?donorId=${donorId}`);

      if (res.ok) {
        const data = await res.json();
        setPledges(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching pledges:", error);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  return {
    pledges,
    loading,
    fetchPledges,
  };
}
