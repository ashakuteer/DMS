"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { fmtDate } from "./helpers";
import { WhatsAppCopyButton } from "./WhatsAppCopyButton";
import { AtRiskDonor } from "./types";

export function AtRiskTable({ data }: { data: AtRiskDonor[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-risk">No at-risk donors detected.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-at-risk">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Donor</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Last Donation</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Expected Next</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Risk</th>
            <th className="pb-2 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.donorId} className="border-b last:border-0" data-testid={`row-risk-donor-${i}`}>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${d.donorId}`} className="hover:underline">
                  <div className="font-medium">{d.donorName}</div>
                  <div className="text-xs text-muted-foreground">{d.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(d.lastDonationDate)}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(d.expectedNextDate)}</td>
              <td className="py-2.5 pr-4">
                <Badge
                  variant={d.riskLevel === "High" ? "destructive" : d.riskLevel === "Medium" ? "secondary" : "outline"}
                  data-testid={`badge-risk-${i}`}
                >
                  {d.riskLevel}
                </Badge>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {d.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={`Dear ${d.donorName}, we hope you're doing well! We miss your generous support at Asha Kuteer Foundation. Your contributions make a real difference in the lives of our beneficiaries. Would you like to continue supporting our cause?`}
                      testId={`button-wa-risk-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${d.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-risk-${i}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
