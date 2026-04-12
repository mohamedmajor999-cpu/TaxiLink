interface IconProps {
  name: string
  size?: number
  className?: string
}

export function Icon({ name, size = 22, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
