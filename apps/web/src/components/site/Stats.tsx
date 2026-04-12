const stats = [
  { value: '10 sec',      label: 'Pour poster une course',          icon: '⚡' },
  { value: '0€',          label: 'Pour toujours, sans engagement',  icon: '🎁' },
  { value: 'Instantané',  label: 'Notification dès qu\'elle est prise', icon: '🔔' },
  { value: 'Auto',        label: 'La course s\'ajoute à l\'agenda',  icon: '📅' },
]

export function Stats() {
  return (
    <section className="bg-primary py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-3xl font-black text-secondary mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-secondary/60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
