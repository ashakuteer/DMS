"use client";

import { useState, useEffect, useCallback } from "react";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Users,
  Heart,
} from "lucide-react";

const user = typeof window !== "undefined" ? authStorage.getUser() : null;

interface ArchivedRecord {
  id: string;
  donorCode?: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  category?: string;
  homeType?: string;
  primaryPhone?: string;
  deletedAt: string;
  deletedBy?: string | null;
  deleteReason?: string | null;
}

interface ActiveRecord {
  id: string;
  donorCode?: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  category?: string;
  homeType?: string;
  primaryPhone?: string;
}

interface ConfirmState {
  record: ActiveRecord;
  type: "donor" | "beneficiary";
}

function getRecordName(r: ActiveRecord | ArchivedRecord) {
  if (r.fullName) return r.fullName;
  return `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "Unknown";
}

function getRecordCode(r: ActiveRecord | ArchivedRecord) {
  return r.donorCode ?? r.code ?? "—";
}

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Admin Access Required</h2>
      <p className="text-muted-foreground text-center max-w-sm">
        This page is restricted to administrators only. Contact your system administrator if you need access.
      </p>
    </div>
  );
}

export default function ArchiveManagementPage() {
  const { toast } = useToast();
  const currentUser = authStorage.getUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return <AccessDenied />;
  }

  return <ArchivePage />;
}

function ArchivePage() {
  const { toast } = useToast();

  const [donorSearch, setDonorSearch] = useState("");
  const [beneficiarySearch, setBeneficiarySearch] = useState("");

  const [donorActiveResults, setDonorActiveResults] = useState<ActiveRecord[]>([]);
  const [beneficiaryActiveResults, setBeneficiaryActiveResults] = useState<ActiveRecord[]>([]);

  const [archivedDonors, setArchivedDonors] = useState<ArchivedRecord[]>([]);
  const [archivedBeneficiaries, setArchivedBeneficiaries] = useState<ArchivedRecord[]>([]);
  const [archivedDonorsTotal, setArchivedDonorsTotal] = useState(0);
  const [archivedBeneficiariesTotal, setArchivedBeneficiariesTotal] = useState(0);

  const [donorArchivePage, setDonorArchivePage] = useState(1);
  const [beneficiaryArchivePage, setBeneficiaryArchivePage] = useState(1);

  const [searching, setSearching] = useState<"donor" | "beneficiary" | null>(null);
  const [loadingArchived, setLoadingArchived] = useState<"donor" | "beneficiary" | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [confirmCode, setConfirmCode] = useState("");

  const CONFIRM_WORD = "ARCHIVE";

  const loadArchivedDonors = useCallback(async (page = 1) => {
    setLoadingArchived("donor");
    try {
      const res = await fetchWithAuth(`/api/donors/archived?page=${page}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setArchivedDonors(json.data ?? []);
        setArchivedDonorsTotal(json.pagination?.total ?? 0);
      }
    } finally {
      setLoadingArchived(null);
    }
  }, []);

  const loadArchivedBeneficiaries = useCallback(async (page = 1) => {
    setLoadingArchived("beneficiary");
    try {
      const res = await fetchWithAuth(`/api/beneficiaries/archived?page=${page}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setArchivedBeneficiaries(json.data ?? []);
        setArchivedBeneficiariesTotal(json.pagination?.total ?? 0);
      }
    } finally {
      setLoadingArchived(null);
    }
  }, []);

  useEffect(() => {
    loadArchivedDonors(1);
    loadArchivedBeneficiaries(1);
  }, [loadArchivedDonors, loadArchivedBeneficiaries]);

  const searchActiveDonors = async () => {
    if (!donorSearch.trim()) return;
    setSearching("donor");
    try {
      const res = await fetchWithAuth(`/api/donors?search=${encodeURIComponent(donorSearch)}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setDonorActiveResults(json.data ?? json ?? []);
      }
    } finally {
      setSearching(null);
    }
  };

  const searchActiveBeneficiaries = async () => {
    if (!beneficiarySearch.trim()) return;
    setSearching("beneficiary");
    try {
      const res = await fetchWithAuth(`/api/beneficiaries?search=${encodeURIComponent(beneficiarySearch)}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        setBeneficiaryActiveResults(json.data ?? json ?? []);
      }
    } finally {
      setSearching(null);
    }
  };

  const handleArchive = async () => {
    if (!confirmState) return;
    if (confirmCode !== CONFIRM_WORD) return;
    if (!archiveReason.trim()) return;

    setArchiving(true);
    try {
      const endpoint =
        confirmState.type === "donor"
          ? `/api/donors/${confirmState.record.id}`
          : `/api/beneficiaries/${confirmState.record.id}`;

      const res = await fetchWithAuth(endpoint, {
        method: "DELETE",
        body: JSON.stringify({ reason: archiveReason.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Archive failed" }));
        throw new Error(err.message || "Could not archive this record");
      }

      toast({
        title: "Record Archived",
        description: `${getRecordName(confirmState.record)} (${getRecordCode(confirmState.record)}) has been archived.`,
      });

      setConfirmState(null);
      setArchiveReason("");
      setConfirmCode("");

      if (confirmState.type === "donor") {
        setDonorActiveResults((prev) => prev.filter((r) => r.id !== confirmState.record.id));
        await loadArchivedDonors(donorArchivePage);
      } else {
        setBeneficiaryActiveResults((prev) => prev.filter((r) => r.id !== confirmState.record.id));
        await loadArchivedBeneficiaries(beneficiaryArchivePage);
      }
    } catch (err: any) {
      toast({
        title: "Archive Failed",
        description: err?.message || "Could not archive this record.",
        variant: "destructive",
      });
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (record: ArchivedRecord, type: "donor" | "beneficiary") => {
    setRestoring(record.id);
    try {
      const endpoint =
        type === "donor"
          ? `/api/donors/${record.id}/restore`
          : `/api/beneficiaries/${record.id}/restore`;

      const res = await fetchWithAuth(endpoint, { method: "POST" });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Restore failed" }));
        throw new Error(err.message || "Could not restore this record");
      }

      toast({
        title: "Record Restored",
        description: `${getRecordName(record)} (${getRecordCode(record)}) has been restored and is active again.`,
      });

      if (type === "donor") {
        await loadArchivedDonors(donorArchivePage);
      } else {
        await loadArchivedBeneficiaries(beneficiaryArchivePage);
      }
    } catch (err: any) {
      toast({
        title: "Restore Failed",
        description: err?.message || "Could not restore this record.",
        variant: "destructive",
      });
    } finally {
      setRestoring(null);
    }
  };

  const canConfirmArchive =
    confirmCode === CONFIRM_WORD && archiveReason.trim().length >= 5;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArchiveRestore className="h-6 w-6" />
          Archive Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Safely archive donor and beneficiary records. Archived records are hidden from all normal views and can be restored by administrators.
        </p>
      </div>

      <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Admin-only action.</strong> Archiving a record hides it from all staff and telecallers. The record is soft-deleted (not permanently removed) and can be fully restored.
        </div>
      </div>

      <Tabs defaultValue="donors">
        <TabsList>
          <TabsTrigger value="donors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Donors
          </TabsTrigger>
          <TabsTrigger value="beneficiaries" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Beneficiaries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donors" className="space-y-6 mt-4">
          <ArchiveSection
            label="Donor"
            type="donor"
            activeSearch={donorSearch}
            onSearchChange={setDonorSearch}
            onSearch={searchActiveDonors}
            searching={searching === "donor"}
            activeResults={donorActiveResults}
            onArchiveClick={(record) => {
              setConfirmState({ record, type: "donor" });
              setArchiveReason("");
              setConfirmCode("");
            }}
            archivedRecords={archivedDonors}
            archivedTotal={archivedDonorsTotal}
            archivedPage={donorArchivePage}
            loadingArchived={loadingArchived === "donor"}
            onRestoreClick={(record) => handleRestore(record, "donor")}
            restoring={restoring}
            onPageChange={(p) => {
              setDonorArchivePage(p);
              loadArchivedDonors(p);
            }}
          />
        </TabsContent>

        <TabsContent value="beneficiaries" className="space-y-6 mt-4">
          <ArchiveSection
            label="Beneficiary"
            type="beneficiary"
            activeSearch={beneficiarySearch}
            onSearchChange={setBeneficiarySearch}
            onSearch={searchActiveBeneficiaries}
            searching={searching === "beneficiary"}
            activeResults={beneficiaryActiveResults}
            onArchiveClick={(record) => {
              setConfirmState({ record, type: "beneficiary" });
              setArchiveReason("");
              setConfirmCode("");
            }}
            archivedRecords={archivedBeneficiaries}
            archivedTotal={archivedBeneficiariesTotal}
            archivedPage={beneficiaryArchivePage}
            loadingArchived={loadingArchived === "beneficiary"}
            onRestoreClick={(record) => handleRestore(record, "beneficiary")}
            restoring={restoring}
            onPageChange={(p) => {
              setBeneficiaryArchivePage(p);
              loadArchivedBeneficiaries(p);
            }}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!confirmState}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmState(null);
            setArchiveReason("");
            setConfirmCode("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Archive Record
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  You are about to archive{" "}
                  <strong>
                    {confirmState ? getRecordName(confirmState.record) : ""}
                  </strong>{" "}
                  ({confirmState ? getRecordCode(confirmState.record) : ""}).
                </p>
                <p className="text-yellow-700 dark:text-yellow-400 text-xs bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded px-2 py-1.5">
                  This record will be hidden from all normal views. It can be restored from this page at any time.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="archive-reason">
                Reason for archiving <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="archive-reason"
                placeholder="Explain why this record is being archived (minimum 5 characters)..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                rows={3}
                data-testid="input-archive-reason"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-code">
                Type <strong className="text-destructive font-mono">{CONFIRM_WORD}</strong> to confirm
              </Label>
              <Input
                id="confirm-code"
                placeholder={`Type ${CONFIRM_WORD} here`}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
                className={
                  confirmCode && confirmCode !== CONFIRM_WORD
                    ? "border-destructive"
                    : ""
                }
                data-testid="input-confirm-code"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmState(null);
                setArchiveReason("");
                setConfirmCode("");
              }}
              data-testid="button-cancel-archive"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canConfirmArchive || archiving}
              onClick={handleArchive}
              data-testid="button-confirm-archive"
            >
              {archiving ? "Archiving..." : "Archive Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ArchiveSectionProps {
  label: string;
  type: "donor" | "beneficiary";
  activeSearch: string;
  onSearchChange: (v: string) => void;
  onSearch: () => void;
  searching: boolean;
  activeResults: ActiveRecord[];
  onArchiveClick: (record: ActiveRecord) => void;
  archivedRecords: ArchivedRecord[];
  archivedTotal: number;
  archivedPage: number;
  loadingArchived: boolean;
  onRestoreClick: (record: ArchivedRecord) => void;
  restoring: string | null;
  onPageChange: (page: number) => void;
}

function ArchiveSection({
  label,
  activeSearch,
  onSearchChange,
  onSearch,
  searching,
  activeResults,
  onArchiveClick,
  archivedRecords,
  archivedTotal,
  archivedPage,
  loadingArchived,
  onRestoreClick,
  restoring,
  onPageChange,
}: ArchiveSectionProps) {
  const totalPages = Math.ceil(archivedTotal / 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
            Archive a {label}
          </CardTitle>
          <CardDescription>
            Search for an active {label.toLowerCase()} and select it to archive. The record will be hidden from all non-admin users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={`Search by name or ${label === "Donor" ? "donor code" : "code"}...`}
              value={activeSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              data-testid={`input-search-active-${label.toLowerCase()}`}
            />
            <Button
              variant="outline"
              onClick={onSearch}
              disabled={searching}
              data-testid={`button-search-active-${label.toLowerCase()}`}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {activeResults.length > 0 && (
            <div className="rounded-md border divide-y">
              {activeResults.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-4 py-3"
                  data-testid={`row-active-${label.toLowerCase()}-${record.id}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{getRecordName(record)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {getRecordCode(record)}
                      </span>
                      {(record.category || record.homeType) && (
                        <Badge variant="outline" className="text-xs py-0">
                          {record.category ?? record.homeType}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/40 hover:bg-destructive/10 shrink-0"
                    onClick={() => onArchiveClick(record)}
                    data-testid={`button-archive-${label.toLowerCase()}-${record.id}`}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Archive
                  </Button>
                </div>
              ))}
            </div>
          )}

          {activeResults.length === 0 && activeSearch && !searching && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active {label.toLowerCase()}s found. Try a different search.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            Archived {label}s
            {archivedTotal > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {archivedTotal} record{archivedTotal !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            These records are hidden from normal views. You can restore them to make them active again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingArchived ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
          ) : archivedRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No archived {label.toLowerCase()}s.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border divide-y">
                {archivedRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                    data-testid={`row-archived-${label.toLowerCase()}-${record.id}`}
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-medium text-sm">{getRecordName(record)}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">
                          {getRecordCode(record)}
                        </span>
                        {(record.category || record.homeType) && (
                          <Badge variant="outline" className="text-xs py-0">
                            {record.category ?? record.homeType}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>
                          Archived:{" "}
                          {new Date(record.deletedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        {record.deleteReason && (
                          <div className="text-yellow-700 dark:text-yellow-400">
                            Reason: {record.deleteReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-700 border-green-400 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/20 shrink-0 mt-1"
                      onClick={() => onRestoreClick(record)}
                      disabled={restoring === record.id}
                      data-testid={`button-restore-${label.toLowerCase()}-${record.id}`}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      {restoring === record.id ? "Restoring..." : "Restore"}
                    </Button>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Page {archivedPage} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={archivedPage <= 1}
                      onClick={() => onPageChange(archivedPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={archivedPage >= totalPages}
                      onClick={() => onPageChange(archivedPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
