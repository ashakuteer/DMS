import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";

export function useDonorCommunication(donorId: string) {
  const [communicationLogs, setCommunicationLogs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCommunicationLogs = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetchWithAuth(
        `/api/communication-logs/donor/${donorId}`
      );

      if (res.ok) {
        const data = await res.json();
        setCommunicationLogs(data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`/api/templates`);

      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  }, []);

  return {
    communicationLogs,
    templates,
    loading,
    fetchCommunicationLogs,
    fetchTemplates,
  };
}
