"use client"

import { RefreshCw, Loader2, CheckSquare, Square, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
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

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
}

function sortByPriorityThenDate(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99
    const pb = PRIORITY_ORDER[b.priority] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-1">
      {label}
    </h2>
  )
}

function TaskCard({
  task,
  isOverdue,
  isToggling,
  onToggle,
}: {
  task: TaskItem
  isOverdue: boolean
  isToggling: boolean
  onToggle: () => void
}) {
  const isCompleted = task.status === "COMPLETED"

  const donorName = task.donor
    ? `${task.donor.firstName} ${task.donor.lastName}`
    : task.beneficiary?.fullName ?? null

  return (
    <div
      data-testid={`task-card-${task.id}`}
      className="flex items-start gap-3 bg-white rounded-lg"
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
        disabled={isToggling}
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
  const { data, loading, toggling, toggleStatus, refresh } = useTaskInbox()

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

  const overdueGroup = sortByPriorityThenDate(data.overdue)

  const todayPending = sortByPriorityThenDate(
    data.dueToday.filter((t) => t.status !== "COMPLETED")
  )
  const completedGroup = sortByPriorityThenDate(
    data.dueToday.filter((t) => t.status === "COMPLETED")
  )

  const completedCount = completedGroup.length
  const totalCount = data.total
  const overdueCount = overdueGroup.length
  const isEmpty = overdueGroup.length === 0 && todayPending.length === 0 && completedGroup.length === 0

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
            {overdueGroup.length > 0 && (
              <div data-testid="section-overdue" className="mb-4">
                <SectionHeader label="🔴 Overdue" />
                {overdueGroup.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOverdue={true}
                    isToggling={toggling.has(task.id)}
                    onToggle={() => toggleStatus(task.id, task.status)}
                  />
                ))}
              </div>
            )}

            {todayPending.length > 0 && (
              <div data-testid="section-today" className="mb-4">
                <SectionHeader label="🟡 Due Today" />
                {todayPending.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOverdue={false}
                    isToggling={toggling.has(task.id)}
                    onToggle={() => toggleStatus(task.id, task.status)}
                  />
                ))}
              </div>
            )}

            {completedGroup.length > 0 && (
              <div data-testid="section-completed" className="mb-4">
                <SectionHeader label="✅ Completed" />
                {completedGroup.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOverdue={false}
                    isToggling={toggling.has(task.id)}
                    onToggle={() => toggleStatus(task.id, task.status)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
