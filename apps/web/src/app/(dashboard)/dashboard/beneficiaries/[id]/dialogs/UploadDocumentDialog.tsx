"use client";

import { AlertTriangle, FileText, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  beneficiaryName: string;
  newDocument: any;
  setNewDocument: any;
  documentFile: File | null;
  setDocumentFile: (file: File | null) => void;
  uploadDocumentLoading: boolean;
  formatFileSize: (bytes: number) => string;
  onSubmit: () => void;
}

export default function UploadDocumentDialog({
  open,
  onOpenChange,
  beneficiaryName,
  newDocument,
  setNewDocument,
  documentFile,
  setDocumentFile,
  uploadDocumentLoading,
  formatFileSize,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload a document for {beneficiaryName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>File *</Label>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setDocumentFile(file);
                if (file && !newDocument.title) {
                  setNewDocument((prev: any) => ({
                    ...prev,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                  }));
                }
              }}
            />
            {documentFile && (
              <p className="text-xs text-muted-foreground">
                {documentFile.name} ({formatFileSize(documentFile.size)})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="Document title"
              value={newDocument.title}
              onChange={(e) =>
                setNewDocument((prev: any) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select
              value={newDocument.docType}
              onValueChange={(v) =>
                setNewDocument((prev: any) => ({
                  ...prev,
                  docType: v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHOTO">Photo</SelectItem>
                <SelectItem value="REPORT_CARD">Report Card</SelectItem>
                <SelectItem value="MEDICAL_REPORT">Medical Report</SelectItem>
                <SelectItem value="AADHAAR">Aadhaar</SelectItem>
                <SelectItem value="GOVT_ID">Government ID</SelectItem>
                <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Brief description..."
              value={newDocument.description}
              onChange={(e) =>
                setNewDocument((prev: any) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="doc-sensitive"
              checked={newDocument.isSensitive}
              onCheckedChange={(checked) =>
                setNewDocument((prev: any) => ({
                  ...prev,
                  isSensitive: checked,
                  shareWithDonor: checked ? false : prev.shareWithDonor,
                }))
              }
            />
            <Label htmlFor="doc-sensitive" className="text-sm">
              Sensitive document
            </Label>
          </div>

          {!newDocument.isSensitive && (
            <div className="flex items-center space-x-2">
              <Switch
                id="doc-share-donor"
                checked={newDocument.shareWithDonor}
                onCheckedChange={(checked) =>
                  setNewDocument((prev: any) => ({
                    ...prev,
                    shareWithDonor: checked,
                  }))
                }
              />
              <Label htmlFor="doc-share-donor" className="text-sm">
                Share with donors
              </Label>
            </div>
          )}

          {newDocument.isSensitive && (
            <div className="flex items-center gap-2 text-sm text-[#5FA8A8] dark:text-[#A8D5D1]">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Sensitive documents can only be viewed by administrators</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setDocumentFile(null);
              setNewDocument({
                title: "",
                docType: "OTHER",
                description: "",
                isSensitive: false,
                shareWithDonor: false,
              });
            }}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={uploadDocumentLoading || !documentFile}>
            {uploadDocumentLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
