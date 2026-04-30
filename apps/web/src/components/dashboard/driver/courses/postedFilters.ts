import type { PostedMissionView, PostedSort, PostedStatusFilter } from './usePostedTab'

export function applyStatusFilter(
  items: PostedMissionView[],
  statusFilter: PostedStatusFilter,
): PostedMissionView[] {
  if (statusFilter === 'all') return items
  return items.filter((i) => i.status === statusFilter)
}

export function applySort(items: PostedMissionView[], sort: PostedSort): PostedMissionView[] {
  const arr = [...items]
  const getTime = (v: PostedMissionView) => {
    if (sort === 'created') return new Date(v.mission.created_at).getTime()
    if (sort === 'accepted') return v.mission.accepted_at ? new Date(v.mission.accepted_at).getTime() : 0
    return new Date(v.mission.scheduled_at).getTime()
  }
  // created/accepted = plus recent en premier ; scheduled = plus proche en premier
  return arr.sort((a, b) =>
    sort === 'scheduled' ? getTime(a) - getTime(b) : getTime(b) - getTime(a),
  )
}

export function computeCounts(items: PostedMissionView[]) {
  return {
    all: items.length,
    waiting: items.filter((i) => i.status === 'waiting').length,
    accepted: items.filter((i) => i.status === 'accepted').length,
  }
}
