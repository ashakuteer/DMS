"use client"

import { useState } from "react"
import {
  RefreshCw, Loader2, Plus, Phone, MessageCircle, User,
  ClipboardList, CheckSquare, Square, Zap, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useTaskInbox,
  type TaskItem,
  type TaskType,
  type TaskPriority,
  type CreateTaskInput,
} from "./hooks/useTaskInbox"
import { authStorage } from "@/lib/auth"
import Link from "next/link"

const TYPE_LABELS: Record<string, string> = {
  BIRTHDAY: "Birthday",
  FOLLOW_UP: "Follow Up",
  PLEDGE: "Pledge",
  REMINDER: "Reminder",
}

const TYPE_COLORS: Record<string, string> = {
  BIRTHDAY: "bg-pink-100 text-pink-700",
  FOLLOW_UP: "bg-blue-100 text-blue-700",
  PLEDGE: "bg-purple-100 text-purple-700",
  REMINDER: "bg-yellow-100 text-yellow-700",
}

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-200 text-red-800",
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-orange-100 text-orange-700",
  LOW: "bg-gray-100 text-gray-500",
}

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

function isOverdue(task: TaskItem): boolean {
  return (
    task.status === "OVERDUE" ||
    (task.status === "PENDING" && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)))
  )
}

function isDueToday(task: TaskItem): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const d = new Date(task.dueDate)
  return d >= today && d < tomorrow
}

function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    const aOver = isOverdue(a) ? 0 : isDueToday(a) ? 1 : 2
    const bOver = isOverdue(b) ? 0 : isDueToday(b) ? 1 : 2
    if (aOver !== bOver) return aOver - bOver
    const pa = PRIORITY_ORDER[a.priority] ?? 99
    const pb = PRIORITY_ORDER[b.priority] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  if (d.getTime() === today.getTime()) return "Today"
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow"
  if (d < today) {
    const diff = Math.round((today.getTime() - d.getTime()) / 86400000)
    return `${diff}d overdue`
  }
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

function whatsappUrl(phone: string | null | undefined, name: string): string {
  if (!phone) return "#"
  const clean = phone.replace(/\D/g, "")
  const num = clean.startsWith("91") ? clean : `91${clean}`
  const msg = encodeURIComponent(`Hello ${name}, this is a message from Asha Kuteer Foundation.`)
  return `https://wa.me/${num}?text=${msg}`
}

interface NewTaskFormProps {
  onCancel: () => void
  onCreate: (input: CreateTaskInput) => Promise<boolean>
  creating: boolean
}

function NewTaskForm({ onCancel, onCreate, creating }: NewTaskFormProps) {
  const [title, setTitle] = useState("")
  const [type, setType] = useState<TaskType>("GENERAL")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const ok = await onCreate({ title: title.trim(), type, priority, dueDate, description: description || undefined })
    if (ok) onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">New Task</h3>
      <div className="space-y-3">
        <div>
          <input
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Task title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            data-testid="input-task-title"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={type}
              onChange={e => setType(e.target.value as TaskType)}
              data-testid="select-task-type"
            >
              {(["BIRTHDAY", "FOLLOW_UP", "PLEDGE", "REMINDER"] as TaskType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Priority</label>
            <select
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              data-testid="select-task-priority"
            >
              {(["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Due Date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              data-testid="input-task-due"
            />
          </div>
        </div>
        <div>
          <input
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            data-testid="input-task-description"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} data-testid="button-cancel-task">
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={creating || !title.trim()} data-testid="button-submit-task">
            {creating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            Create Task
          </Button>
        </div>
      </div>
    </form>
  )
}

interface TaskRowProps {
  task: TaskItem
  isCompleting: boolean
  onComplete: () => void
  onReopen: () => void
  showCompleted: boolean
}

function TaskRow({ task, isCompleting, onComplete, onReopen, showCompleted }: TaskRowProps) {
  const overdue = isOverdue(task)
  const completed = task.status === "COMPLETED"
  const dueLabel = formatDate(task.dueDate)
  const donorName = task.donor ? `${task.donor.firstName} ${task.donor.lastName || ""}`.trim() : null
  const phone = task.donor?.primaryPhone || null

  return (
    <div
      data-testid={`task-row-${task.id}`}
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        overdue && !completed ? "bg-red-50 hover:bg-red-50 border-b-red-100" : ""
      } ${completed ? "opacity-60" : ""}`}
    >
      {/* Checkbox */}
      <button
        onClick={completed ? onReopen : onComplete}
        disabled={isCompleting}
        className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-teal-600 transition-colors"
        data-testid={`checkbox-task-${task.id}`}
        aria-label={completed ? "Reopen task" : "Mark complete"}
      >
        {isCompleting ? (
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
        ) : completed ? (
          <CheckSquare className="h-5 w-5 text-teal-500" />
        ) : (
          <Square className="h-5 w-5" />
        )}
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium ${completed ? "line-through text-gray-400" : overdue ? "text-red-800" : "text-gray-800"}`}
            data-testid={`task-title-${task.id}`}
          >
            {task.title}
          </span>
          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[task.type] || "bg-gray-100 text-gray-600"}`}>
            {TYPE_LABELS[task.type] || task.type}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {donorName && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              {donorName}
            </span>
          )}
          <span className={`text-xs font-medium ${overdue && !completed ? "text-red-600" : "text-gray-400"}`}>
            {dueLabel}
          </span>
          <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority] || "bg-gray-100 text-gray-500"}`}>
            {PRIORITY_LABELS[task.priority] || task.priority}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      {!completed && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {phone && (
            <a
              href={`tel:${phone}`}
              title={`Call ${donorName || "donor"}`}
              className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              data-testid={`button-call-${task.id}`}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          {phone && (
            <a
              href={whatsappUrl(phone, donorName || "there")}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
              className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
              data-testid={`button-whatsapp-${task.id}`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
          {task.donorId && (
            <Link
              href={`/dashboard/donors/${task.donorId}`}
              title="View donor"
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              data-testid={`button-view-donor-${task.id}`}
            >
              <User className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

const TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "BIRTHDAY", label: "Birthdays" },
  { value: "FOLLOW_UP", label: "Follow-ups" },
  { value: "PLEDGE", label: "Pledges" },
  { value: "REMINDER", label: "Reminders" },
]

export default function DailyActionsPage() {
  const { tasks, loading, completing, creating, completeTask, reopenTask, createTask, generateTasks, refresh } = useTaskInbox()
  const [typeFilter, setTypeFilter] = useState("ALL")
  const [showCompleted, setShowCompleted] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const user = authStorage.getUser()
  const isAdmin = user?.role === "ADMIN" || user?.role === "FOUNDER"

  const handleGenerate = async () => {
    setGenerating(true)
    await generateTasks()
    setGenerating(false)
  }

  // Filter tasks
  const filtered = tasks.filter(t => {
    if (!showCompleted && t.status === "COMPLETED") return false
    if (typeFilter !== "ALL" && t.type !== typeFilter) return false
    return true
  })

  const sorted = sortTasks(filtered)

  const pending = tasks.filter(t => t.status !== "COMPLETED")
  const overdueTasks = tasks.filter(t => isOverdue(t) && t.status !== "COMPLETED")
  const completedToday = tasks.filter(t => t.status === "COMPLETED")

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-800" data-testid="text-task-inbox-title">Task Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending.length} pending
            {overdueTasks.length > 0 && (
              <span className="text-red-500 ml-2">· {overdueTasks.length} overdue</span>
            )}
            {completedToday.length > 0 && (
              <span className="text-teal-600 ml-2">· {completedToday.length} done</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating || loading}
              data-testid="button-generate-tasks"
              title="Auto-generate birthday, pledge & follow-up tasks"
            >
              {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
              Generate
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            data-testid="button-refresh-tasks"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNewForm(v => !v)}
            data-testid="button-new-task"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
      </div>

      {/* New Task Form */}
      {showNewForm && (
        <NewTaskForm
          onCancel={() => setShowNewForm(false)}
          onCreate={createTask}
          creating={creating}
        />
      )}

      {/* Type Filters */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            data-testid={`filter-type-${f.value.toLowerCase()}`}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              typeFilter === f.value
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowCompleted(v => !v)}
          data-testid="filter-show-completed"
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ml-auto ${
            showCompleted
              ? "bg-teal-100 text-teal-700"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {showCompleted ? "Hide done" : "Show done"}
        </button>
      </div>

      {/* Task List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" data-testid="task-list">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 py-16 text-gray-400"
            data-testid="empty-state"
          >
            <ClipboardList className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">
              {typeFilter !== "ALL"
                ? `No ${TYPE_LABELS[typeFilter] || typeFilter} tasks`
                : showCompleted
                ? "No tasks"
                : "All caught up! No pending tasks."}
            </p>
            {!showCompleted && pending.length === 0 && (
              <p className="text-xs text-gray-400">Click Generate to auto-create today's tasks</p>
            )}
          </div>
        ) : (
          <div>
            {sorted.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                isCompleting={completing.has(task.id)}
                onComplete={() => completeTask(task.id)}
                onReopen={() => reopenTask(task.id)}
                showCompleted={showCompleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer summary */}
      {sorted.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Showing {sorted.length} task{sorted.length !== 1 ? "s" : ""}
          {typeFilter !== "ALL" ? ` · Filtered by ${TYPE_LABELS[typeFilter]}` : ""}
        </p>
      )}
    </div>
  )
}
