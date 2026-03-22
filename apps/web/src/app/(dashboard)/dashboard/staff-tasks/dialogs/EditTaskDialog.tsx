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
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const TASK_TYPES = [
  { value: "GENERAL", label: "General" },
  { value: "INTERNAL", label: "Internal" },
  { value: "MANUAL", label: "Manual" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "PLEDGE", label: "Pledge" },
  { value: "REMINDER", label: "Reminder" },
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
      status: task.status || "PENDING",
      priority: task.priority || "MEDIUM",
      type: task.type || task.category || "GENERAL",
      assignedTo: task.assignedTo || task.assignedToId || "",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
  }, [task]);

  useEffect(() => {
    if (!open || !isAdminOrManager) return;
    fetchWithAuth("/api/tasks/staff")
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
        status: form.status,
        priority: form.priority,
        type: form.type,
        dueDate: form.dueDate || undefined,
      };
      if (isAdminOrManager) {
        payload.assignedTo = form.assignedTo || null;
      }

      const res = await fetchWithAuth(`/api/tasks/${task.id}`, {
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
              <Label>Type</Label>
              <Select value={form.type} onValueChange={set("type")}>
                <SelectTrigger data-testid="select-edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
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

          {isAdminOrManager && staffList.length > 0 && (
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Select value={form.assignedTo || ""} onValueChange={set("assignedTo")}>
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
