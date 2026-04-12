'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useModalStore } from '@/store/modalStore'
import { EditProfilModal } from './modals/EditProfilModal'
import { DocumentsModal } from './modals/DocumentsModal'
import { PaiementsModal } from './modals/PaiementsModal'
import { NotificationsModal } from './modals/NotificationsModal'
import { SecuriteModal } from './modals/SecuriteModal'
import { DeconnexionModal } from './modals/DeconnexionModal'

export function ModalOverlay() {
  const { activeModal, closeModal } = useModalStore()

  return (
    <AnimatePresence>
      {activeModal && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/40 backdrop-blur-modal z-50"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 max-w-[390px] mx-auto"
            style={{ maxHeight: '85dvh', overflowY: 'auto' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-line" />
            </div>

            {activeModal === 'editProfil'     && <EditProfilModal />}
            {activeModal === 'documents'      && <DocumentsModal />}
            {activeModal === 'paiements'      && <PaiementsModal />}
            {activeModal === 'notifications'  && <NotificationsModal />}
            {activeModal === 'securite'       && <SecuriteModal />}
            {activeModal === 'deconnexion'    && <DeconnexionModal />}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
