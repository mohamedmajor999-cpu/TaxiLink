import { useEffect, useState } from 'react'

export function useLandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [menuOpen])

  return {
    menuOpen,
    openMenu:  () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
  }
}
