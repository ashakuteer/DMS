"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Eye,
  Loader2,
} from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ACTION_LABELS: Record<string, string> = {
  DONOR_CREATE: "Donor Created",
  DONOR_UPDATE: "Donor Updated",
  DONOR_DELETE: "Donor Deleted",
  DONOR_ASSIGNMENT_CHANGE: "Donor Assignment Changed",
  DONOR_MERGE: "Donors Merged",
  DONATION_CREATE: "Donation Created",
  DONATION_UPDATE: "Donation Updated",
  DONATION_DELETE: "Donation Deleted",
  BENEFICIARY_CREATE: "Beneficiary Created",
  BENEFICIARY_UPDATE: "Beneficiary Updated",
  BENEFICIARY_DELETE: "Beneficiary Deleted",
  PLEDGE_CREATE: "Pledge Created",
  PLEDGE_UPDATE: "Pledge Updated",
  PLEDGE_DELETE: "Pledge Deleted",
  PLEDGE_FULFILLED: "Pledge Fulfilled",
  PLEDGE_POSTPONED: "Pledge Postponed",
  PLEDGE_CANCELLED: "Pledge Cancelled",
  EMAIL_SEND: "Email Sent",
  WHATSAPP_SEND: "WhatsApp Sent",
  RECEIPT_REGENERATE: "Receipt Regenerated",
  DATA_EXPORT: "Data Exported",
  ROLE_CHANGE: "Role Changed",
  FULL_ACCESS_REQUEST: "Full Access Requested",
  LOGIN: "Login",
  LOGOUT: "Logout",
  HEALTH_STATUS_CHANGE: "Health Status Changed",
};

const ACTION_COLORS: Record<string, string> = {
  DONOR_CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DONATION_CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  BENEFICIARY_CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PLEDGE_CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  DONOR_UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DONATION_UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  BENEFICIARY_UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PLEDGE_UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DONOR_DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  DONATION_DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  BENEFICIARY_DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  PLEDGE_DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  EMAIL_SEND: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  WHATSAPP_SEND: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  PLEDGE_FULFILLED: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  PLEDGE_POSTPONED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PLEDGE_CANCELLED: "bg-[#E6F4F1] text-[#5FA8A8] dark:bg-[#5FA8A8]/20 dark:text-[#A8D5D1]",
  DATA_EXPORT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  ROLE_CHANGE: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  LOGIN: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  const [filterUser, setFilterUser] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "25");
      if (filterUser && filterUser !== "all") params.set("userId", filterUser);
      if (filterAction && filterAction !== "all") params.set("action", filterAction);
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);

      const res = await fetchWithAuth(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data: AuditLogResponse = await res.json();
        setLogs(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterUser, filterAction, filterStartDate, filterEndDate]);

  const fetchFilters = useCallback(async () => {
    try {
      const [usersRes, actionsRes] = await Promise.all([
        fetchWithAuth("/api/audit-logs/users"),
        fetchWithAuth("/api/audit-logs/actions"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (actionsRes.ok) setActions(await actionsRes.json());
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const authUser = authStorage.getUser();
  if (authUser && !canAccessModule(authUser?.role, 'auditLog')) return <AccessDenied />;

  const clearFilters = () => {
    setFilterUser("");
    setFilterAction("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(1);
  };

  const hasActiveFilters = (filterUser && filterUser !== "all") || (filterAction && filterAction !== "all") || filterStartDate || filterEndDate;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const viewDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-audit-log-title">
            System Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all system actions and changes for security and compliance
          </p>
        </div>
        <Badge variant="secondary" className="text-sm" data-testid="badge-total-entries">
          {total.toLocaleString()} entries
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                User
              </label>
              <Select value={filterUser} onValueChange={(v) => { setFilterUser(v); setPage(1); }}>
                <SelectTrigger data-testid="select-filter-user">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Action Type
              </label>
              <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1); }}>
                <SelectTrigger data-testid="select-filter-action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ACTION_LABELS[a] || a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Start Date
              </label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                data-testid="input-filter-start-date"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                End Date
              </label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                data-testid="input-filter-end-date"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                Showing {total} result{total !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Actions will appear here as users interact with the system"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead className="w-[150px]">User</TableHead>
                      <TableHead className="w-[180px]">Action</TableHead>
                      <TableHead className="w-[120px]">Entity</TableHead>
                      <TableHead className="w-[200px]">Entity ID</TableHead>
                      <TableHead className="w-[60px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{log.user.name}</span>
                            <span className="text-xs text-muted-foreground">{log.user.role}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            }`}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.entityType || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono text-xs">
                          {log.entityId ? (
                            <span title={log.entityId}>
                              {log.entityId.length > 20
                                ? `${log.entityId.substring(0, 20)}...`
                                : log.entityId}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {(log.oldValue || log.newValue || log.metadata) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewDetail(log)}
                              data-testid={`button-view-detail-${log.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                      ACTION_COLORS[selectedLog.action] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    }`}
                  >
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm mt-1">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm mt-1">
                    {selectedLog.user.name} ({selectedLog.user.role})
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedLog.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Entity</p>
                  <p className="text-sm mt-1">
                    {selectedLog.entityType || "N/A"}
                  </p>
                  {selectedLog.entityId && (
                    <p className="text-xs text-muted-foreground font-mono break-all">
                      {selectedLog.entityId}
                    </p>
                  )}
                </div>
              </div>

              {selectedLog.ipAddress && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <p className="text-sm mt-1 font-mono">{selectedLog.ipAddress}</p>
                </div>
              )}

              {selectedLog.oldValue && Object.keys(selectedLog.oldValue).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Old Value</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && Object.keys(selectedLog.newValue).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">New Value</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadata</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
