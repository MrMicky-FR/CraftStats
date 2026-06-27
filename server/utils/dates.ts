export function subMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000)
}

export function subHours(date: Date, hours: number): Date {
  return subMinutes(date, hours * 60)
}

export function subDays(date: Date, days: number): Date {
  return subHours(date, days * 24)
}
