import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import type { Donation, Donor, DonationFormData } from "../types";
import { MEAL_SPONSORSHIP_SENTINEL } from "../dialogs/DonationDialog";

const EMPTY_DONATION_FORM: DonationFormData = {
  donationAmount: "",
  donationDate: new Date().toISOString().split("T")[0],
  donationMode: "CASH",
  donationType: "CASH",
  designatedHome: "NONE",
  remarks: "",
  emailType: "GENERAL",
};

const IN_KIND_TYPES = new Set(["GROCERY", "MEDICINES", "PREPARED_FOOD", "USED_ITEMS", "KIND"]);

export function useDonorDonations(donorId: string, donor?: Donor | null) {
  const { toast } = useToast();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [resendingReceiptId, setResendingReceiptId] = useState<string | null>(null);
  const [sendingWhatsAppId, setSendingWhatsAppId] = useState<string | null>(null);
  const [deletingDonationId, setDeletingDonationId] = useState<string | null>(null);

  const [showDonationDialog, setShowDonationDialog] = useState(false);

  const [editingDonation, setEditingDonation] = useState(false);
  const [editingDonationId, setEditingDonationId] = useState<string | null>(null);
  const [donationForm, setDonationForm] = useState<DonationFormData>(EMPTY_DONATION_FORM);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  const user = authStorage.getUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "FOUNDER";
  const canSendWhatsApp = hasPermission(user?.role, "communication", "whatsapp");
  const canSendEmail = hasPermission(user?.role, "communication", "email");
  const hasWhatsAppNumber = !!(donor?.whatsappPhone || donor?.primaryPhone);
  const hasEmail = !!(donor?.personalEmail || donor?.officialEmail);
  const donorName = donor
    ? [donor.firstName, donor.middleName, donor.lastName].filter(Boolean).join(" ") || donor.donorCode
    : "";

  const totalDonations = donations.reduce(
    (sum, d) => sum + parseFloat(d.donationAmount || "0"),
    0
  );

  const fetchDonations = useCallback(async () => {
    setDonationsLoading(true);
    try {
      const data = await apiClient<{ items?: Donation[] }>(
        `/api/donations?donorId=${donorId}&limit=100`
      );
      setDonations(data?.items ?? []);
    } catch (error) {
      console.error("Error fetching donations:", error);
      setDonations([]);
    } finally {
      setDonationsLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const onResendReceipt = useCallback(async (donationId: string) => {
    setResendingReceiptId(donationId);
    try {
      const result = await apiClient<{ success: boolean; message?: string }>(
        `/api/donations/${donationId}/resend-receipt`,
        { method: "POST" },
      );
      toast({
        title: result?.success ? "Receipt Sent" : "Send Failed",
        description: result?.message || (result?.success ? "Receipt email has been sent." : "Could not send receipt."),
        variant: result?.success ? "default" : "destructive",
      });
    } catch (err: any) {
      console.error("Failed to resend receipt:", err?.message);
      toast({
        title: "Failed to Send Receipt",
        description: err?.message || "An error occurred while sending the receipt.",
        variant: "destructive",
      });
    } finally {
      setResendingReceiptId(null);
    }
  }, [toast]);

  const onAddDonation = useCallback(() => {
    setEditingDonation(false);
    setEditingDonationId(null);
    setDonationForm(EMPTY_DONATION_FORM);
    setShowDonationDialog(true);
  }, []);

  const onEditDonation = useCallback((donation: Donation) => {
    const isKind = IN_KIND_TYPES.has(donation.donationType);
    setEditingDonation(true);
    setEditingDonationId(donation.id);
    setDonationForm({
      donationAmount: donation.donationAmount,
      donationDate: donation.donationDate ? donation.donationDate.split("T")[0] : "",
      donationMode: donation.donationMode || "CASH",
      donationType: donation.donationType,
      designatedHome: donation.donationHomeType || "NONE",
      remarks: donation.remarks || "",
      emailType: isKind ? "KIND" : "GENERAL",
    });
    setShowDonationDialog(true);
  }, []);

  const onDeleteDonation = useCallback(async (donationId: string) => {
    setDeletingDonationId(donationId);
    try {
      await apiClient(`/api/donations/${donationId}`, { method: "DELETE" });
      setDonations((prev) => prev.filter((d) => d.id !== donationId));
      toast({ title: "Donation Deleted", description: "The donation has been removed." });
    } catch (err: any) {
      console.error("Failed to delete donation:", err?.message);
      toast({
        title: "Failed to Delete Donation",
        description: err?.message || "Could not delete the donation.",
        variant: "destructive",
      });
    } finally {
      setDeletingDonationId(null);
    }
  }, [toast]);

  const onOpenMealSponsorship = useCallback(() => {
    setShowDonationDialog(false);
    const params = new URLSearchParams({
      prefillDonorId: donorId,
      prefillDonorName: donorName,
    });
    router.push(`/dashboard/meals?${params.toString()}`);
  }, [donorId, donorName, router]);

  const handleDonationSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // Safety guard — meal sponsorship choice should never reach the normal donation create endpoint.
    if (donationForm.donationType === MEAL_SPONSORSHIP_SENTINEL) {
      onOpenMealSponsorship();
      return;
    }
    setSubmittingDonation(true);
    try {
      const isKind = IN_KIND_TYPES.has(donationForm.donationType);
      const parsedAmount = parseFloat(donationForm.donationAmount);
      const effectiveAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

      const body = JSON.stringify({
        donorId,
        donationAmount: effectiveAmount,
        donationDate: donationForm.donationDate,
        donationMode: isKind ? null : (donationForm.donationMode || null),
        donationType: donationForm.donationType,
        donationHomeType: donationForm.designatedHome === "NONE" ? null : (donationForm.designatedHome || null),
        remarks: donationForm.remarks || undefined,
        emailType: isKind ? "KIND" : (donationForm.emailType || "GENERAL"),
      });

      if (editingDonationId) {
        await apiClient(`/api/donations/${editingDonationId}`, { method: "PATCH", body });
      } else {
        await apiClient("/api/donations", { method: "POST", body });
      }

      setShowDonationDialog(false);
      setDonationForm(EMPTY_DONATION_FORM);
      setEditingDonation(false);
      setEditingDonationId(null);
      await fetchDonations();
      toast({
        title: editingDonationId ? "Donation Updated" : "Donation Saved",
        description: editingDonationId
          ? "The donation has been updated successfully."
          : "The donation has been recorded successfully.",
      });
    } catch (err: any) {
      console.error("Failed to save donation:", err?.message);
      toast({
        title: editingDonationId ? "Failed to Update Donation" : "Failed to Save Donation",
        description: err?.message || "Please check the details and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDonation(false);
    }
  }, [donorId, donationForm, editingDonationId, fetchDonations, toast]);

  const onSendWhatsApp = useCallback(async (donation: Donation) => {
    if (sendingWhatsAppId) return;
    setSendingWhatsAppId(donation.id);
    try {
      const result = await apiClient<{ success: boolean; message?: string; status?: string }>(
        `/api/donations/${donation.id}/resend-whatsapp`,
        { method: "POST" },
      );
      toast({
        title: result?.success ? "WhatsApp Sent" : "WhatsApp Send Failed",
        description: result?.message || (result?.success ? "Message has been sent." : "Could not send WhatsApp."),
        variant: result?.success ? "default" : "destructive",
      });
    } catch (err: any) {
      console.error("Failed to send donation WhatsApp:", err?.message);
      toast({
        title: "Failed to Send WhatsApp",
        description: err?.message || "An error occurred while sending the WhatsApp message.",
        variant: "destructive",
      });
    } finally {
      setSendingWhatsAppId(null);
    }
  }, [sendingWhatsAppId, toast]);

  const onSendEmail = useCallback((_donation: Donation) => {}, []);

  return {
    donations,
    donationsLoading,
    totalDonations,
    isAdmin,
    canSendWhatsApp,
    canSendEmail,
    hasWhatsAppNumber,
    hasEmail,
    donorName,
    resendingReceiptId,
    sendingWhatsAppId,
    deletingDonationId,
    fetchDonations,
    onAddDonation,
    onEditDonation,
    onDeleteDonation,
    onSendWhatsApp,
    onSendEmail,
    onResendReceipt,
    onOpenMealSponsorship,
    showDonationDialog,
    setShowDonationDialog,
    editingDonation,
    donationForm,
    setDonationForm,
    submittingDonation,
    handleDonationSubmit,
  };
}
