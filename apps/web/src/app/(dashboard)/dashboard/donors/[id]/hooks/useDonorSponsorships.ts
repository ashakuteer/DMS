import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import type { SponsoredBeneficiary } from "../types";

interface SponsorStatusData {
  status: string;
  note: string;
}

interface SponsorHistoryEntry {
  id: string;
  oldStatus: string;
  newStatus: string;
  oldAmount?: number;
  newAmount?: number;
  note?: string;
  changedAt: string;
  changedBy?: { name: string };
}

const EMPTY_SPONSORSHIP_FORM = {
  beneficiaryId: "",
  sponsorshipType: "FULL",
  amount: "",
  currency: "INR",
  frequency: "MONTHLY",
  startDate: new Date().toISOString().split("T")[0],
  status: "ACTIVE",
  notes: "",
};

export function useDonorSponsorships(donorId: string, donorPhone?: string | null) {
  const { toast } = useToast();
  const router = useRouter();
  const user = authStorage.getUser();
  const canEditSponsorship = hasPermission(user?.role, "donors", "edit");

  const [sponsoredBeneficiaries, setSponsoredBeneficiaries] = useState<SponsoredBeneficiary[]>([]);
  const [sponsoredBeneficiariesLoading, setSponsoredBeneficiariesLoading] = useState(false);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sponsorshipForm, setSponsorshipForm] = useState(EMPTY_SPONSORSHIP_FORM);
  const [addingSponsor, setAddingSponsor] = useState(false);

  // Status change dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [sponsorStatusTarget, setSponsorStatusTarget] = useState<SponsoredBeneficiary | null>(null);
  const [sponsorStatusData, setSponsorStatusData] = useState<SponsorStatusData>({ status: "ACTIVE", note: "" });
  const [sponsorStatusLoading, setSponsorStatusLoading] = useState(false);

  // History dialog
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [sponsorHistoryTarget, setSponsorHistoryTarget] = useState<SponsoredBeneficiary | null>(null);
  const [sponsorHistoryEntries, setSponsorHistoryEntries] = useState<SponsorHistoryEntry[]>([]);
  const [sponsorHistoryLoading, setSponsorHistoryLoading] = useState(false);

  const fetchSponsoredBeneficiaries = useCallback(async () => {
    setSponsoredBeneficiariesLoading(true);
    try {
      const data = await apiClient<SponsoredBeneficiary[]>(`/api/sponsorships/donor/${donorId}`);
      setSponsoredBeneficiaries(Array.isArray(data) ? data : []);
    } catch {
      setSponsoredBeneficiaries([]);
    } finally {
      setSponsoredBeneficiariesLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchSponsoredBeneficiaries();
  }, [fetchSponsoredBeneficiaries]);

  const onAddSponsorship = useCallback(() => {
    setSponsorshipForm(EMPTY_SPONSORSHIP_FORM);
    setShowAddDialog(true);
  }, []);

  const handleAddSponsorshipSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorshipForm.beneficiaryId) {
      toast({ title: "Beneficiary required", description: "Please select a beneficiary.", variant: "destructive" });
      return;
    }
    setAddingSponsor(true);
    try {
      const payload = {
        donorId,
        beneficiaryId: sponsorshipForm.beneficiaryId,
        sponsorshipType: sponsorshipForm.sponsorshipType,
        amount: sponsorshipForm.amount ? parseFloat(sponsorshipForm.amount) : undefined,
        currency: sponsorshipForm.currency,
        frequency: sponsorshipForm.frequency,
        startDate: sponsorshipForm.startDate || undefined,
        status: sponsorshipForm.status,
        notes: sponsorshipForm.notes || undefined,
      };
      console.log("Saving sponsorship:", payload);
      await apiClient("/api/sponsorships", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setShowAddDialog(false);
      setSponsorshipForm(EMPTY_SPONSORSHIP_FORM);
      await fetchSponsoredBeneficiaries();
      toast({ title: "Sponsorship Added", description: "The sponsorship has been created successfully." });
    } catch (err: any) {
      toast({ title: "Failed to Add Sponsorship", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setAddingSponsor(false);
    }
  }, [donorId, sponsorshipForm, fetchSponsoredBeneficiaries, toast]);

  const onOpenStatusChange = useCallback((sponsorship: SponsoredBeneficiary) => {
    setSponsorStatusTarget(sponsorship);
    setSponsorStatusData({ status: sponsorship.status || "ACTIVE", note: "" });
    setShowStatusDialog(true);
  }, []);

  const handleStatusConfirm = useCallback(async () => {
    if (!sponsorStatusTarget) return;
    setSponsorStatusLoading(true);
    try {
      await apiClient(`/api/sponsorships/${sponsorStatusTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: sponsorStatusData.status,
          isActive: sponsorStatusData.status === "ACTIVE",
          notes: sponsorStatusData.note || undefined,
        }),
      });
      setShowStatusDialog(false);
      await fetchSponsoredBeneficiaries();
      toast({ title: "Status Updated", description: "Sponsorship status has been updated successfully." });
    } catch (err: any) {
      toast({ title: "Failed to Update Status", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setSponsorStatusLoading(false);
    }
  }, [sponsorStatusTarget, sponsorStatusData, fetchSponsoredBeneficiaries, toast]);

  const onViewHistory = useCallback(async (sponsorship: SponsoredBeneficiary) => {
    setSponsorHistoryTarget(sponsorship);
    setSponsorHistoryEntries([]);
    setShowHistoryDialog(true);
    setSponsorHistoryLoading(true);
    try {
      const data = await apiClient<SponsorHistoryEntry[]>(`/api/sponsorships/${sponsorship.id}/history`);
      setSponsorHistoryEntries(Array.isArray(data) ? data : []);
    } catch {
      setSponsorHistoryEntries([]);
    } finally {
      setSponsorHistoryLoading(false);
    }
  }, []);

  const onDeleteSponsorship = useCallback(async (sponsorshipId: string) => {
    if (!confirm("Delete this sponsorship permanently? This cannot be undone.")) return;
    try {
      await apiClient(`/api/sponsorships/${sponsorshipId}`, { method: "DELETE" });
      setSponsoredBeneficiaries((prev) => prev.filter((s) => s.id !== sponsorshipId));
      toast({ title: "Sponsorship Deleted", description: "The sponsorship has been removed." });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err?.message || "Could not delete sponsorship.", variant: "destructive" });
    }
  }, [toast]);

  const onSendWhatsApp = useCallback((sponsorship: SponsoredBeneficiary, message: string) => {
    const phone = donorPhone?.replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
    }
  }, [donorPhone]);

  const onCopyMessage = useCallback((message: string) => {
    navigator.clipboard.writeText(message).then(() => {
      toast({ title: "Copied", description: "Message copied to clipboard." });
    });
  }, [toast]);

  const onViewBeneficiary = useCallback((beneficiaryId: string) => {
    router.push(`/dashboard/beneficiaries/${beneficiaryId}`);
  }, [router]);

  const onViewAllBeneficiaries = useCallback(() => {
    router.push("/dashboard/beneficiaries");
  }, [router]);

  return {
    sponsoredBeneficiaries,
    sponsoredBeneficiariesLoading,
    canEditSponsorship,
    fetchSponsoredBeneficiaries,

    showAddDialog,
    setShowAddDialog,
    sponsorshipForm,
    setSponsorshipForm,
    addingSponsor,
    onAddSponsorship,
    handleAddSponsorshipSubmit,

    showStatusDialog,
    setShowStatusDialog,
    sponsorStatusTarget,
    sponsorStatusData,
    setSponsorStatusData,
    sponsorStatusLoading,
    onOpenStatusChange,
    handleStatusConfirm,

    showHistoryDialog,
    setShowHistoryDialog,
    sponsorHistoryTarget,
    sponsorHistoryEntries,
    sponsorHistoryLoading,
    onViewHistory,

    onDeleteSponsorship,
    onSendWhatsApp,
    onCopyMessage,
    onViewBeneficiary,
    onViewAllBeneficiaries,
  };
}
