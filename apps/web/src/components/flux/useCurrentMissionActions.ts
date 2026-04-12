import { useMissionStore } from '@/store/missionStore'

export function useCurrentMissionActions() {
  const { currentMission, completeMission } = useMissionStore()

  const handleCall = () => {
    if (currentMission?.phone) window.location.href = `tel:${currentMission.phone}`
  }

  const handleSms = () => {
    if (currentMission?.phone) window.location.href = `sms:${currentMission.phone}`
  }

  const handleNavigate = () => {
    if (!currentMission) return
    const query = encodeURIComponent(currentMission.destination)
    window.open(`https://maps.google.com?q=${query}`, '_blank')
  }

  return { currentMission, handleCall, handleSms, handleNavigate, completeMission }
}
