'use client'

import type { ReactNode } from 'react'

interface Props {
  title:    string
  subtitle?: string
  icon?:     ReactNode
  iconBg?:   string
  children:  ReactNode
  right?:    ReactNode
}

// Wrapper standard pour toutes les sections du dashboard admin.
export function SectionShell({ title, subtitle, icon, iconBg = 'bg-bgsoft text-secondary', children, right }: Props) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-line/50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          {icon && (
            <span className={`flex size-9 items-center justify-center rounded-xl ${iconBg}`}>
              {icon}
            </span>
          )}
          <div>
            <h2 className="text-lg font-semibold text-secondary md:text-xl">{title}</h2>
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
        </div>
        {right}
      </header>
      <div className="p-5 md:p-6">{children}</div>
    </section>
  )
}
