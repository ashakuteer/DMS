"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchWithAuth } from "@/lib/auth";

type StaffUser = { id: string; name: string; email: string; role: string };
type DonorOwner = { id: string; name: string; email: string } | null;

export default function AssignDonorOwner({
  donorId,
  currentOwner,
}: {
  donorId: string;
  currentOwner: DonorOwner;
}) {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    setSelectedId(currentOwner?.id ?? "");
  }, [currentOwner]);

  useEffect(() => {
    let mounted = true;

    async function loadStaff() {
      try {
        setLoadingStaff(true);
        const res = await fetchWithAuth("/api/users/staff");

        if (!res.ok) {
          throw new Error(`Failed to load staff (${res.status})`);
        }

        const data = await res.json();
        if (mounted) {
          setStaff(Array.isArray(data) ? data : (data.items ?? []));
        }
      } catch (err) {
        console.error("Failed to load staff users:", err);
        if (mounted) setStaff([]);
      } finally {
        if (mounted) setLoadingStaff(false);
      }
    }

    loadStaff();
    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/donors/${donorId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          assignedToUserId: selectedId || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Assign failed (${res.status})`);
      }

      window.location.reload();
    } catch (err) {
      console.error("Assign donor failed:", err);
      alert(t("donor_profile.assign_failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded border p-4 space-y-2">
      <div>
        <b>{t("donor_profile.owner")}:</b>{" "}
        {currentOwner
          ? `${currentOwner.name} (${currentOwner.email})`
          : t("donor_profile.unassigned")}
      </div>

      <div className="flex gap-2 items-center">
        <select
          className="border rounded px-2 py-1"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={loading || loadingStaff}
          data-testid="select-assign-owner"
        >
          <option value="">{t("donor_profile.unassigned")}</option>
          {staff.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>

        <button
          onClick={save}
          disabled={loading || loadingStaff}
          className="bg-blue-600 text-white px-3 py-1 rounded"
          data-testid="button-save-assign"
        >
          {loading ? t("common.saving") : t("common.save")}
        </button>
      </div>

      {loadingStaff && (
        <div className="text-sm text-muted-foreground">{t("donor_profile.loading_staff")}</div>
      )}
    </div>
  );
}
