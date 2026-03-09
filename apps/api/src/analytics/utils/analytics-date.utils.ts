export function getCurrentFY() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const fyStart =
    month >= 3 ? new Date(year, 3, 1) : new Date(year - 1, 3, 1)

  const fyEnd =
    month >= 3
      ? new Date(year + 1, 2, 31, 23, 59, 59)
      : new Date(year, 2, 31, 23, 59, 59)

  return { fyStart, fyEnd }
}

export function getMonthRange(offset = 0) {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)

  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

  return { start, end }
}

export function getTrailing12MonthsRange() {
  const now = new Date()

  const start = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate()
  )

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59
  )

  return { start, end }
}
