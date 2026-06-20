import { twMerge } from "tailwind-merge"

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(inputs.filter(Boolean).join(" "))
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

export function getWeekEnd(date: Date = new Date()): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function getWeekKey(date: Date = new Date()): string {
  const start = getWeekStart(date)
  const year = start.getFullYear()
  const month = String(start.getMonth() + 1).padStart(2, "0")
  const day = String(start.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function isCurrentWeek(weekKey: string): boolean {
  return weekKey === getWeekKey()
}

export function getWeekLabel(weekKey: string): string {
  const [year, month, day] = weekKey.split("-").map(Number)
  const start = new Date(year, month - 1, day)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startMonth = start.getMonth() + 1
  const startDay = start.getDate()
  const endMonth = end.getMonth() + 1
  const endDay = end.getDate()

  if (startMonth === endMonth) {
    return `${startMonth}月${startDay}日 - ${endDay}日`
  }
  return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`
}

export function generateWeekKeys(count: number = 8): string[] {
  const weeks: string[] = []
  const current = getWeekStart()
  for (let i = 0; i < count; i++) {
    const d = new Date(current)
    d.setDate(current.getDate() - i * 7)
    weeks.push(getWeekKey(d))
  }
  return weeks
}
