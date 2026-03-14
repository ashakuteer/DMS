"use client";

import { useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function useDonorReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadReports = useCallback(
    async (filters: { type?: string; donorId?: string } = {}) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "10");
        if (filters.type) params.set("type", filters.type);
        if (filters.donorId) params.set("donorId", filters.donorId);

        const res = await fetchWithAuth(`/api/donor-reports?${params}`);
        if (!res.ok) throw new Error("Failed to fetch reports");
        const data = await res.json();

        setReports(Array.isArray(data) ? data : data.reports ?? data.data ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? data.pages ?? 1);
      } catch {
        toast({ title: "Failed to load reports", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [page, toast],
  );

  return { reports, total, page, totalPages, loading, setPage, loadReports };
}
