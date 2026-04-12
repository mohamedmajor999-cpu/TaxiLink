'use client'

import { useModalStore } from '@/store/modalStore'
import { Icon } from '@/components/ui/Icon'

export function ModalHeader({ title }: { title: string }) {
  const { closeModal } = useModalStore()
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-line">
      <h2 className="text-lg font-bold text-secondary">{title}</h2>
      <button
        onClick={closeModal}
        aria-label="Fermer"
        className="w-8 h-8 rounded-xl bg-bgsoft flex items-center justify-center"
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  )
}
