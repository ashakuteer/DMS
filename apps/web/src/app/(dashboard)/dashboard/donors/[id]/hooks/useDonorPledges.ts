import { useState, useCallback, useEffect } from "react";
import { authStorage } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { hasPermission } from "@/lib/permissions";
import type { Pledge, PledgeFormData } from "../types";

const EMPTY_PLEDGE_FORM: PledgeFormData = {
  pledgeType: "MONEY",
  amount: "",
  quantity: "",
  expectedFulfillmentDate: "",
  notes: "",
};

export function useDonorPledges(donorId: string) {
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [pledgesLoading, setPledgesLoading] = useState(false);
  const [pledgeActionLoading, setPledgeActionLoading] = useState<string | null>(null);

  const [showPledgeDialog, setShowPledgeDialog] = useState(false);
  const [editingPledge, setEditingPledge] = useState(false);
  const [editingPledgeId, setEditingPledgeId] = useState<string | null>(null);
  const [pledgeForm, setPledgeForm] = useState<PledgeFormData>(EMPTY_PLEDGE_FORM);
  const [savingPledge, setSavingPledge] = useState(false);

  const user = authStorage.getUser();
  const canEdit = hasPermission(user?.role, "donors", "edit");

  const pendingCount = pledges.filter((p) => p.status === "PENDING").length;

  const fetchPledges = useCallback(async () => {
    setPledgesLoading(true);
    try {
      const res = await apiFetch(`/api/pledges?donorId=${donorId}`);
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
      await apiFetch(`/api/pledges/${pledgeId}/${action}`, { method: "POST" });
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
      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowPledgeDialog(false);
        setPledgeForm(EMPTY_PLEDGE_FORM);
        setEditingPledgeId(null);
        await fetchPledges();
      }
    } catch {
      console.error("Failed to save pledge");
    } finally {
      setSavingPledge(false);
    }
  }, [donorId, pledgeForm, editingPledgeId, fetchPledges]);

  const onFulfill = useCallback((pledgeId: string) => runPledgeAction(pledgeId, "mark-fulfilled"), [runPledgeAction]);
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
    showPledgeDialog,
    setShowPledgeDialog,
    editingPledge,
    pledgeForm,
    setPledgeForm,
    savingPledge,
    handlePledgeSubmit,
  };
}
