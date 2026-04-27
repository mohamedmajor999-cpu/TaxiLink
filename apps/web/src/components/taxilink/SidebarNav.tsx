'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Home, List, Plus, Users, User, LogOut } from 'lucide-react'
import { OnlineDot } from './OnlineDot'
import { useDriverStore } from '@/store/driverStore'
import type { DriverTab, NavBadge } from './navTypes'

interface Props {
  activeTab: DriverTab
  onTabChange: (tab: DriverTab) => void
  onPostCourse: () => void
  driverName: string
  driverInitials: string
  groupName: string
  isOnline: boolean
  badges?: NavBadge
}

const ITEMS: { key: DriverTab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'courses', label: 'Mes courses', icon: List },
  { key: 'groupes', label: 'Groupes', icon: Users },
  { key: 'profil', label: 'Mon profil', icon: User },
]

export function SidebarNav({
  activeTab,
  onTabChange,
  onPostCourse,
  driverName,
  driverInitials,
  groupName,
  isOnline,
  badges,
}: Props) {
  const router = useRouter()
  const handleSignOut = async () => {
    try {
      await useDriverStore.getState().signOut()
      router.replace('/auth/login')
    } catch { /* ignore : onAuthStateChange redirigera au prochain refresh */ }
  }
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-warm-200 h-screen sticky top-0" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="px-5 py-6 flex items-center">
        <Image src="/brand/logo-primary.svg" alt="TaxiLink Pro" width={157} height={28} className="h-7 w-auto" />
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {ITEMS.slice(0, 2).map((item) => {
          const coursesCount = (badges?.coursesNotif && badges.coursesNotif > 0)
            ? badges.coursesNotif
            : badges?.courses
          return (
            <NavItem
              key={item.key}
              item={item}
              active={activeTab === item.key}
              badge={item.key === 'courses' ? coursesCount : undefined}
              onClick={() => onTabChange(item.key)}
            />
          )
        })}

        <button
          type="button"
          onClick={onPostCourse}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-warm-50 transition-colors"
        >
          <Plus className="w-[18px] h-[18px]" strokeWidth={1.8} />
          Poster une course
        </button>

        {ITEMS.slice(2).map((item) => (
          <NavItem
            key={item.key}
            item={item}
            active={activeTab === item.key}
            badge={item.key === 'groupes' ? badges?.groupes : undefined}
            onClick={() => onTabChange(item.key)}
          />
        ))}
      </nav>

      <div className="m-3 rounded-xl border border-warm-200 overflow-hidden">
        <div className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center text-sm font-semibold">
            {driverInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{driverName}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-warm-500">
              <OnlineDot online={isOnline} size="sm" />
              {groupName} · {isOnline ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-danger bg-warm-50 hover:bg-danger-soft border-t border-warm-200 transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  item,
  active,
  badge,
  onClick,
}: {
  item: { key: DriverTab; label: string; icon: typeof Home }
  active: boolean
  badge?: number
  onClick: () => void
}) {
  const Icon = item.icon
  const hasBadge = badge !== undefined && badge > 0
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-warm-50 text-ink' : 'text-warm-600 hover:bg-warm-50 hover:text-ink'}`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-brand" />
      )}
      <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2 : 1.6} />
      <span className="flex-1 text-left">{item.label}</span>
      {hasBadge && (
        <span className="text-[10px] font-bold text-ink bg-brand rounded-full px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </button>
  )
}
