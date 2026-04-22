export function SlideIlloLongPress() {
  return (
    <svg
      viewBox="0 0 280 240"
      className="w-64 md:w-72 h-auto"
      fill="none"
      aria-hidden
    >
      <path
        d="M40 160 L40 120 Q40 108 50 105 L75 98 L95 72 Q100 65 110 65 L190 65 Q200 65 205 72 L225 98 L250 105 Q260 108 260 120 L260 160"
        stroke="#000"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="125" y="52" width="50" height="16" rx="2" fill="#FFD11A" stroke="#000" strokeWidth="2.5" />
      <text x="150" y="64" textAnchor="middle" fontWeight="800" fontSize="10" fill="#000">TAXI</text>
      <path d="M95 98 L110 78 L190 78 L205 98 Z" fill="#FFD11A" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="150" y1="78" x2="150" y2="98" stroke="#000" strokeWidth="2" />
      <rect x="40" y="125" width="220" height="8" fill="#000" />
      <circle cx="85" cy="170" r="18" fill="#fff" stroke="#000" strokeWidth="3" />
      <circle cx="85" cy="170" r="6" fill="#000" />
      <circle cx="215" cy="170" r="18" fill="#fff" stroke="#000" strokeWidth="3" />
      <circle cx="215" cy="170" r="6" fill="#000" />
      <rect x="180" y="125" width="60" height="100" rx="10" fill="#000" />
      <rect x="185" y="132" width="50" height="80" rx="4" fill="#FFD11A" />
      <circle cx="210" cy="172" r="10" fill="#000" />
      <circle cx="210" cy="172" r="18" fill="none" stroke="#000" strokeWidth="2.5" />
      <circle cx="210" cy="172" r="26" fill="none" stroke="#000" strokeWidth="2" strokeDasharray="4 4" opacity="0.4">
        <animate attributeName="r" values="22;30;22" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
