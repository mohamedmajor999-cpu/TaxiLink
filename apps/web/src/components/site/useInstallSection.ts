import { useEffect, useState } from 'react'

export function useInstallSection() {
  const [appUrl, setAppUrl] = useState('https://taxilink.fr')

  useEffect(() => { setAppUrl(window.location.origin) }, [])

  return { appUrl }
}
