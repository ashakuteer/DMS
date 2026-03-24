"use client";

import { useState } from "react";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye, Pencil, Trash2, CheckCircle2, Clock, Circle,
  AlertCircle, XCircle, ChevronDown, Timer, CheckSquare,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { authStorage } from "@/lib/auth";

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
  PENDING:     { label: "Pending",     class: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Circle },
  IN_PROGRESS: { label: "In Progress", class: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",         icon: Clock },
  COMPLETED:   { label: "Completed",   class: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400",    icon: CheckCircle2 },
  OVERDUE:     { label: "Overdue",     class: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
  MISSED:      { label: "Missed",      class: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",               icon: XCircle },
};

const PRIORITY_CONFIG: Record<string, string> = {
  LOW:      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM:   "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  HIGH:     "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  URGENT:   "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING:     ["IN_PROGRESS", "COMPLETED", "MISSED"],
  IN_PROGRESS: ["COMPLETED", "MISSED"],
  OVERDUE:     ["IN_PROGRESS", "COMPLETED", "MISSED"],
  COMPLETED:   [],
  MISSED:      ["PENDING"],
};

const NOTES_REQUIRED_PRIORITIES = ["CRITICAL", "HIGH"];

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(mins: number | null | undefined) {
  if (!mins) return null;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

// ─── Completion dialog ────────────────────────────────────────────────────────

function CompletionDialog({
  task,
  onConfirm,
  onCancel,
}: {
  task: any;
  onConfirm: (notes: string, minutesTaken?: number) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const isRequired = NOTES_REQUIRED_PRIORITIES.includes(task?.priority);

  const handleConfirm = () => {
    const mins = timeInput ? parseInt(timeInput, 10) : undefined;
    onConfirm(notes, mins && !isNaN(mins) && mins > 0 ? mins : undefined);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Task as Completed</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{task?.title}</span>
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="completion-time" className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Time Taken (minutes)
            </Label>
            <input
              id="completion-time"
              type="number"
              min="1"
              placeholder="e.g. 30"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              data-testid="input-time-taken"
            />
          </div>

          {isRequired && (
            <p className="text-xs text-red-600 font-medium">
              Notes are required for {task?.priority} priority tasks.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="completion-notes">
              Closing Notes {isRequired ? <span className="text-red-500">*</span> : "(optional)"}
            </Label>
            <Textarea
              id="completion-notes"
              placeholder="Describe what was done, any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="input-completion-notes"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-completion">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isRequired && !notes.trim()}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-confirm-completion"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Mark Complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onView,
  canUpdate,
  canDelete,
  updateStatus,
}: {
  tasks: any[];
  onEdit: (t: any) => void;
  onDelete: (id: string) => void;
  onView: (t: any) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  updateStatus?: (id: string, status: string, notes?: string, minutesTaken?: number) => Promise<boolean>;
}) {
  const user = authStorage.getUser();
  const isAdminOrManager = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pendingCompletion, setPendingCompletion] = useState<{ task: any } | null>(null);

  const handleStatusChange = async (task: any, newStatus: string) => {
    if (!updateStatus) return;

    // Always show completion dialog when marking COMPLETED
    if (newStatus === "COMPLETED") {
      setPendingCompletion({ task });
      return;
    }

    setUpdatingId(task.id);
    await updateStatus(task.id, newStatus);
    setUpdatingId(null);
  };

  const confirmCompletion = async (notes: string, minutesTaken?: number) => {
    if (!pendingCompletion || !updateStatus) return;
    const { task } = pendingCompletion;
    setPendingCompletion(null);
    setUpdatingId(task.id);
    await updateStatus(task.id, "COMPLETED", notes, minutesTaken);
    setUpdatingId(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground border rounded-lg">
        <CheckSquare className="h-10 w-10 opacity-25" />
        <p className="text-sm">No tasks found. Adjust filters or create a new task.</p>
      </div>
    );
  }

  return (
    <>
      {pendingCompletion && (
        <CompletionDialog
          task={pendingCompletion.task}
          onConfirm={confirmCompletion}
          onCancel={() => setPendingCompletion(null)}
        />
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[30%]">Task</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tasks.map((task: any) => {
              const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = statusConf.icon;
              const timeTaken = fmtTime(task.minutesTaken);
              const transitions = STATUS_TRANSITIONS[task.status] || [];
              const isDeleting = confirmDeleteId === task.id;

              return (
                <TableRow
                  key={task.id}
                  className={task.status === "MISSED" ? "bg-red-50/30 dark:bg-red-950/10" : ""}
                  data-testid={`task-row-${task.id}`}
                >
                  {/* Title + category */}
                  <TableCell className="max-w-0">
                    <div>
                      <button
                        onClick={() => onView(task)}
                        className="font-medium text-sm text-left hover:underline line-clamp-1"
                        data-testid={`link-task-${task.id}`}
                      >
                        {task.title}
                      </button>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.category?.replace(/_/g, " ")}</p>
                    </div>
                  </TableCell>

                  {/* Assigned to */}
                  <TableCell>
                    <span className="text-sm text-muted-foreground" data-testid={`text-assigned-${task.id}`}>
                      {task.assignedTo?.name || "—"}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {canUpdate && transitions.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${statusConf.class}`}
                            disabled={updatingId === task.id}
                            data-testid={`status-badge-${task.id}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConf.label}
                            <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <p className="text-xs text-muted-foreground px-2 py-1">Change status to:</p>
                          <DropdownMenuSeparator />
                          {transitions.map((s) => {
                            const conf = STATUS_CONFIG[s];
                            const Icon = conf?.icon;
                            return (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => handleStatusChange(task, s)}
                                data-testid={`change-status-${s}-${task.id}`}
                              >
                                {Icon && <Icon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />}
                                {conf?.label || s}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${statusConf.class}`} data-testid={`status-badge-${task.id}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConf.label}
                      </span>
                    )}
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM}`}
                      data-testid={`priority-${task.id}`}
                    >
                      {task.priority}
                    </span>
                  </TableCell>

                  {/* Due date */}
                  <TableCell>
                    <span
                      className={`text-xs ${task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate) < new Date() ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                      data-testid={`due-date-${task.id}`}
                    >
                      {fmtDate(task.dueDate)}
                    </span>
                  </TableCell>

                  {/* Time taken */}
                  <TableCell>
                    {task.status === "COMPLETED" && timeTaken ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400" data-testid={`time-taken-${task.id}`}>
                        <Timer className="h-3 w-3" />
                        {timeTaken}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onView(task)}
                        data-testid={`button-view-${task.id}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {canUpdate && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onEdit(task)}
                          data-testid={`button-edit-${task.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {canDelete && (
                        isDeleting ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 text-xs px-2"
                              onClick={() => { onDelete(task.id); setConfirmDeleteId(null); }}
                              data-testid={`button-confirm-delete-${task.id}`}
                            >
                              Delete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-xs px-2"
                              onClick={() => setConfirmDeleteId(null)}
                              data-testid={`button-cancel-delete-${task.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmDeleteId(task.id)}
                            data-testid={`button-delete-${task.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
