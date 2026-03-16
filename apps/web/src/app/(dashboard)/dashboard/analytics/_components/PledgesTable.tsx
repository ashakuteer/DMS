"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Mail } from "lucide-react";
import { fmtCurrency, fmtDate } from "./helpers";
import { WhatsAppCopyButton } from "./WhatsAppCopyButton";
import { PledgeItem } from "./types";

export function PledgesTable({ data }: { data: PledgeItem[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-pledges">No pending pledges.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-pledges">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Donor</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Type</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Amount/Qty</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Expected Date</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
            <th className="pb-2 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.id ?? `${p.donorId}-${i}`} className="border-b last:border-0" data-testid={`row-pledge-${i}`}>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${p.donorId}`} className="hover:underline">
                  <div className="font-medium">{p.donorName}</div>
                  <div className="text-xs text-muted-foreground">{p.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4">{p.pledgeType}</td>
              <td className="py-2.5 pr-4 text-right font-medium">
                {p.amount ? fmtCurrency(p.amount) : p.quantity || "-"}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(p.expectedDate)}</td>
              <td className="py-2.5 pr-4">
                <Badge variant={p.status === "FULFILLED" ? "secondary" : "outline"} data-testid={`badge-pledge-${i}`}>
                  {p.status}
                </Badge>
              </td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {p.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={`Dear ${p.donorName}, we wanted to follow up on your pledge${p.amount ? ` of ${fmtCurrency(p.amount)}` : ""}. If you're ready to fulfill it, we'd be grateful. Thank you for your generosity to Asha Kuteer Foundation!`}
                      testId={`button-wa-pledge-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${p.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-pledge-${i}`}>
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
