'use client'

import { ModalHeader } from './ModalHeader'
import { ToggleRow } from './ToggleRow'

export function NotificationsModal() {
  return (
    <div className="pb-8">
      <ModalHeader title="Notifications" />
      <div className="px-5 pt-5">
        <ToggleRow label="Nouvelles missions" desc="Alertes en temps réel" defaultOn={true} />
        <ToggleRow label="Rappels de course" desc="15 min avant" defaultOn={true} />
        <ToggleRow label="Sons" defaultOn={true} />
        <ToggleRow label="Vibrations" defaultOn={false} />
      </div>
    </div>
  )
}
