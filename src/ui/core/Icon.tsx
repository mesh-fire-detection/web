import type { ReactNode } from 'react'

export type IconName =
  | 'map'
  | 'build'
  | 'coverage'
  | 'problem'
  | 'github'
  | 'discord'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'download'
  | 'radio'
  | 'camera'
  | 'sensor'
  | 'cell'
  | 'battery'
  | 'menu'
  | 'close'
  | 'check'
  | 'alert'
  | 'chevron'

const PATHS: Record<IconName, ReactNode> = {
  map: <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3Zm0 0v15m6-12v15" />,
  build: <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.1-.6-.6-2.1 2.3-2.3a4 4 0 0 0-.3 0Z" />,
  coverage: (
    <>
      <circle cx="12" cy="18" r="2" />
      <path d="M12 16V4m-5 4a11 11 0 0 1 10 0M4.5 5a17 17 0 0 1 15 0" />
    </>
  ),
  problem: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.9-.9 1.5v.4M12 17h.01" />
    </>
  ),
  github: (
    <path
      fill="currentColor"
      stroke="none"
      d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
    />
  ),
  discord: (
    <path
      fill="currentColor"
      stroke="none"
      d="M19.3 5.6A16.6 16.6 0 0 0 15.2 4.3l-.2.4a12.4 12.4 0 0 0-5.9 0l-.2-.4a16.6 16.6 0 0 0-4.1 1.3C2 9.6 1.4 13.5 1.7 17.3A16.7 16.7 0 0 0 6.8 20l1-1.7a10.8 10.8 0 0 1-1.7-.8l.4-.3a11.9 11.9 0 0 0 10.2 0l.4.3a10.8 10.8 0 0 1-1.7.8l1 1.7a16.7 16.7 0 0 0 5.1-2.7c.4-4.4-.6-8.3-2.7-11.7ZM8.4 15c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2c0 1.1-.8 2-1.8 2Zm7.2 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2c0 1.1-.8 2-1.8 2Z"
    />
  ),
  'arrow-right': <path d="M5 12h14m-6-6 6 6-6 6" />,
  'arrow-up-right': <path d="M8 16 16 8m-6 0h6v6" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />,
  radio: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7m7-7a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8m12.8-12.8a9 9 0 0 1 0 12.8" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8h3l2-2h8l2 2h3v11H3V8Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  sensor: (
    <>
      <path d="M12 3v4m0 10v4M3 12h4m10 0h4" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  cell: <path d="M4 20V10m5 10V6m5 14V13m5 7V4" />,
  battery: (
    <>
      <rect x="2" y="8" width="17" height="9" rx="2" />
      <path d="M21 11v3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m4 12 5 5L20 6" />,
  alert: <path d="M12 4 2 20h20L12 4Zm0 6v5m0 3h.01" />,
  chevron: <path d="m8 10 4 4 4-4" />,
}

export function Icon({
  name,
  size = 16,
  label,
}: {
  name: IconName
  size?: number | undefined
  label?: string | undefined
}) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {PATHS[name]}
    </svg>
  )
}
