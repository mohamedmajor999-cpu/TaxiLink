export interface DateGroup<T> {
  key: string
  label: string
  items: T[]
}

interface WithScheduledAt {
  mission: { scheduled_at: string }
}

export function groupMissionsByDate<T extends WithScheduledAt>(items: T[]): DateGroup<T>[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const tomorrow = today + 86_400_000
  const dayAfter = tomorrow + 86_400_000
  const weekEnd = today + 7 * 86_400_000

  const buckets: Record<string, DateGroup<T>> = {
    past:     { key: 'past',     label: 'Passées',      items: [] },
    today:    { key: 'today',    label: "Aujourd'hui",  items: [] },
    tomorrow: { key: 'tomorrow', label: 'Demain',       items: [] },
    week:     { key: 'week',     label: 'Cette semaine', items: [] },
    later:    { key: 'later',    label: 'Plus tard',    items: [] },
  }

  for (const item of items) {
    const t = new Date(item.mission.scheduled_at).getTime()
    if (t < today) buckets.past.items.push(item)
    else if (t < tomorrow) buckets.today.items.push(item)
    else if (t < dayAfter) buckets.tomorrow.items.push(item)
    else if (t < weekEnd) buckets.week.items.push(item)
    else buckets.later.items.push(item)
  }

  return Object.values(buckets).filter((b) => b.items.length > 0)
}
