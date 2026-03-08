"use client";

import { GraduationCap, Loader2 } from "lucide-react";

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
  newProgressCard: any;
  setNewProgressCard: any;
  progressCardFile: File | null;
  setProgressCardFile: (file: File | null) => void;
  addProgressCardLoading: boolean;
  onSubmit: () => void;
}

export default function AddProgressCardDialog({
  open,
  onOpenChange,
  beneficiaryName,
  newProgressCard,
  setNewProgressCard,
  progressCardFile,
  setProgressCardFile,
  addProgressCardLoading,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Add Progress Card
          </DialogTitle>
          <DialogDescription>
            Record academic progress for {beneficiaryName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Input
                placeholder="e.g. 2025-2026"
                value={newProgressCard.academicYear}
                onChange={(e) =>
                  setNewProgressCard((prev: any) => ({
                    ...prev,
                    academicYear: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Term *</Label>
              <Select
                value={newProgressCard.term}
                onValueChange={(v) =>
                  setNewProgressCard((prev: any) => ({
                    ...prev,
                    term: v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TERM_1">Term 1</SelectItem>
                  <SelectItem value="TERM_2">Term 2</SelectItem>
                  <SelectItem value="TERM_3">Term 3</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class / Grade *</Label>
              <Input
                placeholder="e.g. 8th Standard"
                value={newProgressCard.classGrade}
                onChange={(e) =>
                  setNewProgressCard((prev: any) => ({
                    ...prev,
                    classGrade: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>School</Label>
              <Input
                placeholder="School name"
                value={newProgressCard.school}
                onChange={(e) =>
                  setNewProgressCard((prev: any) => ({
                    ...prev,
                    school: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Overall Percentage</Label>
            <Input
              type="number"
              placeholder="e.g. 85"
              value={newProgressCard.overallPercentage}
              onChange={(e) =>
                setNewProgressCard((prev: any) => ({
                  ...prev,
                  overallPercentage: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              placeholder="Teacher remarks or notes..."
              value={newProgressCard.remarks}
              onChange={(e) =>
                setNewProgressCard((prev: any) => ({
                  ...prev,
                  remarks: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Report Card File (optional)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setProgressCardFile(e.target.files?.[0] || null)}
            />
            {progressCardFile && (
              <p className="text-xs text-muted-foreground">
                {progressCardFile.name} ({(progressCardFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setProgressCardFile(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={addProgressCardLoading}>
            {addProgressCardLoading && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save Progress Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
