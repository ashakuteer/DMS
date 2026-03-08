"use client";

import { Link, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkPhotoUrl: string;
  setLinkPhotoUrl: (value: string) => void;
  photoUploading: boolean;
  onSubmit: () => void;
}

export default function LinkPhotoDialog({
  open,
  onOpenChange,
  linkPhotoUrl,
  setLinkPhotoUrl,
  photoUploading,
  onSubmit,
}: LinkPhotoDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setLinkPhotoUrl("");
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Existing Photo
          </DialogTitle>
          <DialogDescription>
            Paste a Supabase Storage URL or any public image URL to link it to
            this beneficiary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Photo URL *</Label>
            <Input
              placeholder="https://..."
              value={linkPhotoUrl}
              onChange={(e) => setLinkPhotoUrl(e.target.value)}
              data-testid="input-link-photo-url"
            />
          </div>

          {linkPhotoUrl && (
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={linkPhotoUrl} alt="Preview" />
                <AvatarFallback>Preview</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setLinkPhotoUrl("");
            }}
            data-testid="button-cancel-link-photo"
          >
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={!linkPhotoUrl.trim() || photoUploading}
            data-testid="button-submit-link-photo"
          >
            {photoUploading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Link Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
