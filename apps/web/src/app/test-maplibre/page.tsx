import dynamic from 'next/dynamic'

// Page de test isolee pour valider MapLibre + OpenFreeMap avant de migrer
// la vraie carte d'accueil. A supprimer une fois la migration terminee.
const MapLibreTest = dynamic(() => import('./MapLibreTest').then((m) => m.MapLibreTest), {
  ssr: false,
})

export default function TestMapLibrePage() {
  return (
    <main className="w-full h-screen flex flex-col">
      <div className="bg-ink text-paper p-3 text-[13px]">
        <strong>Test MapLibre + OpenFreeMap</strong>
        <span className="ml-3 text-paper/70">
          Pince pour rotater (mobile) · Shift+drag (desktop). Les noms de villes/rues doivent rester droits.
        </span>
      </div>
      <div className="flex-1">
        <MapLibreTest />
      </div>
    </main>
  )
}
