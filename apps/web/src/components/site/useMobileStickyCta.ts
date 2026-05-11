import { useEffect, useState } from 'react'

export function useMobileStickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let footerVisible = false
    let scrolledEnough = false
    let observer: IntersectionObserver | null = null

    const update = () => setVisible(scrolledEnough && !footerVisible)

    const onScroll = () => {
      scrolledEnough = window.scrollY > 420
      update()
    }

    // Attache l'observer au footer s'il est present. Si le footer n'est pas
    // encore dans le DOM au mount (HMR, lazy mount), retry au prochain rAF.
    // Sans ce retry, le CTA restait visible meme au bas de la page.
    const attach = (): boolean => {
      const footer = document.getElementById('landing-footer')
      if (!footer) return false
      observer = new IntersectionObserver(
        ([entry]) => { footerVisible = entry.isIntersecting; update() },
        { rootMargin: '0px 0px -80px 0px' },
      )
      observer.observe(footer)
      return true
    }
    if (!attach()) requestAnimationFrame(() => { attach() })

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [])

  return { visible }
}
