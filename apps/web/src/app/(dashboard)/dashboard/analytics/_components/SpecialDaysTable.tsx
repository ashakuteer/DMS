"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { fmtDate, occasionLabels } from "./helpers";
import { WhatsAppCopyButton } from "./WhatsAppCopyButton";
import { SpecialDay } from "./types";

export function SpecialDaysTable({ data }: { data: SpecialDay[] }) {
  if (!data.length) return <p className="text-sm text-muted-foreground py-4" data-testid="text-no-special-days">No special days in the next 30 days.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-special-days">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Donor</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Type</th>
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Assigned Staff</th>
            <th className="pb-2 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={s.id} className="border-b last:border-0" data-testid={`row-special-day-${i}`}>
              <td className="py-2.5 pr-4">
                <Link href={`/dashboard/donors/${s.donorId}`} className="hover:underline">
                  <div className="font-medium">{s.donorName}</div>
                  <div className="text-xs text-muted-foreground">{s.donorCode}</div>
                </Link>
              </td>
              <td className="py-2.5 pr-4">{fmtDate(s.date)}</td>
              <td className="py-2.5 pr-4">
                <Badge variant="outline" data-testid={`badge-special-${i}`}>
                  {occasionLabels[s.type] || s.type}
                  {s.relatedPersonName ? ` (${s.relatedPersonName})` : ""}
                </Badge>
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">{s.assignedStaff || "-"}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-1">
                  {s.hasWhatsApp && (
                    <WhatsAppCopyButton
                      message={
                        s.type === "DOB_SELF"
                          ? `Dear ${s.donorName}, wishing you a very Happy Birthday! May this special day bring you joy and blessings. Thank you for your wonderful support to Asha Kuteer Foundation.`
                          : s.type === "ANNIVERSARY"
                          ? `Dear ${s.donorName}, wishing you a very Happy Anniversary! May your bond grow stronger with each year. Thank you for your continued generosity to Asha Kuteer Foundation.`
                          : s.type === "DEATH_ANNIVERSARY"
                          ? `Dear ${s.donorName}, we remember ${s.relatedPersonName || "your loved one"} today with great respect. Our thoughts are with you and your family.`
                          : `Dear ${s.donorName}, we hope you have a wonderful day! Best wishes from Asha Kuteer Foundation.`
                      }
                      testId={`button-wa-special-${i}`}
                    />
                  )}
                  <Link href={`/dashboard/donors/${s.donorId}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-special-${i}`}>
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
