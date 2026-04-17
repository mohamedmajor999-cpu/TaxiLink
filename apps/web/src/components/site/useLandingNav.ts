import { useState } from 'react'

export function useLandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  return {
    menuOpen,
    openMenu:  () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
  }
}
