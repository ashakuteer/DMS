"use client";

import { Button } from "@/components/ui/button";
import { FileText, LayoutTemplate, RefreshCw, PlusCircle } from "lucide-react";

interface Props {
  isAdmin: boolean;
  onTemplates: () => void;
  onGenerate: () => void;
  onRefresh: () => void;
}

export default function ReportsHeader({ isAdmin, onTemplates, onGenerate, onRefresh }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">Donor Reports</h1>
          <p className="text-sm text-muted-foreground">View and manage generated donor reports</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>

        {isAdmin && (
          <Button variant="outline" size="sm" onClick={onTemplates}>
            <LayoutTemplate className="h-4 w-4 mr-1" />
            Templates
          </Button>
        )}

        {isAdmin && (
          <Button size="sm" onClick={onGenerate}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Generate Report
          </Button>
        )}
      </div>
    </div>
  );
}
