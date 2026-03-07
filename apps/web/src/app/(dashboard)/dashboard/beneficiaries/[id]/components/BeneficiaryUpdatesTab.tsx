"use client";

import { format } from "date-fns";
import { FileText, Lock, MessageSquare, Paperclip, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Beneficiary } from "../types";

interface BeneficiaryUpdatesTabProps {
  beneficiary: Beneficiary;
  onOpenAddUpdate: () => void;
  onOpenSendToSponsors: (updateId: string) => void;
}

export default function BeneficiaryUpdatesTab({
  beneficiary,
  onOpenAddUpdate,
  onOpenSendToSponsors,
}: BeneficiaryUpdatesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Updates ({beneficiary.updates.length})
        </h3>

        <Button onClick={onOpenAddUpdate} data-testid="button-add-update">
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Update
        </Button>
      </div>

      {beneficiary.updates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No updates yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {beneficiary.updates.map((update: any) => (
            <Card key={update.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{update.title}</CardTitle>

                      {update.isPrivate && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {update.updateType && update.updateType !== "GENERAL" && (
                        <Badge variant="outline" className="text-xs">
                          {update.updateType.replace(/_/g, " ")}
                        </Badge>
                      )}

                      <CardDescription>
                        By {update.createdBy?.name || "Unknown"} on{" "}
                        {format(new Date(update.createdAt), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                  </div>

                  {beneficiary.sponsorships.length > 0 && !update.isPrivate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenSendToSponsors(update.id)}
                      data-testid={`button-send-update-${update.id}`}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send to Sponsors
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{update.content}</p>

                {update.attachments && update.attachments.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      Attachments ({update.attachments.length})
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {update.attachments.map((att: any) => (
                        <Button
                          key={att.id}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            att.document?.storagePath &&
                            window.open(att.document.storagePath, "_blank")
                          }
                          data-testid={`attachment-${att.id}`}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          {att.document?.title || "Document"}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
