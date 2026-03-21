"use client";

import { useState, useEffect } from "react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { fetchWithAuth, authStorage } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const CATEGORIES = [
  "GENERAL", "DONOR_FOLLOWUP", "BENEFICIARY_UPDATE",
  "DATA_ENTRY", "REPORTING", "COMMUNICATION", "EVENT", "OTHER",
];
const RECURRENCE_TYPES = [
  { value: "NONE", label: "No Recurrence" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half-Yearly" },
  { value: "ANNUAL", label: "Annual" },
];

const EMPTY = {
  title: "",
  description: "",
  assignedToId: "",
  priority: "MEDIUM",
  category: "GENERAL",
  dueDate: "",
  recurrenceType: "NONE",
  notes: "",
};

export default function CreateTaskDialog({
  open,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const isAdminOrManager = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [form, setForm] = useState({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Load staff list when dialog opens
  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY });
    if (!isAdminOrManager) return;
    setLoadingStaff(true);
    fetchWithAuth("/api/staff-tasks/staff-list")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setStaffList(d); })
      .catch(() => {})
      .finally(() => setLoadingStaff(false));
  }, [open]);

  const set = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "Task title is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        category: form.category,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        isRecurring: form.recurrenceType !== "NONE",
        recurrenceType: form.recurrenceType,
      };
      if (isAdminOrManager && form.assignedToId) {
        payload.assignedToId = form.assignedToId;
      }

      const res = await fetchWithAuth("/api/staff-tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Task created successfully" });
        setOpen(false);
        onSuccess?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.message || "Failed to create task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Unexpected error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to assign a new task to a staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-title">Task Title <span className="text-destructive">*</span></Label>
            <Input
              id="ct-title"
              value={form.title}
              onChange={(e) => set("title")(e.target.value)}
              placeholder="e.g. Follow up with Ramesh on pledge"
              data-testid="input-task-title"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="ct-desc"
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Any instructions or context..."
              className="h-20 resize-none"
              data-testid="input-task-description"
            />
          </div>

          {/* Assign to staff — only for admin/founder */}
          {isAdminOrManager && (
            <div className="space-y-1.5">
              <Label>Assign To <span className="text-muted-foreground font-normal">(defaults to you)</span></Label>
              <Select value={form.assignedToId} onValueChange={set("assignedToId")}>
                <SelectTrigger data-testid="select-assigned-to">
                  <SelectValue placeholder={loadingStaff ? "Loading staff..." : "Select staff member"} />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority + Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date + Recurrence row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct-due">Due Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="ct-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate")(e.target.value)}
                data-testid="input-due-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Recurrence</Label>
              <Select value={form.recurrenceType} onValueChange={set("recurrenceType")}>
                <SelectTrigger data-testid="select-recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="ct-notes">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="ct-notes"
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Any additional notes..."
              className="h-16 resize-none"
              data-testid="input-task-notes"
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting} data-testid="button-cancel-create">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} data-testid="button-submit-create">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
