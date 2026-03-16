"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendBadge } from "./TrendBadge";

export function KPICard({
  title, value, subtitle, trend, icon: Icon, testId,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number | null;
  icon: React.ElementType;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-bold" data-testid={`${testId}-value`}>{value}</span>
          {trend !== undefined && <TrendBadge value={trend} />}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
