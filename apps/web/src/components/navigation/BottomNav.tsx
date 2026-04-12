'use client'

import { useNavStore, type Screen } from '@/store/navStore'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/utils'

const navItems: { screen: Screen; icon: string; label: string }[] = [
  { screen: 'flux', icon: 'explore', label: 'Missions' },
  { screen: 'creer', icon: 'add_circle', label: 'Créer' },
  { screen: 'calendrier', icon: 'calendar_today', label: 'Agenda' },
  { screen: 'historique', icon: 'history', label: 'Hist.' },
  { screen: 'profil', icon: 'person', label: 'Profil' },
]

export function BottomNav() {
  const { activeScreen, setScreen } = useNavStore()

  return (
    <nav
      className="absolute bottom-0 inset-x-0 bg-white border-t border-line px-2 pt-2 pb-2 grid grid-cols-5 gap-1 z-50"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {navItems.map(({ screen, icon, label }) => {
        const isActive = activeScreen === screen

        return (
          <button
            key={screen}
            onClick={() => setScreen(screen)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'min-w-0 flex flex-col items-center justify-center rounded-xl px-2 py-2.5 cursor-pointer transition-all duration-200',
              isActive
                ? 'bg-primary text-secondary nav-item-active'
                : 'text-muted hover:text-secondary'
            )}
          >
            <Icon name={icon} size={20} />
            <span className="text-[10px] font-semibold uppercase tracking-wide mt-1">
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
