"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Download,
  Upload,
  Database,
  Clock,
  AlertTriangle,
  FileArchive,
  Loader2,
  HardDrive,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { authStorage, fetchWithAuth } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";

interface BackupEntry {
  id: string;
  filename: string;
  sizeBytes: number;
  tablesIncluded: string[];
  recordCounts: Record<string, number>;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ tablesRestored: string[]; recordCounts: Record<string, number> } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/backup/history");
      if (res.ok) {
        setBackups(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch backup history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const authUser = authStorage.getUser();
  if (authUser && !canAccessModule(authUser?.role, "backup"))
    return <AccessDenied />;

  const handleCreateBackup = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/backup/create", { method: "POST" });
      if (!res.ok) throw new Error("Backup creation failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : `backup-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      await fetchBackups();
    } catch (err: any) {
      setError(err.message || "Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreClick = () => {
    setShowRestoreModal(true);
    setConfirmText("");
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRestore = async () => {
    if (!selectedFile || confirmText !== "RESTORE") return;
    setRestoring(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetchWithAuth("/api/backup/restore", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Restore failed");
      }
      const result = await res.json();
      setRestoreResult(result);
      setShowRestoreModal(false);
      setShowSuccessModal(true);
      await fetchBackups();
    } catch (err: any) {
      setError(err.message || "Failed to restore backup");
    } finally {
      setRestoring(false);
    }
  };

  const lastBackup = backups.length > 0 ? backups[0] : null;
  const totalRecords = lastBackup
    ? Object.values(lastBackup.recordCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Data Backup & Restore
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Export and restore your organization data securely
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleCreateBackup}
            disabled={creating}
            data-testid="button-create-backup"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {creating ? "Creating..." : "Create Backup"}
          </Button>
          <Button
            variant="outline"
            onClick={handleRestoreClick}
            data-testid="button-restore-backup"
          >
            <Upload className="h-4 w-4 mr-2" />
            Restore from Backup
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4 flex items-center gap-2 text-destructive">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-last-backup">
              {lastBackup ? timeAgo(lastBackup.createdAt) : "Never"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastBackup ? formatDate(lastBackup.createdAt) : "No backups created yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-backup-size">
              {lastBackup ? formatBytes(lastBackup.sizeBytes) : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastBackup ? `${lastBackup.tablesIncluded.length} tables exported` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Records Backed Up</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-record-count">
              {lastBackup ? totalRecords.toLocaleString() : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastBackup ? `By ${lastBackup.createdByName}` : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No backups created yet</p>
              <p className="text-sm mt-1">Click "Create Backup" to generate your first backup</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Tables</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => {
                    const records = Object.values(backup.recordCounts).reduce(
                      (a, b) => a + b,
                      0
                    );
                    return (
                      <TableRow key={backup.id} data-testid={`row-backup-${backup.id}`}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(backup.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {backup.filename}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {formatBytes(backup.sizeBytes)}
                          </Badge>
                        </TableCell>
                        <TableCell>{backup.tablesIncluded.length}</TableCell>
                        <TableCell>{records.toLocaleString()}</TableCell>
                        <TableCell>{backup.createdByName}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">What Gets Backed Up</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              "Donors",
              "Donations",
              "Beneficiaries",
              "Sponsorships",
              "Sponsorship Payments",
              "Sponsorship Reminders",
              "Pledges",
              "Campaigns",
              "Family Members",
              "Special Occasions",
              "Beneficiary Updates",
              "Sponsor Dispatches",
              "Timeline Events",
              "Health Metrics",
              "Progress Cards",
              "Health Events",
              "Documents Metadata",
              "Document Access Logs",
              "Communication Logs",
              "Email Logs",
              "Email Jobs",
              "Reminders",
              "Reminder Tasks",
              "Report Campaigns",
              "Templates",
              "Message Templates",
              "Milestones",
              "Outbound Messages",
              "Org Profile",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRestoreModal} onOpenChange={setShowRestoreModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Restore from Backup
            </DialogTitle>
            <DialogDescription>
              This will replace all existing data with the data from the backup
              file. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive dark:bg-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Warning: Destructive Operation</p>
                  <p className="mt-1">
                    All current donors, donations, beneficiaries, sponsorships,
                    pledges, and related data will be permanently deleted and
                    replaced with the backup data.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Select Backup File (.zip)
              </label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                data-testid="input-restore-file"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Type <span className="font-mono font-bold">RESTORE</span> to confirm
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type RESTORE to confirm"
                data-testid="input-confirm-restore"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreModal(false)}
              disabled={restoring}
              data-testid="button-cancel-restore"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={
                restoring || confirmText !== "RESTORE" || !selectedFile
              }
              data-testid="button-confirm-restore"
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {restoring ? "Restoring..." : "Restore Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Restore Completed
            </DialogTitle>
            <DialogDescription>
              Data has been successfully restored from backup.
            </DialogDescription>
          </DialogHeader>

          {restoreResult && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {restoreResult.tablesRestored.length} tables restored:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {restoreResult.tablesRestored.map((table) => (
                  <div
                    key={table}
                    className="flex items-center justify-between text-sm px-2 py-1 rounded bg-muted/50"
                  >
                    <span className="font-mono text-xs">{table}</span>
                    <Badge variant="secondary">
                      {(restoreResult.recordCounts[table] || 0).toLocaleString()} records
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowSuccessModal(false)}
              data-testid="button-close-success"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
