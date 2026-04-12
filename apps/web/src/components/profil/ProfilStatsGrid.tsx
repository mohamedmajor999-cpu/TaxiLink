import { Icon } from '@/components/ui/Icon'
import { useDriverStore } from '@/store/driverStore'

export function ProfilStatsGrid() {
  const { driver } = useDriverStore()

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-white rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Icon name="directions_car" size={15} className="text-secondary" />
        </div>
        <div className="text-2xl font-black text-secondary leading-none">{driver.todayRides ?? 0}</div>
        <div className="text-muted uppercase tracking-wider font-semibold" style={{ fontSize: 9 }}>Courses</div>
      </div>
      <div className="bg-white rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Icon name="star" size={15} className="text-secondary" />
        </div>
        <div className="text-2xl font-black text-secondary leading-none">{driver.rating}</div>
        <div className="text-muted uppercase tracking-wider font-semibold" style={{ fontSize: 9 }}>Note</div>
      </div>
      <div className="bg-secondary rounded-2xl shadow-soft p-3 flex flex-col gap-1.5">
        <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
          <Icon name="euro" size={15} className="text-primary" />
        </div>
        <div className="text-2xl font-black text-primary leading-none">
          {(driver.todayEarnings ?? 0).toFixed(0)}€
        </div>
        <div className="text-white/40 uppercase tracking-wider font-semibold" style={{ fontSize: 9 }}>Gains</div>
      </div>
    </div>
  )
}
