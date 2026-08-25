type IconProps = {
  size?: number
  className?: string
}

export function IconBack({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M15.5 5.5 8.5 12l7 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconDots({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="19" cy="12" r="1.7" />
    </svg>
  )
}

export function IconCheck({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSmile({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="10.2" r="1" fill="currentColor" />
      <circle cx="15" cy="10.2" r="1" fill="currentColor" />
      <path d="M8.4 14.2c.9 1.4 2.2 2.1 3.6 2.1s2.7-.7 3.6-2.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function IconChat({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5.5 18.5 7.2 16H18a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 18 5H6a2.5 2.5 0 0 0-2.5 2.5v10.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconShare({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M8.5 10.5H7A2.5 2.5 0 0 0 4.5 13v5A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-5a2.5 2.5 0 0 0-2.5-2.5h-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 14.5V4.5M12 4.5 8.8 7.7M12 4.5l3.2 3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconGrid({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      {[5.5, 12, 18.5].flatMap((y) =>
        [5.5, 12, 18.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.45" />),
      )}
    </svg>
  )
}

export function IconPlus({ size = 26, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5.5v13M5.5 12h13" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function IconFlame({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="flame" x1="8" y1="22" x2="16" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4D2E" />
          <stop offset="0.55" stopColor="#FF8A1F" />
          <stop offset="1" stopColor="#FFC84A" />
        </linearGradient>
      </defs>
      <path
        fill="url(#flame)"
        d="M12.2 2.4c.2 3.2-1.6 5-3.3 6.7-1.8 1.8-3.4 3.5-3.4 6.4 0 3.6 2.9 6.1 6.5 6.1s6.5-2.5 6.5-6.3c0-2.4-1.1-4.1-2.2-5.6-.4 2.1-1.6 3.2-1.6 3.2s3.3-5.3-2.5-10.5Z"
      />
    </svg>
  )
}

export function IconSignal({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 12" fill="currentColor" className={className} aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="0.6" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="0.6" />
      <rect x="10" y="3" width="3" height="9" rx="0.6" />
      <rect x="15" y="0" width="3" height="12" rx="0.6" opacity="0.35" />
    </svg>
  )
}

export function IconWifi({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 12" fill="none" className={className} aria-hidden>
      <path d="M1.2 4.2c3.8-3.6 9.8-3.6 13.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3.6 6.6c2.5-2.3 6.3-2.3 8.8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.1 9c1.1-1 2.7-1 3.8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconBattery({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={14} viewBox="0 0 27 13" fill="none" className={className} aria-hidden>
      <rect x="0.6" y="0.6" width="22.8" height="11.8" rx="2.6" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      <rect x="2.2" y="2.3" width="18" height="8.4" rx="1.4" fill="currentColor" />
      <path d="M24.6 4.2c.8.5.8 4.1 0 4.6V4.2Z" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

export function IconChevron({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9 5.5 16 12l-7 6.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconRepeat({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 7h8.5a4 4 0 0 1 0 8H14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M9.5 4.5 7 7l2.5 2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 17H8.5a4 4 0 0 1 0-8H10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M14.5 19.5 17 17l-2.5-2.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconFlag({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 21V4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M6 4.5h11.2l-2.1 3.7 2.1 3.8H6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconClose({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  )
}
