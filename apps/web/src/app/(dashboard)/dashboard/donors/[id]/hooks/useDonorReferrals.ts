"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/auth";

export interface ReferralDonorItem {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
  createdAt: string;
  totalDonations: number;
  donationCount: number;
}

export interface ReferredByDonor {
  id: string;
  donorCode: string;
  firstName: string;
  lastName: string | null;
}

export interface ReferralData {
  referredBy: ReferredByDonor | null;
  referredDonors: ReferralDonorItem[];
}

export function useDonorReferrals(donorId: string, enabled: boolean) {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!donorId || !enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWithAuth(`/api/donors/${donorId}/referrals`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load referral data");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [donorId, enabled]);

  return { data, loading, error };
}
