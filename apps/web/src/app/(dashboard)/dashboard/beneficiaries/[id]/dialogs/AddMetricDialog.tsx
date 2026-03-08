"use client";

import { Loader2, Ruler } from "lucide-react";

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  newMetric: any;
  setNewMetric: any;
  loading: boolean;
  onSubmit: () => void;
}

export default function AddMetricDialog({
  open,
  onOpenChange,
  newMetric,
  setNewMetric,
  loading,
  onSubmit,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Add Measurement
          </DialogTitle>

          <DialogDescription>
            Record height and weight
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">

          <Input
            type="date"
            value={newMetric.recordedOn}
            onChange={(e) =>
              setNewMetric((p: any) => ({
                ...p,
                recordedOn: e.target.value,
              }))
            }
          />

          <Input
            type="number"
            placeholder="Height (cm)"
            value={newMetric.heightCm}
            onChange={(e) =>
              setNewMetric((p: any) => ({
                ...p,
                heightCm: e.target.value,
              }))
            }
          />

          <Input
            type="number"
            placeholder="Weight (kg)"
            value={newMetric.weightKg}
            onChange={(e) =>
              setNewMetric((p: any) => ({
                ...p,
                weightKg: e.target.value,
              }))
            }
          />

          <Textarea
            placeholder="Notes"
            value={newMetric.notes}
            onChange={(e) =>
              setNewMetric((p: any) => ({
                ...p,
                notes: e.target.value,
              }))
            }
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
