'use client'
import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export function ProfileSection({ title, children }: Props) {
  return (
    <section className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-500 px-1 mb-2">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {children}
      </div>
    </section>
  )
}
