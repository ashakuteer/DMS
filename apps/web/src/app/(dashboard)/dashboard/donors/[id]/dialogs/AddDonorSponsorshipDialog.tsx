"use client";

import { useState, useCallback } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

interface AddDonorSponsorshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    beneficiaryId: string;
    sponsorshipType: string;
    amount: string;
    currency: string;
    frequency: string;
    startDate: string;
    status: string;
    notes: string;
  };
  setForm: (form: any) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddDonorSponsorshipDialog({
  open,
  onOpenChange,
  form,
  setForm,
  loading,
  onSubmit,
}: AddDonorSponsorshipDialogProps) {
  const { t } = useTranslation();
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);

  const SPONSORSHIP_TYPES = [
    { value: "FULL", label: t("donor_profile.sptype_full") },
    { value: "PARTIAL", label: t("donor_profile.sptype_partial") },
    { value: "EDUCATION", label: t("donor_profile.sptype_education") },
    { value: "MEDICAL", label: t("donor_profile.sptype_medical") },
    { value: "FOOD", label: t("donor_profile.sptype_food") },
    { value: "GROCERIES", label: t("donor_profile.grocery") },
    { value: "MONTHLY_SUPPORT", label: t("donor_profile.sptype_monthly_support") },
    { value: "ONE_TIME", label: t("donor_profile.freq_one_time") },
    { value: "FESTIVAL", label: t("donor_profile.sptype_festival") },
    { value: "OTHER", label: t("common.other") },
  ];

  const FREQUENCIES = [
    { value: "MONTHLY", label: t("donor_profile.freq_monthly") },
    { value: "QUARTERLY", label: t("donor_profile.freq_quarterly") },
    { value: "YEARLY", label: t("donor_profile.freq_yearly") },
    { value: "ONE_TIME", label: t("donor_profile.freq_one_time") },
    { value: "ADHOC", label: t("donor_profile.adhoc") },
  ];

  const STATUSES = [
    { value: "ACTIVE", label: t("donor_profile.status_active") },
    { value: "PAUSED", label: t("donor_profile.status_paused") },
    { value: "STOPPED", label: t("donor_profile.status_stopped") },
  ];

  const handleSearch = useCallback(async (q: string) => {
    setBeneficiarySearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await apiClient<any[]>(`/api/beneficiaries/search?q=${encodeURIComponent(q)}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const selectBeneficiary = useCallback((b: any) => {
    setSelectedBeneficiary(b);
    setForm((prev: any) => ({ ...prev, beneficiaryId: b.id }));
    setBeneficiarySearch("");
    setSearchResults([]);
  }, [setForm]);

  const clearBeneficiary = useCallback(() => {
    setSelectedBeneficiary(null);
    setForm((prev: any) => ({ ...prev, beneficiaryId: "" }));
  }, [setForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            {t("donor_profile.add_sponsorship")}
          </DialogTitle>
          <DialogDescription>
            {t("donor_profile.add_sponsorship_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("donor_profile.beneficiary_label")} *</Label>
            {selectedBeneficiary ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium">{selectedBeneficiary.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedBeneficiary.code} · {selectedBeneficiary.homeType}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearBeneficiary}>
                  {t("donor_profile.change")}
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                <Input
                  placeholder={t("donor_profile.search_beneficiary")}
                  value={beneficiarySearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  data-testid="input-beneficiary-search"
                />
                {searching && (
                  <p className="text-xs text-muted-foreground">{t("donor_profile.searching")}</p>
                )}
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {searchResults.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted flex justify-between text-sm"
                        onClick={() => selectBeneficiary(b)}
                      >
                        <span>{b.fullName}</span>
                        <span className="text-xs text-muted-foreground">{b.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("donor_profile.sponsorship_type")} *</Label>
            <Select
              value={form.sponsorshipType}
              onValueChange={(v) => setForm((p: any) => ({ ...p, sponsorshipType: v }))}
            >
              <SelectTrigger data-testid="select-sponsorship-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPONSORSHIP_TYPES.map((st) => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("donor_profile.amount_label")}</Label>
              <Input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((p: any) => ({ ...p, amount: e.target.value }))}
                data-testid="input-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("donor_profile.currency")}</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm((p: any) => ({ ...p, currency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("donor_profile.frequency")}</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm((p: any) => ({ ...p, frequency: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("donor_profile.status")}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p: any) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("donor_profile.start_date")}</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((p: any) => ({ ...p, startDate: e.target.value }))}
              data-testid="input-start-date"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("donor_profile.notes")}</Label>
            <Textarea
              placeholder={t("donor_profile.optional_notes")}
              value={form.notes}
              onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))}
              data-testid="input-notes"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.beneficiaryId}
              data-testid="button-submit-sponsorship"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("donor_profile.add_sponsorship")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
