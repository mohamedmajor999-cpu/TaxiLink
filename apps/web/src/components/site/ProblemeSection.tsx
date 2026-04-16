'use client'

import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { useProblemeSection } from './useProblemeSection'

const pills = [
  "Parlez, l'IA remplit tout",
  'Poster en 30 secondes chrono',
  'Créez une annonce sans quitter la route',
  "Dicter = poster, c'est tout",
]

export function ProblemeSection() {
  const { state, filledCount, fields, start } = useProblemeSection()

  const isActive = state === 'listening' || state === 'filling'
  const isDone = state === 'done'

  const statusLabel = {
    idle: 'Appuyez sur le micro',
    listening: 'Écoute en cours…',
    filling: 'Remplissage automatique…',
    done: 'Mission créée !',
  }[state]

  return (
    <section className="py-24 bg-bgsoft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-50 rounded-full px-4 py-2 mb-4">
            <Icon name="warning" size={16} className="text-red-500" />
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Le problème</span>
          </div>
          <h2 className="text-4xl font-black text-secondary mb-4">
            Poster une course en roulant ?<br />Cauchemar.
          </h2>
          <p className="text-muted text-lg max-w-xl mx-auto">
            Taper une adresse, un prix, une heure… pendant que vous conduisez.
            C&apos;est long, dangereux, et souvent trop tard.
          </p>
        </div>

        {/* Simulator card */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-white rounded-3xl shadow-card p-6">

            {/* Top row */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Création vocale IA</div>
                <div className="text-sm font-semibold text-secondary mt-0.5">{statusLabel}</div>
              </div>
              <button
                onClick={start}
                aria-label="Démarrer la simulation vocale"
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                  isDone
                    ? 'bg-green-500'
                    : isActive
                    ? 'bg-primary animate-pulse'
                    : 'bg-secondary hover:opacity-90'
                )}
              >
                <Icon name={isDone ? 'check' : 'mic'} size={24} className="text-white" />
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-3">
              {fields.map((field, i) => (
                <div key={field.key}>
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    {field.label}
                  </div>
                  <div className={cn(
                    'h-11 rounded-xl border-2 px-4 flex items-center text-sm font-semibold transition-all duration-300',
                    i < filledCount
                      ? 'border-primary bg-primary/5 text-secondary'
                      : 'border-line bg-bgsoft text-muted'
                  )}>
                    {i < filledCount ? field.value : '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Badge done */}
            {isDone && (
              <div className="mt-4 flex items-center justify-center gap-2 bg-green-50 rounded-2xl py-3">
                <Icon name="bolt" size={16} className="text-green-600" />
                <span className="text-sm font-bold text-green-700">Posté en 30 secondes</span>
              </div>
            )}
          </div>
        </div>

        {/* Pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {pills.map((pill) => (
            <div
              key={pill}
              className="flex items-center gap-2 bg-white border border-line rounded-full px-4 py-2 shadow-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-secondary">{pill}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
