import { useState, useCallback, useEffect } from "react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import type { Donation, Donor, Template } from "../types";

export function useDonorDonations(donorId: string, donor?: Donor | null) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [resendingReceiptId, setResendingReceiptId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

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
      const res = await fetchWithAuth(`/api/donations?donorId=${donorId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setDonations(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setDonationsLoading(false);
    }
  }, [donorId]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
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
      await fetchWithAuth(`/api/donations/${donationId}/resend-receipt`, { method: "POST" });
    } catch {
      console.error("Failed to resend receipt");
    } finally {
      setResendingReceiptId(null);
    }
  }, []);

  const onAddDonation = useCallback(() => {}, []);
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
  };
}
