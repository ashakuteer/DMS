"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { fmtCurrency, fmtDate } from "./helpers";
import { TopDonor } from "./types";

export function TopDonorsTable({ data }: { data: TopDonor[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-top-donors">No donation data found for this FY.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-top-donors">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">#</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Donor</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Total Amount</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground text-right">Count</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Last Donation</th>
            <th className="pb-2 font-medium text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.donorId} className="border-b last:border-0" data-testid={`row-top-donor-${i}`}>
              <td className="py-2.5 pr-4 text-muted-foreground">{i + 1}</td>
              <td className="py-2.5 pr-4">
                <div className="font-medium">{d.donorName}</div>
                <div className="text-xs text-muted-foreground">{d.donorCode}</div>
              </td>
              <td className="py-2.5 pr-4 text-right font-medium">{fmtCurrency(d.totalAmount)}</td>
              <td className="py-2.5 pr-4 text-right">{d.count}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">{fmtDate(d.lastDonationDate)}</td>
              <td className="py-2.5">
                <Link href={`/dashboard/donors/${d.donorId}`}>
                  <Button variant="ghost" size="sm" data-testid={`button-view-donor-${i}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
