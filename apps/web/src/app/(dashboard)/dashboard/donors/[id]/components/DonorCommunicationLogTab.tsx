"use client";

import { History, Mail, Trash2 } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CommunicationLog } from "../types";
import { formatDate } from "../utils";

interface DonorCommunicationLogTabProps {
  canDeleteLogs: boolean;
  logsLoading: boolean;
  communicationLogs: CommunicationLog[];
  onDeleteLog: (logId: string) => void;
}

export default function DonorCommunicationLogTab({
  canDeleteLogs,
  logsLoading,
  communicationLogs,
  onDeleteLog,
}: DonorCommunicationLogTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Communication Log</CardTitle>
        </div>
        <CardDescription>
          History of all email and WhatsApp communications with this donor
        </CardDescription>
      </CardHeader>

      <CardContent>
        {logsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : communicationLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No communication history yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-comm-log">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">Date/Time</th>
                  <th className="text-left py-2 px-2 font-medium">Channel</th>
                  <th className="text-left py-2 px-2 font-medium">Type</th>
                  <th className="text-left py-2 px-2 font-medium">Status</th>
                  <th className="text-left py-2 px-2 font-medium">Sent By</th>
                  <th className="text-left py-2 px-2 font-medium">Details</th>
                  {canDeleteLogs && (
                    <th className="text-left py-2 px-2 font-medium">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {communicationLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b hover:bg-muted/50"
                    data-testid={`log-row-${log.id}`}
                  >
                    <td className="py-2 px-2">
                      <div className="flex flex-col">
                        <span>{formatDate(log.createdAt)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>

                    <td className="py-2 px-2">
                      <Badge
                        variant={log.channel === "EMAIL" ? "secondary" : "default"}
                        className={log.channel === "WHATSAPP" ? "bg-green-600" : ""}
                      >
                        {log.channel === "EMAIL" ? (
                          <Mail className="h-3 w-3 mr-1" />
                        ) : (
                          <SiWhatsapp className="h-3 w-3 mr-1" />
                        )}
                        {log.channel}
                      </Badge>
                    </td>

                    <td className="py-2 px-2">
                      <span className="capitalize">
                        {log.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>

                    <td className="py-2 px-2">
                      <Badge
                        variant={
                          log.status === "SENT"
                            ? "default"
                            : log.status === "FAILED"
                              ? "destructive"
                              : log.status === "TRIGGERED"
                                ? "outline"
                                : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>

                    <td className="py-2 px-2">
                      {log.sentBy?.name || "System"}
                      {log.sentBy?.role && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({log.sentBy.role})
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-2">
                      <div className="max-w-[200px]">
                        {log.subject && (
                          <div className="text-xs truncate" title={log.subject}>
                            <span className="font-medium">Subject:</span> {log.subject}
                          </div>
                        )}
                        {log.recipient && (
                          <div
                            className="text-xs text-muted-foreground truncate"
                            title={log.recipient}
                          >
                            To: {log.recipient}
                          </div>
                        )}
                        {log.errorMessage && (
                          <div
                            className="text-xs text-destructive truncate"
                            title={log.errorMessage}
                          >
                            Error: {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </td>

                    {canDeleteLogs && (
                      <td className="py-2 px-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteLog(log.id)}
                          data-testid={`button-delete-log-${log.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
