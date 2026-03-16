"use client";

import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, X, ImagePlus } from "lucide-react";
import { HOME_TYPES } from "./helpers";
import { BeneficiaryResult } from "./types";

interface ComposerDialogProps {
  open: boolean;
  editingId: string | null;
  composerTitle: string;
  setComposerTitle: (v: string) => void;
  composerContent: string;
  setComposerContent: (v: string) => void;
  composerPhotos: string[];
  setComposerPhotos: Dispatch<SetStateAction<string[]>>;
  composerPhotoUrl: string;
  setComposerPhotoUrl: (v: string) => void;
  addPhoto: () => void;
  selectedHomeTypes: string[];
  toggleHomeType: (v: string) => void;
  beneficiarySearch: string;
  setBeneficiarySearch: (v: string) => void;
  beneficiarySearchLoading: boolean;
  beneficiaryResults: BeneficiaryResult[];
  selectedBeneficiaries: BeneficiaryResult[];
  setSelectedBeneficiaries: Dispatch<SetStateAction<BeneficiaryResult[]>>;
  addBeneficiary: (b: BeneficiaryResult) => void;
  actionLoading: string | null;
  handleSave: (isDraft: boolean) => void;
  resetComposer: () => void;
}

export function ComposerDialog({
  open,
  editingId,
  composerTitle,
  setComposerTitle,
  composerContent,
  setComposerContent,
  composerPhotos,
  setComposerPhotos,
  composerPhotoUrl,
  setComposerPhotoUrl,
  addPhoto,
  selectedHomeTypes,
  toggleHomeType,
  beneficiarySearch,
  setBeneficiarySearch,
  beneficiarySearchLoading,
  beneficiaryResults,
  selectedBeneficiaries,
  setSelectedBeneficiaries,
  addBeneficiary,
  actionLoading,
  handleSave,
  resetComposer,
}: ComposerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetComposer(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Update" : "Create New Update"}</DialogTitle>
          <DialogDescription>Compose an update to share with your donors</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={composerTitle}
              onChange={(e) => setComposerTitle(e.target.value)}
              placeholder="Update title..."
              data-testid="input-title"
            />
          </div>

          <div>
            <Label>Content</Label>
            <Textarea
              value={composerContent}
              onChange={(e) => setComposerContent(e.target.value)}
              placeholder="Write your update content here..."
              rows={6}
              data-testid="input-content"
            />
          </div>

          <div>
            <Label>Photos</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={composerPhotoUrl}
                onChange={(e) => setComposerPhotoUrl(e.target.value)}
                placeholder="Paste photo URL..."
                data-testid="input-photo-url"
              />
              <Button variant="outline" onClick={addPhoto} data-testid="button-add-photo">
                <ImagePlus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {composerPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {composerPhotos.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Photo ${i + 1}`} className="h-16 w-16 object-cover rounded-md border" />
                    <button
                      onClick={() => setComposerPhotos((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center text-xs"
                      data-testid={`button-remove-photo-${i}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Related Homes</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {HOME_TYPES.map((ht) => (
                <label key={ht.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedHomeTypes.includes(ht.value)}
                    onCheckedChange={() => toggleHomeType(ht.value)}
                    data-testid={`checkbox-home-${ht.value}`}
                  />
                  <span className="text-sm">{ht.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Related Beneficiaries</Label>
            <div className="relative mt-1">
              <Input
                value={beneficiarySearch}
                onChange={(e) => setBeneficiarySearch(e.target.value)}
                placeholder="Search beneficiaries..."
                data-testid="input-beneficiary-search"
              />
              {beneficiarySearchLoading && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {beneficiaryResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {beneficiaryResults.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => addBeneficiary(b)}
                      className="w-full text-left px-3 py-2 text-sm hover-elevate"
                      data-testid={`button-add-beneficiary-${b.id}`}
                    >
                      {b.fullName} ({b.code}) - {b.homeType?.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedBeneficiaries.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedBeneficiaries.map((b) => (
                  <Badge key={b.id} variant="secondary" className="gap-1">
                    {b.fullName}
                    <button onClick={() => setSelectedBeneficiaries((prev) => prev.filter((sb) => sb.id !== b.id))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={resetComposer} data-testid="button-cancel-composer">
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(true)}
            disabled={actionLoading === "save"}
            data-testid="button-save-draft"
          >
            {actionLoading === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={actionLoading === "save"}
            data-testid="button-publish"
          >
            {actionLoading === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
