import { useState, useCallback, useEffect } from "react";
import { authStorage } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import type { Pledge, PledgeFormData } from "../types";

const EMPTY_PLEDGE_FORM: PledgeFormData = {
  pledgeType: "MONEY",
  amount: "",
  quantity: "",
  expectedFulfillmentDate: "",
  notes: "",
};

export function useDonorPledges(donorId: string) {
  const { toast } = useToast();
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [pledgesLoading, setPledgesLoading] = useState(false);
  const [pledgeActionLoading, setPledgeActionLoading] = useState<string | null>(null);

  const [showPledgeDialog, setShowPledgeDialog] = useState(false);
  const [editingPledge, setEditingPledge] = useState(false);
  const [editingPledgeId, setEditingPledgeId] = useState<string | null>(null);
  const [pledgeForm, setPledgeForm] = useState<PledgeFormData>(EMPTY_PLEDGE_FORM);
  const [savingPledge, setSavingPledge] = useState(false);
  const [deletingPledgeId, setDeletingPledgeId] = useState<string | null>(null);

  const user = authStorage.getUser();
  const canEdit = hasPermission(user?.role, "donors", "edit");

  const pendingCount = pledges.filter((p) => p.status === "PENDING").length;

  const fetchPledges = useCallback(async () => {
    setPledgesLoading(true);
    try {
      const data = await apiClient<{ items?: Pledge[] }>(
        `/api/pledges?donorId=${donorId}`
      );
      setPledges(data?.items ?? []);
    } catch (error) {
      console.error("Error fetching pledges:", error);
      setPledges([]);
    } finally {
      setPledgesLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchPledges();
  }, [fetchPledges]);

  const runPledgeAction = useCallback(async (pledgeId: string, action: string, body?: Record<string, unknown>) => {
    setPledgeActionLoading(pledgeId);
    try {
      await apiClient(`/api/pledges/${pledgeId}/${action}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      await fetchPledges();
    } catch {
      console.error(`Failed to ${action} pledge`);
    } finally {
      setPledgeActionLoading(null);
    }
  }, [fetchPledges]);

  const onAdd = useCallback(() => {
    setEditingPledge(false);
    setEditingPledgeId(null);
    setPledgeForm(EMPTY_PLEDGE_FORM);
    setShowPledgeDialog(true);
  }, []);

  const onEdit = useCallback((pledge: Pledge) => {
    setEditingPledge(true);
    setEditingPledgeId(pledge.id);
    setPledgeForm({
      pledgeType: pledge.pledgeType,
      amount: pledge.amount?.toString() || "",
      quantity: pledge.quantity || "",
      expectedFulfillmentDate: pledge.expectedFulfillmentDate
        ? pledge.expectedFulfillmentDate.split("T")[0]
        : "",
      notes: pledge.notes || "",
    });
    setShowPledgeDialog(true);
  }, []);

  const handlePledgeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPledge(true);
    try {
      const body = {
        donorId,
        pledgeType: pledgeForm.pledgeType,
        amount: pledgeForm.amount ? parseFloat(pledgeForm.amount) : undefined,
        quantity: pledgeForm.quantity || undefined,
        expectedFulfillmentDate: pledgeForm.expectedFulfillmentDate,
        notes: pledgeForm.notes,
      };
      const url = editingPledgeId ? `/api/pledges/${editingPledgeId}` : "/api/pledges";
      const method = editingPledgeId ? "PATCH" : "POST";
      await apiClient(url, { method, body: JSON.stringify(body) });
      setShowPledgeDialog(false);
      setPledgeForm(EMPTY_PLEDGE_FORM);
      setEditingPledgeId(null);
      await fetchPledges();
      toast({ title: editingPledgeId ? "Pledge Updated" : "Pledge Added", description: "The pledge has been saved successfully." });
    } catch {
      console.error("Failed to save pledge");
      toast({ title: "Failed to Save Pledge", description: "Please check the details and try again.", variant: "destructive" });
    } finally {
      setSavingPledge(false);
    }
  }, [donorId, pledgeForm, editingPledgeId, fetchPledges]);

  const onFulfill = useCallback((pledgeId: string) => runPledgeAction(pledgeId, "mark-fulfilled"), [runPledgeAction]);
  const onPostpone = useCallback((pledgeId: string, newDate: string, notes?: string) =>
    runPledgeAction(pledgeId, "postpone", { newDate, notes }), [runPledgeAction]);
  const onCancel = useCallback((pledgeId: string, reason: string) =>
    runPledgeAction(pledgeId, "cancel", { reason }), [runPledgeAction]);
  const onWhatsApp = useCallback((_pledgeId: string) => {}, []);
  const onEmail = useCallback((_pledgeId: string) => {}, []);

  const onDeletePledge = useCallback(async (pledgeId: string) => {
    if (!confirm("Are you sure you want to permanently delete this pledge? This cannot be undone.")) return;
    setDeletingPledgeId(pledgeId);
    try {
      await apiClient(`/api/pledges/${pledgeId}`, { method: "DELETE" });
      await fetchPledges();
      toast({ title: "Pledge Deleted", description: "The pledge has been permanently removed." });
    } catch {
      toast({ title: "Delete Failed", description: "Could not delete the pledge. Please try again.", variant: "destructive" });
    } finally {
      setDeletingPledgeId(null);
    }
  }, [fetchPledges, toast]);

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
    onDeletePledge,
    deletingPledgeId,
    showPledgeDialog,
    setShowPledgeDialog,
    editingPledge,
    pledgeForm,
    setPledgeForm,
    savingPledge,
    handlePledgeSubmit,
  };
}
