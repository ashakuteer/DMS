import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { Pledge } from "../types";

export function useDonorPledges(donorId: string) {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [pledgesLoading, setPledgesLoading] = useState(false);
  const [pledgeActionLoading, setPledgeActionLoading] = useState<string | null>(null);

  const user = authStorage.getUser();
  const canEdit = hasPermission(user?.role, "donors", "edit");

  const pendingCount = pledges.filter((p) => p.status === "PENDING").length;

  const fetchPledges = useCallback(async () => {
    setPledgesLoading(true);
    try {
      const res = await fetchWithAuth(`/api/pledges?donorId=${donorId}`);
      if (res.ok) {
        const data = await res.json();
        setPledges(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching pledges:", error);
    } finally {
      setPledgesLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchPledges();
  }, [fetchPledges]);

  const runPledgeAction = useCallback(async (pledgeId: string, action: string) => {
    setPledgeActionLoading(pledgeId);
    try {
      await fetchWithAuth(`/api/pledges/${pledgeId}/${action}`, { method: "POST" });
      await fetchPledges();
    } catch {
      console.error(`Failed to ${action} pledge`);
    } finally {
      setPledgeActionLoading(null);
    }
  }, [fetchPledges]);

  const onAdd = useCallback(() => {}, []);
  const onEdit = useCallback((_pledge: Pledge) => {}, []);
  const onFulfill = useCallback((pledgeId: string) => runPledgeAction(pledgeId, "fulfill"), [runPledgeAction]);
  const onPostpone = useCallback((pledgeId: string) => runPledgeAction(pledgeId, "postpone"), [runPledgeAction]);
  const onCancel = useCallback((pledgeId: string) => runPledgeAction(pledgeId, "cancel"), [runPledgeAction]);
  const onWhatsApp = useCallback((_pledgeId: string) => {}, []);
  const onEmail = useCallback((_pledgeId: string) => {}, []);

  return {
    pledges,
    pledgesLoading,
    pendingCount,
    canEdit,
    pledgeActionLoading,
    fetchPledges,
    onAdd,
    onEdit,
    onFulfill,
    onPostpone,
    onCancel,
    onWhatsApp,
    onEmail,
  };
}
