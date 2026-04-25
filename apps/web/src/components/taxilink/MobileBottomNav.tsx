'use client'
import { Home, Wallet, Plus, Users, User } from 'lucide-react'
import type { DriverTab } from './navTypes'

interface Props {
  activeTab: DriverTab
  onTabChange: (tab: DriverTab) => void
  onPostCourse: () => void
  coursesBadge?: number
  coursesNotif?: number
}

interface NavItem {
  key: DriverTab
  label: string
  icon: typeof Home
  badge?: number
}

export function MobileBottomNav({ activeTab, onTabChange, onPostCourse, coursesBadge, coursesNotif }: Props) {
  const coursesDisplay = (coursesNotif && coursesNotif > 0) ? coursesNotif : coursesBadge
  const left: NavItem[] = [
    { key: 'home', label: 'Accueil', icon: Home },
    { key: 'courses', label: 'Courses', icon: Wallet, badge: coursesDisplay },
  ]
  const right: NavItem[] = [
    { key: 'groupes', label: 'Groupes', icon: Users },
    { key: 'profil', label: 'Profil', icon: User },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-warm-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigation principale"
    >
      <div className="grid grid-cols-5 items-end h-[60px] relative">
        {left.map((item) => (
          <NavBtn key={item.key} item={item} active={activeTab === item.key} onClick={() => onTabChange(item.key)} />
        ))}

        <div className="flex items-start justify-center -mt-6">
          <div className="w-[60px] h-[60px] rounded-full bg-paper border-2 border-warm-200 flex items-center justify-center">
            <button
              type="button"
              onClick={onPostCourse}
              aria-label="Poster une course"
              className="w-[48px] h-[48px] rounded-full bg-ink text-brand flex items-center justify-center shadow-fab hover:shadow-fab-hover transition-shadow"
            >
              <Plus className="w-6 h-6" strokeWidth={2.6} />
            </button>
          </div>
        </div>

        {right.map((item) => (
          <NavBtn key={item.key} item={item} active={activeTab === item.key} onClick={() => onTabChange(item.key)} />
        ))}
      </div>
    </nav>
  )
}

function NavBtn({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  const hasBadge = item.badge != null && item.badge > 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`h-[60px] flex flex-col items-center justify-center gap-0.5 ${active ? 'text-ink' : 'text-warm-400'}`}
    >
      <span className="relative inline-flex">
        <Icon
          className="w-5 h-5"
          strokeWidth={active ? 2 : 1.8}
          fill={active ? '#FFD11A' : 'none'}
        />
        {hasBadge && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-ink text-[10px] font-bold flex items-center justify-center ring-2 ring-paper">
            {item.badge! > 99 ? '99+' : item.badge}
          </span>
        )}
      </span>
      <span className={`text-[11px] ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
    </button>
  )
}
