interface Props {
  gmapsHref: string | null
  wazeHref: string | null
}

export function NavigationButtons({ gmapsHref, wazeHref }: Props) {
  if (!gmapsHref && !wazeHref) return null
  return (
    <div className="grid grid-cols-2 gap-3 mb-3">
      {gmapsHref && (
        <a
          href={gmapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group h-14 rounded-2xl bg-paper border border-warm-200 text-ink text-[14px] font-semibold inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:border-[#4285F4]/40 transition-all"
        >
          <GoogleMapsPin />
          <span>Google Maps</span>
        </a>
      )}
      {wazeHref && (
        <a
          href={wazeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="h-14 rounded-2xl bg-[#33CCFF] text-ink text-[14px] font-semibold inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:brightness-95 transition-all"
        >
          <WazeIcon />
          <span>Waze</span>
        </a>
      )}
    </div>
  )
}

function GoogleMapsPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="#EA4335" />
      <circle cx="12" cy="10" r="3" fill="#FFFFFF" />
    </svg>
  )
}

function WazeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3c-4.97 0-9 3.58-9 8 0 1.76.64 3.39 1.72 4.72-.16.56-.47 1.3-.97 1.8-.2.2-.13.54.15.62 1.46.42 3.13-.11 4.05-.56A9.73 9.73 0 0012 19c4.97 0 9-3.58 9-8s-4.03-8-9-8z" stroke="#0A0A0A" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="9" cy="10" r="1" fill="#0A0A0A" />
      <circle cx="15" cy="10" r="1" fill="#0A0A0A" />
    </svg>
  )
}
