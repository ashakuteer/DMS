"use client";

import { format } from "date-fns";
import { Eye, FileText, Lock, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { BeneficiaryDocument } from "../types";
import { formatFileSize } from "../utils";

interface BeneficiaryDocumentsTabProps {
  documents: BeneficiaryDocument[];
  documentsLoading: boolean;
  onOpenUploadDocument: () => void;
  onViewDocument: (docId: string, storagePath: string) => void;
}

export default function BeneficiaryDocumentsTab({
  documents,
  documentsLoading,
  onOpenUploadDocument,
  onViewDocument,
}: BeneficiaryDocumentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </h3>

        <Button onClick={onOpenUploadDocument} data-testid="button-upload-document">
          <FileText className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {documentsLoading ? (
        <div className="flex justify-center py-8 text-muted-foreground">
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <FileText className="h-8 w-8 mb-2 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No documents uploaded yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} data-testid={`card-document-${doc.id}`}>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {doc.isSensitive ? (
                      <Lock className="h-5 w-5 text-destructive flex-shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}

                    <div>
                      <p className="font-medium">{doc.title}</p>

                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.docType.replace(/_/g, " ")}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.sizeBytes)}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </span>

                        {doc.isSensitive && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Sensitive
                          </Badge>
                        )}
                      </div>

                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDocument(doc.id, doc.storagePath)}
                    data-testid={`button-view-document-${doc.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
