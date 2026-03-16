"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
      data-testid="trend-badge"
    >
      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(Math.round(value))}%
    </span>
  );
}
