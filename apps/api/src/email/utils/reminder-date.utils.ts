export function calculateDaysUntil(from: Date, to: Date): number {
  return Math.floor(
    (to.getTime() - from.getTime()) /
    (1000 * 60 * 60 * 24)
  )
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function calculateNextOccurrence(month:number, day:number):Date{

  const today = new Date()
  const year = today.getFullYear()

  let date = new Date(year, month-1, day)

  if(date < today){
    date = new Date(year+1, month-1, day)
  }

  return date

}
