"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, RefreshCw, RotateCcw, Trash2, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { authStorage } from "@/lib/auth";
import { canAccessModule } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";

interface EmailJob {
  id: string;
  donorId: string | null;
  toEmail: string;
  subject: string;
  body: string;
  type: "SPECIAL_DAY" | "PLEDGE_REMINDER" | "FOLLOW_UP";
  status: "QUEUED" | "SENT" | "FAILED";
  attempts: number;
  lastError: string | null;
  scheduledAt: string;
  sentAt: string | null;
  createdAt: string;
  donor: {
    id: string;
    firstName: string;
    lastName: string | null;
    donorCode: string;
  } | null;
}

interface Stats {
  queued: number;
  sent: number;
  failed: number;
  total: number;
}

export default function EmailJobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = authStorage.getUser();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [stats, setStats] = useState<Stats>({ queued: 0, sent: 0, failed: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [statusFilter, typeFilter, page]);

  async function fetchJobs() {
    setLoading(true);
    try {
      const token = authStorage.getAccessToken();
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const res = await fetch(`/api/email-jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      toast({ title: "Error loading email jobs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch("/api/email-jobs/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function handleRetry(id: string) {
    setActionLoading(id);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`/api/email-jobs/${id}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Email job queued for retry" });
        fetchJobs();
        fetchStats();
      } else {
        toast({ title: "Failed to retry job", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error retrying job", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      const token = authStorage.getAccessToken();
      const res = await fetch(`/api/email-jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Email job deleted" });
        fetchJobs();
        fetchStats();
      } else {
        toast({ title: "Failed to delete job", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error deleting job", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "QUEUED":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
      case "SENT":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case "FAILED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "SPECIAL_DAY":
        return <Badge variant="outline">Special Day</Badge>;
      case "PLEDGE_REMINDER":
        return <Badge variant="outline">Pledge</Badge>;
      case "FOLLOW_UP":
        return <Badge variant="outline">Follow-up</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  if (user && !canAccessModule(user?.role, 'settings')) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/settings")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Email Queue</h1>
          <p className="text-muted-foreground mt-1">View and manage automated email jobs</p>
        </div>
        <Button variant="outline" onClick={() => { fetchJobs(); fetchStats(); }} data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Emails</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Queued</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{stats.queued}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sent</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Email Jobs</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="QUEUED">Queued</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40" data-testid="select-type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SPECIAL_DAY">Special Day</SelectItem>
                  <SelectItem value="PLEDGE_REMINDER">Pledge</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No email jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{getTypeBadge(job.type)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.toEmail}</p>
                          {job.donor && (
                            <p className="text-xs text-muted-foreground">
                              {job.donor.firstName} {job.donor.lastName} ({job.donor.donorCode})
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={job.subject}>
                        {job.subject}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(job.scheduledAt)}
                        {job.sentAt && (
                          <p className="text-xs text-green-600">Sent: {formatDate(job.sentAt)}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.attempts}
                        {job.lastError && (
                          <p className="text-xs text-red-500 max-w-32 truncate" title={job.lastError}>
                            {job.lastError}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {job.status === "FAILED" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRetry(job.id)}
                              disabled={actionLoading === job.id}
                              data-testid={`button-retry-${job.id}`}
                            >
                              {actionLoading === job.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleDelete(job.id)}
                            disabled={actionLoading === job.id}
                            data-testid={`button-delete-${job.id}`}
                          >
                            {actionLoading === job.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
