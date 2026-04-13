import { useState, useEffect } from 'react'

export function useInstallPage() {
  const [appUrl, setAppUrl]       = useState('https://taxilink-pro.app')
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios')

  useEffect(() => { setAppUrl(window.location.origin) }, [])

  return { appUrl, activeTab, setActiveTab }
}
