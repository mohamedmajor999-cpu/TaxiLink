import { useEffect, useState } from 'react'

export function useMobileStickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const footer = document.getElementById('landing-footer')
    let footerVisible = false
    let scrolledEnough = false

    const update = () => setVisible(scrolledEnough && !footerVisible)

    const onScroll = () => {
      scrolledEnough = window.scrollY > 420
      update()
    }

    const observer = footer
      ? new IntersectionObserver(
          ([entry]) => {
            footerVisible = entry.isIntersecting
            update()
          },
          { rootMargin: '0px 0px -80px 0px' },
        )
      : null

    if (observer && footer) observer.observe(footer)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [])

  return { visible }
}
