"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
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

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "MISSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TASK_CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "DONOR_FOLLOWUP", label: "Donor Follow-up" },
  { value: "BENEFICIARY_UPDATE", label: "Beneficiary Update" },
  { value: "DATA_ENTRY", label: "Data Entry" },
  { value: "REPORTING", label: "Reporting" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "EVENT", label: "Event" },
  { value: "OTHER", label: "Other" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600",
  IN_PROGRESS: "text-blue-600",
  COMPLETED: "text-green-600",
  OVERDUE: "text-orange-600",
  MISSED: "text-red-600",
};

export default function EditTaskDialog({
  open,
  setOpen,
  task,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  task: any;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const user = authStorage.getUser();
  const isAdminOrManager = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [form, setForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string; role: string }[]>([]);

  useEffect(() => {
    if (!task) return;
    setForm({
      title: task.title || "",
      description: task.description || task.notes || "",
      instructions: task.instructions || "",
      estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
      status: task.status || "PENDING",
      priority: task.priority || "MEDIUM",
      category: task.category || "GENERAL",
      assignedToId: task.assignedTo?.id || task.assignedToId || "",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
  }, [task]);

  useEffect(() => {
    if (!open || !isAdminOrManager) return;
    fetchWithAuth("/api/staff-tasks/staff-list")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setStaffList(d); })
      .catch(() => {});
  }, [open, isAdminOrManager]);

  const set = (key: string) => (val: string) => setForm((p: any) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title?.trim()) {
      toast({ title: "Task title is required", variant: "destructive" });
      return;
    }
    if (!task?.id) return;

    setSubmitting(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description || undefined,
        instructions: form.instructions || undefined,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        status: form.status,
        priority: form.priority,
        category: form.category,
        dueDate: form.dueDate || undefined,
      };
      if (isAdminOrManager) {
        payload.assignedToId = form.assignedToId || null;
      }

      const res = await fetchWithAuth(`/api/staff-tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Task updated successfully" });
        setOpen(false);
        onSuccess?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.message || "Failed to update task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Unexpected error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update task details below.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">

          <div className="space-y-1.5">
            <Label htmlFor="et-title">Task Title <span className="text-destructive">*</span></Label>
            <Input
              id="et-title"
              value={form.title || ""}
              onChange={(e) => set("title")(e.target.value)}
              data-testid="input-edit-title"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="et-desc">Description</Label>
            <Textarea
              id="et-desc"
              value={form.description || ""}
              onChange={(e) => set("description")(e.target.value)}
              className="h-20 resize-none"
              data-testid="input-edit-description"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="et-instructions">Instructions <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="et-instructions"
              value={form.instructions || ""}
              onChange={(e) => set("instructions")(e.target.value)}
              className="h-20 resize-none"
              placeholder="Step-by-step instructions..."
              data-testid="input-edit-instructions"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className={STATUS_COLORS[s]}>{s.replace(/_/g, " ")}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger data-testid="select-edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={set("category")}>
                <SelectTrigger data-testid="select-edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="et-due">Due Date</Label>
              <Input
                id="et-due"
                type="date"
                value={form.dueDate || ""}
                onChange={(e) => set("dueDate")(e.target.value)}
                data-testid="input-edit-due"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="et-est-time">Estimated Time <span className="text-muted-foreground font-normal">(minutes, optional)</span></Label>
            <Input
              id="et-est-time"
              type="number"
              min="1"
              placeholder="e.g. 30"
              value={form.estimatedMinutes || ""}
              onChange={(e) => set("estimatedMinutes")(e.target.value)}
              data-testid="input-edit-estimated-minutes"
            />
          </div>

          {isAdminOrManager && staffList.length > 0 && (
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Select value={form.assignedToId || ""} onValueChange={set("assignedToId")}>
                <SelectTrigger data-testid="select-edit-assigned">
                  <SelectValue placeholder="Select staff member" />
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

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} data-testid="button-submit-edit">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
