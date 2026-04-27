'use client'
import { Home, List, Users, User, LogOut, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDriverStore } from '@/store/driverStore'
import { OnlineDot } from './OnlineDot'
import type { DriverTab, NavBadge } from './navTypes'

interface Props {
  open: boolean
  onClose: () => void
  activeTab: DriverTab
  onTabChange: (tab: DriverTab) => void
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

export function MobileNavDrawer({
  open, onClose, activeTab, onTabChange,
  driverName, driverInitials, groupName, isOnline, badges,
}: Props) {
  const router = useRouter()
  const handleSignOut = async () => {
    try {
      await useDriverStore.getState().signOut()
      router.replace('/auth/login')
    } catch { /* onAuthStateChange redirige au prochain refresh */ }
  }
  const handleNav = (tab: DriverTab) => {
    onTabChange(tab)
    onClose()
  }

  return (
    <>
      <div
        className={`md:hidden fixed inset-0 z-[700] bg-black/45 transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 z-[701] w-[78%] max-w-[320px] bg-paper dark:bg-night-bg shadow-[8px_0_24px_rgba(0,0,0,0.18)] transform transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-label="Menu navigation"
        aria-hidden={!open}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex flex-col h-full">
          <div className="px-5 pt-5 pb-4 border-b border-warm-200 dark:border-night-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-ink text-brand flex items-center justify-center text-base font-extrabold shrink-0">
                  {driverInitials}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-ink dark:text-night-text truncate">{driverName}</div>
                  <div className="flex items-center gap-1.5 text-[12px] text-warm-500 dark:text-night-text-soft mt-0.5">
                    <OnlineDot online={isOnline} size="sm" />
                    <span className="truncate">{groupName} · {isOnline ? 'En ligne' : 'Hors ligne'}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le menu"
                className="w-9 h-9 rounded-full hover:bg-warm-50 dark:hover:bg-night-elevated flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5 text-ink dark:text-night-text" strokeWidth={2} />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {ITEMS.map((item) => {
              const active = activeTab === item.key
              const Icon = item.icon
              const badge = item.key === 'courses'
                ? ((badges?.coursesNotif && badges.coursesNotif > 0) ? badges.coursesNotif : badges?.courses)
                : item.key === 'groupes' ? badges?.groupes
                : undefined
              const hasBadge = badge !== undefined && badge > 0
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNav(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors ${active ? 'bg-warm-50 dark:bg-night-elevated text-ink dark:text-night-text' : 'text-warm-600 dark:text-night-text-soft hover:bg-warm-50 dark:hover:bg-night-elevated'}`}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-brand" aria-hidden="true" />
                  )}
                  <Icon className="w-[20px] h-[20px]" strokeWidth={active ? 2 : 1.7} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasBadge && (
                    <span className="text-[11px] font-bold text-ink bg-brand rounded-full px-2 py-0.5">{badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="border-t border-warm-200 dark:border-night-border p-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-warm-50 dark:bg-night-elevated text-danger font-semibold text-[14px] hover:bg-danger-soft transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
