'use client'

import { ModalHeader } from './ModalHeader'
import { ToggleRow } from './ToggleRow'
import { useNotificationsModal } from './useNotificationsModal'

export function NotificationsModal() {
  const { prefs, toggle } = useNotificationsModal()

  return (
    <div className="pb-8">
      <ModalHeader title="Notifications" />
      <div className="px-5 pt-5">
        <ToggleRow
          label="Nouvelles missions"
          desc="Alertes en temps réel"
          value={prefs.new_missions}
          onChange={() => toggle('new_missions')}
        />
        <ToggleRow
          label="Rappels de course"
          desc="15 min avant"
          value={prefs.reminders}
          onChange={() => toggle('reminders')}
        />
        <ToggleRow
          label="Sons"
          value={prefs.sounds}
          onChange={() => toggle('sounds')}
        />
        <ToggleRow
          label="Vibrations"
          value={prefs.vibrations}
          onChange={() => toggle('vibrations')}
        />
      </div>
    </div>
  )
}
