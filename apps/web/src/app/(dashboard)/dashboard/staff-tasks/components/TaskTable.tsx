"use client";

import { useState } from "react";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye, Pencil, Trash2, CheckCircle2, Clock, Circle,
  AlertCircle, XCircle, ChevronDown, Timer, CheckSquare,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  LOW:    "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH:   "bg-orange-100 text-orange-700 border-orange-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING:     ["IN_PROGRESS", "COMPLETED", "MISSED"],
  IN_PROGRESS: ["COMPLETED", "MISSED"],
  OVERDUE:     ["IN_PROGRESS", "COMPLETED", "MISSED"],
  COMPLETED:   [],
  MISSED:      ["PENDING"],
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(mins: number | null | undefined) {
  if (!mins) return null;
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
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
  updateStatus?: (id: string, status: string) => Promise<boolean>;
}) {
  const user = authStorage.getUser();
  const isAdminOrManager = user?.role === "FOUNDER" || user?.role === "ADMIN";

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (!updateStatus) return;
    setUpdatingId(taskId);
    await updateStatus(taskId, newStatus);
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
                              <DropdownMenuItem key={s} onClick={() => handleStatusChange(task.id, s)} data-testid={`change-status-${s}-${task.id}`}>
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM}`} data-testid={`priority-${task.id}`}>
                      {task.priority}
                    </span>
                  </TableCell>

                  {/* Due date */}
                  <TableCell>
                    <span className={`text-xs ${task.status !== "COMPLETED" && task.dueDate && new Date(task.dueDate) < new Date() ? "text-red-600 font-medium" : "text-muted-foreground"}`} data-testid={`due-date-${task.id}`}>
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
