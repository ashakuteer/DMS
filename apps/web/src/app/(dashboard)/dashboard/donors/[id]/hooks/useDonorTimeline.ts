import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export function useDonorTimeline(donorId: string) {
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(`/api/donors/${donorId}/timeline`);

      if (res.ok) {
        const data = await res.json();
        setTimelineItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  return {
    timelineItems,
    loading,
    fetchTimeline,
  };
}
