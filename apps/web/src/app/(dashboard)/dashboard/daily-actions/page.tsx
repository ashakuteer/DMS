"use client"

import { RefreshCw, Loader2, CheckSquare, Square, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTaskInbox, TaskItem } from "./hooks/useTaskInbox"

const TYPE_LABELS: Record<string, string> = {
  BIRTHDAY: "Birthday",
  FOLLOW_UP: "Follow Up",
  PLEDGE: "Pledge",
  REMINDER: "Reminder",
  MANUAL: "Manual",
}

const TYPE_COLORS: Record<string, string> = {
  BIRTHDAY: "bg-pink-100 text-pink-700",
  FOLLOW_UP: "bg-blue-100 text-blue-700",
  PLEDGE: "bg-purple-100 text-purple-700",
  REMINDER: "bg-yellow-100 text-yellow-700",
  MANUAL: "bg-gray-100 text-gray-600",
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700",
  URGENT: "bg-red-200 text-red-800",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-500",
}

function TaskCard({
  task,
  isOverdue,
  isCompleted,
  isCompleting,
  onToggle,
}: {
  task: TaskItem
  isOverdue: boolean
  isCompleted: boolean
  isCompleting: boolean
  onToggle: () => void
}) {
  const borderColor = isCompleted
    ? "border-l-4 border-l-gray-300"
    : isOverdue
    ? "border-l-4 border-l-red-500"
    : "border-l-4 border-l-teal-500"

  const donorName = task.donor
    ? `${task.donor.firstName} ${task.donor.lastName}`
    : task.beneficiary?.fullName ?? null

  return (
    <div
      data-testid={`task-card-${task.id}`}
      className={`flex items-start gap-3 bg-white rounded-lg p-3 mb-[10px] ${borderColor}`}
      style={{
        border: "1px solid #E2E8F0",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        opacity: isCompleted ? 0.6 : 1,
        borderLeft: isCompleted
          ? "4px solid #CBD5E0"
          : isOverdue
          ? "4px solid #EF4444"
          : "4px solid #0D9488",
      }}
    >
      <button
        data-testid={`checkbox-task-${task.id}`}
        onClick={onToggle}
        disabled={isCompleting}
        className="mt-0.5 flex-shrink-0 text-teal-600 disabled:opacity-40 hover:text-teal-800 transition-colors"
      >
        {isCompleted ? (
          <CheckSquare className="h-5 w-5" />
        ) : (
          <Square className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          data-testid={`task-title-${task.id}`}
          className={`font-semibold text-sm leading-snug ${isCompleted ? "line-through text-gray-400" : "text-gray-800"}`}
        >
          {task.title}
        </p>
        {donorName && (
          <p className="text-xs text-gray-500 mt-0.5">{donorName}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[task.type] ?? "bg-gray-100 text-gray-600"}`}
          >
            {TYPE_LABELS[task.type] ?? task.type}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? "bg-gray-100 text-gray-500"}`}
          >
            {task.priority}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        {isCompleted ? (
          <span className="text-xs font-medium text-green-600">Done</span>
        ) : isOverdue ? (
          <span
            data-testid={`label-overdue-${task.id}`}
            className="text-xs font-semibold text-red-500"
          >
            Overdue
          </span>
        ) : (
          <span
            data-testid={`label-today-${task.id}`}
            className="text-xs font-semibold text-teal-600"
          >
            Due Today
          </span>
        )}
      </div>
    </div>
  )
}

export default function DailyActionsPage() {
  const { data, loading, completing, completedIds, markComplete, unmarkComplete, refresh } =
    useTaskInbox()

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-gray-500">
        Failed to load tasks.
        <Button onClick={refresh} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  const allTasks: Array<TaskItem & { isOverdue: boolean }> = [
    ...data.overdue.map((t) => ({ ...t, isOverdue: true })),
    ...data.dueToday.map((t) => ({ ...t, isOverdue: false })),
  ]

  const completedCount = completedIds.size
  const totalCount = data.total
  const overdueCount = data.overdue.length

  const isEmpty = allTasks.length === 0

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Today's Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Task inbox for today</p>
        </div>
        <Button variant="outline" onClick={refresh} data-testid="button-refresh-tasks">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div
          data-testid="summary-total"
          className="bg-white rounded-lg p-4 text-center"
          style={{ border: "1px solid #E2E8F0" }}
        >
          <p className="text-2xl font-bold text-gray-800">{totalCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
        </div>
        <div
          data-testid="summary-overdue"
          className="bg-white rounded-lg p-4 text-center"
          style={{ border: "1px solid #E2E8F0" }}
        >
          <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
        </div>
        <div
          data-testid="summary-completed"
          className="bg-white rounded-lg p-4 text-center"
          style={{ border: "1px solid #E2E8F0" }}
        >
          <p className="text-2xl font-bold text-teal-600">{completedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Task List
        </h2>

        {isEmpty ? (
          <div
            className="flex flex-col items-center gap-3 py-14 text-gray-400 bg-white rounded-lg"
            style={{ border: "1px solid #E2E8F0" }}
            data-testid="empty-state"
          >
            <ClipboardList className="h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">No tasks for today</p>
          </div>
        ) : (
          <div>
            {allTasks.map((task) => {
              const isCompleted = completedIds.has(task.id)
              const isCompleting = completing.has(task.id)
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  isOverdue={task.isOverdue}
                  isCompleted={isCompleted}
                  isCompleting={isCompleting}
                  onToggle={() =>
                    isCompleted ? unmarkComplete(task.id) : markComplete(task.id)
                  }
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
