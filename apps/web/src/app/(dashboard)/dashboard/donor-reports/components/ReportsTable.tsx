"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  FileDown,
  FileSpreadsheet,
  Share2,
  Trash2,
} from "lucide-react";

interface ReportActions {
  preview: (report: any) => void;
  pdf: (id: string) => void;
  excel: (id: string) => void;
  share: (id: string) => void;
  delete: (id: string) => void;
}

interface Props {
  reports: any[];
  loading: boolean;
  actions: ReportActions;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function reportTypeBadge(type: string) {
  const map: Record<string, string> = {
    DONOR_SUMMARY: "bg-blue-100 text-blue-800",
    DONATION_HISTORY: "bg-green-100 text-green-800",
    IMPACT_REPORT: "bg-purple-100 text-purple-800",
    ANNUAL_STATEMENT: "bg-orange-100 text-orange-800",
    CUSTOM: "bg-gray-100 text-gray-800",
  };
  return map[type] ?? "bg-gray-100 text-gray-800";
}

export default function ReportsTable({ reports, loading, actions }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="border rounded-md p-10 text-center text-muted-foreground">
        No reports found.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Donor</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium max-w-[200px] truncate">
                {report.title ?? "Untitled"}
              </TableCell>

              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${reportTypeBadge(report.reportType ?? report.type)}`}
                >
                  {(report.reportType ?? report.type ?? "CUSTOM")
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </span>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {report.donor
                  ? `${report.donor.firstName} ${report.donor.lastName ?? ""}`.trim()
                  : report.donorId
                    ? report.donorId.slice(0, 8) + "…"
                    : "—"}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {report.periodStart && report.periodEnd
                  ? `${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`
                  : "—"}
              </TableCell>

              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDate(report.createdAt)}
              </TableCell>

              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Preview"
                    onClick={() => actions.preview(report)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Download PDF"
                    onClick={() => actions.pdf(report.id)}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Download Excel"
                    onClick={() => actions.excel(report.id)}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Share"
                    onClick={() => actions.share(report.id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                    onClick={() => actions.delete(report.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
