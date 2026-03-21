import { format, isPast, isToday, isTomorrow } from "date-fns"

export function getPhoneClean(phone: string | null) {
  if (!phone) return ""
  return phone.replace(/[^0-9]/g, "")
}

export function getDueDateDisplay(dateStr: string) {
  const date = new Date(dateStr)

  const past = isPast(date) && !isToday(date)
  const today = isToday(date)
  const tomorrow = isTomorrow(date)

  let label = format(date, "dd MMM yyyy")
  let className = "text-sm text-muted-foreground"

  if (past) {
    const days = Math.ceil(
      (new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    label = `${days} day${days > 1 ? "s" : ""} overdue`
    className = "text-sm text-red-600 font-medium"
  }

  else if (today) {
    label = "Due today"
    className = "text-sm text-[#5FA8A8] font-medium"
  }

  else if (tomorrow) {
    label = "Due tomorrow"
    className = "text-sm text-yellow-600 font-medium"
  }

  return { label, className }
}
