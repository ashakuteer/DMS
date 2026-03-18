import { useState, useCallback, useEffect } from "react";
import { authStorage } from "@/lib/auth";
import { apiClient } from "@/lib/api-client";
import { hasPermission } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import type { Donation, Donor, DonationFormData, Template } from "../types";

const EMPTY_DONATION_FORM: DonationFormData = {
  donationAmount: "",
  donationDate: new Date().toISOString().split("T")[0],
  donationMode: "CASH",
  donationType: "CASH",
  designatedHome: "NONE",
  remarks: "",
  emailType: "GENERAL",
};

export function useDonorDonations(donorId: string, donor?: Donor | null) {
  const { toast } = useToast();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [resendingReceiptId, setResendingReceiptId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [donationForm, setDonationForm] = useState<DonationFormData>(EMPTY_DONATION_FORM);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  const user = authStorage.getUser();
  const isAdmin = user?.role === "ADMIN";
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

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await apiClient<Template[]>("/api/templates");
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch templates");
    }
  }, []);

  useEffect(() => {
    fetchDonations();
    fetchTemplates();
  }, [fetchDonations, fetchTemplates]);

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
    setDonationForm(EMPTY_DONATION_FORM);
    setShowDonationDialog(true);
  }, []);

  const handleDonationSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDonation(true);
    try {
      const IN_KIND_TYPES = new Set(["GROCERY", "MEDICINES", "PREPARED_FOOD", "USED_ITEMS", "KIND"]);
      const isKind = IN_KIND_TYPES.has(donationForm.donationType);
      const parsedAmount = parseFloat(donationForm.donationAmount);
      const effectiveAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

      await apiClient("/api/donations", {
        method: "POST",
        body: JSON.stringify({
          donorId,
          donationAmount: effectiveAmount,
          donationDate: donationForm.donationDate,
          donationMode: isKind ? null : (donationForm.donationMode || null),
          donationType: donationForm.donationType,
          donationHomeType: donationForm.designatedHome === "NONE" ? null : (donationForm.designatedHome || null),
          remarks: donationForm.remarks || undefined,
          emailType: isKind ? 'KIND' : (donationForm.emailType || 'GENERAL'),
        }),
      });
      setShowDonationDialog(false);
      setDonationForm(EMPTY_DONATION_FORM);
      await fetchDonations();
      toast({ title: "Donation Saved", description: "The donation has been recorded successfully." });
    } catch (err: any) {
      console.error("Failed to add donation:", err?.message);
      toast({
        title: "Failed to Save Donation",
        description: err?.message || "Please check the details and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingDonation(false);
    }
  }, [donorId, donationForm, fetchDonations]);

  const onSendWhatsApp = useCallback((_donation: Donation) => {}, []);
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
    templates,
    donorName,
    resendingReceiptId,
    fetchDonations,
    onAddDonation,
    onSendWhatsApp,
    onSendEmail,
    onResendReceipt,
    showDonationDialog,
    setShowDonationDialog,
    donationForm,
    setDonationForm,
    submittingDonation,
    handleDonationSubmit,
  };
}
