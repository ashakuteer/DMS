"use client";

import { Loader2, Stethoscope } from "lucide-react";

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
  newHealthEvent: any;
  setNewHealthEvent: any;
  healthEventFile: File | null;
  setHealthEventFile: (file: File | null) => void;
  addHealthEventLoading: boolean;
  onSubmit: () => void;
}

export default function AddHealthEventDialog({
  open,
  onOpenChange,
  beneficiaryName,
  newHealthEvent,
  setNewHealthEvent,
  healthEventFile,
  setHealthEventFile,
  addHealthEventLoading,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Add Health Event
          </DialogTitle>
          <DialogDescription>
            Record a health event for {beneficiaryName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={newHealthEvent.eventDate}
              onChange={(e) =>
                setNewHealthEvent((prev: any) => ({
                  ...prev,
                  eventDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="e.g. Fever and Cold"
              value={newHealthEvent.title}
              onChange={(e) =>
                setNewHealthEvent((prev: any) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              rows={3}
              placeholder="Describe the health event..."
              value={newHealthEvent.description}
              onChange={(e) =>
                setNewHealthEvent((prev: any) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <Select
              value={newHealthEvent.severity}
              onValueChange={(v) =>
                setNewHealthEvent((prev: any) => ({
                  ...prev,
                  severity: v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="requires-donor-update"
              checked={newHealthEvent.requiresDonorUpdate}
              onCheckedChange={(checked) =>
                setNewHealthEvent((prev: any) => ({
                  ...prev,
                  requiresDonorUpdate: checked,
                }))
              }
            />
            <Label htmlFor="requires-donor-update" className="text-sm">
              Requires donor update
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="share-with-donor"
              checked={newHealthEvent.shareWithDonor}
              onCheckedChange={(checked) =>
                setNewHealthEvent((prev: any) => ({
                  ...prev,
                  shareWithDonor: checked,
                }))
              }
            />
            <Label htmlFor="share-with-donor" className="text-sm">
              Share with donors
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Attach Document (optional)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setHealthEventFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Upload a prescription or medical report
            </p>
            {healthEventFile && (
              <p className="text-xs text-muted-foreground">{healthEventFile.name}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={addHealthEventLoading}>
            {addHealthEventLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Health Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
