import { useState } from 'react'

export function useNavbar() {
  const [open, setOpen] = useState(false)
  return { open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }
}
