"use client";

import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQUENCY_OPTIONS = [
  { value: "DAILY",           label: "Daily" },
  { value: "WEEKLY",          label: "Weekly (select days)" },
  { value: "MONTHLY",         label: "Monthly (select date)" },
  { value: "CUSTOM_INTERVAL", label: "Custom Interval (every N days)" },
];

const PRIORITY_OPTIONS = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH",     label: "High" },
  { value: "MEDIUM",   label: "Medium" },
  { value: "LOW",      label: "Low" },
];

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export default function CreateRecurringTaskDialog({
  open,
  setOpen,
  staffList,
  onSuccess,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  staffList: StaffMember[];
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [frequency, setFrequency] = useState("DAILY");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [monthlyDate, setMonthlyDate] = useState("1");
  const [intervalDays, setIntervalDays] = useState("7");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setAssignedToId("");
      setPriority("MEDIUM");
      setEstimatedTime("");
      setFrequency("DAILY");
      setSelectedDays([]);
      setMonthlyDate("1");
      setIntervalDays("7");
    }
  }, [open]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (frequency === "WEEKLY" && selectedDays.length === 0) {
      toast({ title: "Select at least one day", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const recurrenceType =
        frequency === "CUSTOM_INTERVAL" ? "DAILY" : frequency;

      const body: Record<string, unknown> = {
        title: title.trim(),
        assignedToId: assignedToId || undefined,
        priority,
        estimatedMinutes: estimatedTime ? Number(estimatedTime) : undefined,
        recurrenceType,
        category: "GENERAL",
        isActive: true,
      };

      if (frequency === "WEEKLY") body.daysOfWeek = selectedDays;
      if (frequency === "MONTHLY") body.dayOfMonth = Number(monthlyDate);
      if (frequency === "CUSTOM_INTERVAL") body.intervalDays = Number(intervalDays);

      const res = await fetchWithAuth("/api/task-templates", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast({ title: "Recurring task created" });
        setOpen(false);
        onSuccess?.();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.message || "Failed to create", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Recurring Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="rt-title">Title <span className="text-red-500">*</span></Label>
            <Input
              id="rt-title"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-recurring-title"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Assign To</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger data-testid="select-recurring-assignee">
                <SelectValue placeholder="All active staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All active staff</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="select-recurring-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rt-time">Estimated Time (minutes)</Label>
              <Input
                id="rt-time"
                type="number"
                placeholder="e.g. 30"
                min="1"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                data-testid="input-recurring-estimated-time"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger data-testid="select-recurring-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {frequency === "WEEKLY" && (
            <div className="space-y-1.5">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedDays.includes(day)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/70"
                    }`}
                    data-testid={`day-toggle-${day}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {frequency === "MONTHLY" && (
            <div className="space-y-1.5">
              <Label htmlFor="rt-day-of-month">Day of Month (1–31)</Label>
              <Input
                id="rt-day-of-month"
                type="number"
                min="1"
                max="31"
                value={monthlyDate}
                onChange={(e) => setMonthlyDate(e.target.value)}
                data-testid="input-recurring-day-of-month"
              />
            </div>
          )}

          {frequency === "CUSTOM_INTERVAL" && (
            <div className="space-y-1.5">
              <Label htmlFor="rt-interval">Every how many days?</Label>
              <Input
                id="rt-interval"
                type="number"
                min="1"
                placeholder="e.g. 28"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                data-testid="input-recurring-interval"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} data-testid="button-save-recurring-task">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            Save Recurring Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
