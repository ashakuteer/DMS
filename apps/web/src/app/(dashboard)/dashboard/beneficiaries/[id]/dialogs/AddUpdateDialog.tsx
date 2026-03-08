"use client";

import { Loader2, MessageSquare } from "lucide-react";

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  beneficiaryName: string;
  newUpdate: any;
  setNewUpdate: any;
  addUpdateLoading: boolean;
  onSubmit: () => void;
}

export default function AddUpdateDialog({
  open,
  onOpenChange,
  beneficiaryName,
  newUpdate,
  setNewUpdate,
  addUpdateLoading,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add Update
          </DialogTitle>

          <DialogDescription>
            Share an update about {beneficiaryName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

          <div className="space-y-2">
            <Label>Title</Label>

            <Input
              value={newUpdate.title}
              onChange={(e) =>
                setNewUpdate((prev: any) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>

            <Textarea
              rows={4}
              value={newUpdate.content}
              onChange={(e) =>
                setNewUpdate((prev: any) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={newUpdate.isPrivate}
              onCheckedChange={(checked) =>
                setNewUpdate((prev: any) => ({
                  ...prev,
                  isPrivate: checked,
                }))
              }
            />

            <Label>Private update (staff only)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={onSubmit} disabled={addUpdateLoading}>
            {addUpdateLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Add Update
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
