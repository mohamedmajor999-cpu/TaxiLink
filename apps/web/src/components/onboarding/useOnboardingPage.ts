import { useEffect, useRef, useState } from 'react'

export function useOnboardingPage() {
  const lastSectionRef = useRef<HTMLDivElement>(null)
  const [showCta, setShowCta] = useState(false)

  useEffect(() => {
    const el = lastSectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowCta(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { showCta, lastSectionRef }
}
