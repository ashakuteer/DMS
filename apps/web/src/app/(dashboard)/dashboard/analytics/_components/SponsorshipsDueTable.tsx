"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { fmtCurrency, homeLabels } from "./helpers";
import { WhatsAppCopyButton } from "./WhatsAppCopyButton";
import { SponsorshipDue } from "./types";

export function SponsorshipsDueTable({ data }: { data: SponsorshipDue[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-sponsorships">No sponsorships due this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-sponsorships-due">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Donor</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Beneficiary</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Home</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Amount</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Due Day</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
            <th className="pb-2 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr
              key={s.id}
              className={`border-b last:border-0 ${s.isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""}`}
              data-testid={`row-sponsorship-${i}`}
            >
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${s.donorId}`} className="hover:underline">
                  <div className="font-medium">{s.donorName}</div>
                  <div className="text-xs text-muted-foreground">{s.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/beneficiaries/${s.beneficiaryId}`} className="hover:underline">
                  <div>{s.beneficiaryName}</div>
                  <div className="text-xs text-muted-foreground">{s.beneficiaryCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{homeLabels[s.homeType] || s.homeType}</td>
              <td className="py-2.5 pr-4 text-right font-medium">{fmtCurrency(s.amount)}</td>
              <td className="py-2.5 pr-4 text-right">{s.dueDay}</td>
              <td className="py-2.5 pr-4">
                <Badge
                  variant={s.isOverdue ? "destructive" : "secondary"}
                  data-testid={`badge-sponsorship-${i}`}
                >
                  {s.status === "OVERDUE" ? "Overdue" : "Due Soon"}
                </Badge>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {s.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={`Dear ${s.donorName}, this is a gentle reminder that your monthly sponsorship of ${fmtCurrency(s.amount)} for ${s.beneficiaryName} is due on the ${s.dueDay}${s.dueDay === 1 ? "st" : s.dueDay === 2 ? "nd" : s.dueDay === 3 ? "rd" : "th"} of this month. Thank you for your continued support!`}
                      testId={`button-wa-sponsorship-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${s.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-sponsorship-${i}`}>
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
