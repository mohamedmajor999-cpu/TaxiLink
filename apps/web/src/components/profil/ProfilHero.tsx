import { Icon } from '@/components/ui/Icon'
import { useDriverStore } from '@/store/driverStore'

export function ProfilHero() {
  const { driver } = useDriverStore()

  return (
    <div className="relative h-48 mini-map overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 z-10" />
      <div className="absolute bottom-4 left-5 right-5 z-20 flex items-end justify-between">
        <div>
          <div className="text-white font-black text-2xl leading-tight">{driver.name}</div>
          <div className="flex items-center gap-1.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon
                key={i}
                name="star"
                size={14}
                className={i < Math.round(driver.rating) ? 'text-primary' : 'text-white/30'}
              />
            ))}
            <span className="text-white/80 text-xs font-semibold ml-1">{driver.rating}</span>
            <span className="text-white/40 text-xs ml-0.5">({driver.totalRides} courses)</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-primary rounded-xl px-3 py-1.5">
          <Icon name="verified" size={13} className="text-secondary" />
          <span className="text-xs font-black text-secondary uppercase tracking-wide">Pro</span>
        </div>
      </div>
    </div>
  )
}
