"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface Props {
  filterType: string;
  setFilterType: (val: string) => void;
  filterDonorId: string;
  setFilterDonorId: (val: string) => void;
  setPage: (cb: (p: number) => number) => void;
  total: number;
}

export default function ReportsFilters({
  filterType,
  setFilterType,
  filterDonorId,
  setFilterDonorId,
  setPage,
  total,
}: Props) {
  const handleTypeChange = (val: string) => {
    setFilterType(val === "ALL" ? "" : val);
    setPage(() => 1);
  };

  const handleDonorIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDonorId(e.target.value);
    setPage(() => 1);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Select value={filterType || "ALL"} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="DONOR_SUMMARY">Donor Summary</SelectItem>
          <SelectItem value="DONATION_HISTORY">Donation History</SelectItem>
          <SelectItem value="IMPACT_REPORT">Impact Report</SelectItem>
          <SelectItem value="ANNUAL_STATEMENT">Annual Statement</SelectItem>
          <SelectItem value="CUSTOM">Custom</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by donor ID..."
          value={filterDonorId}
          onChange={handleDonorIdChange}
          className="pl-8"
        />
      </div>

      {total > 0 && (
        <span className="text-sm text-muted-foreground ml-auto">
          {total} report{total !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
