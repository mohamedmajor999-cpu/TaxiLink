import { useState, useEffect } from 'react'

export function useDownloadPage() {
  const [appUrl, setAppUrl]   = useState('https://taxilink-pro.app')
  const [activeOs, setActiveOs] = useState<'ios' | 'android'>('ios')

  useEffect(() => { setAppUrl(window.location.origin) }, [])

  return { appUrl, activeOs, setActiveOs }
}
