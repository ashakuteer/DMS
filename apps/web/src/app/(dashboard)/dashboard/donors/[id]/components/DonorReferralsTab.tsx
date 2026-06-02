"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Users, UserCheck, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDonorReferrals } from "../hooks/useDonorReferrals";

interface DonorReferralsTabProps {
  donorId: string;
  enabled: boolean;
}

function formatAmount(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DonorReferralsTab({ donorId, enabled }: DonorReferralsTabProps) {
  const router = useRouter();
  const { data, loading, error } = useDonorReferrals(donorId, enabled);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const { referredBy, referredDonors } = data;

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5" />
            Referred By
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referredBy ? (
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div>
                <p className="font-medium">
                  {referredBy.firstName} {referredBy.lastName ?? ""}
                </p>
                <p className="text-sm text-muted-foreground">{referredBy.donorCode}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/donors/${referredBy.id}`)}
              >
                View Profile
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This donor was not referred by anyone on record.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Donors Referred
            {referredDonors.length > 0 && (
              <Badge variant="secondary">{referredDonors.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referredDonors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This donor has not referred anyone yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-muted/30 rounded-md">
                <div className="text-center">
                  <p className="text-2xl font-bold">{referredDonors.length}</p>
                  <p className="text-xs text-muted-foreground">Donors Referred</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatAmount(
                      referredDonors.reduce((s, d) => s + d.totalDonations, 0),
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Generated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {referredDonors.reduce((s, d) => s + d.donationCount, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Donations</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Total Donations</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referredDonors.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {d.firstName} {d.lastName ?? ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{d.donorCode}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(d.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">
                          {formatAmount(d.totalDonations)}
                        </span>
                        {d.donationCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({d.donationCount})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/donors/${d.id}`)}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
