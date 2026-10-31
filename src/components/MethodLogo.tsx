import type { ReactNode } from 'react'

export function MethodLogo({ id }: { id: string }) {
  const mark = marks[id] ?? marks.bank
  return (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full" style={{ background: mark.bg }} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-5">
        {mark.icon}
      </svg>
    </span>
  )
}

const marks: Record<string, { bg: string; icon: ReactNode }> = {
  fps: {
    bg: '#e4002b',
    icon: <path d="M13 3 6 13h5l-1 8 8-11h-5l0-7Z" fill="#fff" />,
  },
  sepa: {
    bg: '#003399',
    icon: <text x="12" y="16" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fc0">€</text>,
  },
  ach: {
    bg: '#0b3a66',
    icon: <path d="M5 8h14M5 12h14M5 16h9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />,
  },
  zelle: {
    bg: '#6d1ed4',
    icon: <path d="M8 17 16 7M9 7h7v7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  chime: {
    bg: '#1ec677',
    icon: <path d="M5 15c2.2-6 11.8-6 14 0" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />,
  },
  interac: {
    bg: '#ffcc00',
    icon: <path d="M7 7h10v10H7z" fill="#e10600" />,
  },
  etransfer: {
    bg: '#5c2d91',
    icon: <path d="M6 12h10M12 7l5 5-5 5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  pix: {
    bg: '#32bcad',
    icon: <path d="m12 4-4 4 4 4-4 4 4 4 4-4-4-4 4-4-4-4Z" fill="#fff" />,
  },
  upi: {
    bg: '#097939',
    icon: <path d="M9 19V5l7 7H10" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />,
  },
  payid: {
    bg: '#ffd200',
    icon: <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#111">ID</text>,
  },
  bank: {
    bg: '#191c1f',
    icon: <path d="M4 10 12 5l8 5M6 10v7M10 10v7M14 10v7M18 10v7M4 17h16" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  apple: {
    bg: '#111',
    icon: (
      <path
        fill="#fff"
        d="M15.2 8.2c-.7.8-1.6 1.3-2.6 1.2-.1-1 .4-2 1-2.7.7-.8 1.8-1.3 2.7-1.3.1 1.1-.3 2.1-1.1 2.8ZM16.4 9.6c-1.4-.1-2.6.8-3.3.8s-1.7-.7-2.8-.7c-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.1 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.7 1.8-1.1 2.5-2.1c.8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.3 0-2.1 1.7-3.1 1.8-3.2-.9-1.4-2.4-1.6-2.7-1.6Z"
      />
    ),
  },
  google: {
    bg: '#fff',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" fill="#fff" stroke="#e2e4e6" />
        <path d="M12 7a5 5 0 1 0 4.6 3H12V7Z" fill="#4285F4" />
        <path d="M12 17a5 5 0 0 1-4.3-2.5l2.2-1.6A2.4 2.4 0 0 0 12 14.4c.6 0 1.1-.2 1.5-.5l2.1 1.6A5 5 0 0 1 12 17Z" fill="#34A853" />
        <path d="M7.7 14.5A5 5 0 0 1 7 12c0-.9.2-1.7.7-2.5l2.2 1.6a2.4 2.4 0 0 0 0 1.8l-2.2 1.6Z" fill="#FBBC05" />
        <path d="M16.6 10H12v2.4h2.6a2.3 2.3 0 0 1-1 1.5l2.1 1.6A5 5 0 0 0 17 12c0-.7-.1-1.3-.4-2Z" fill="#EA4335" />
      </>
    ),
  },
  card: {
    bg: '#635bff',
    icon: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" fill="#fff" />
        <rect x="3" y="9" width="18" height="2.4" fill="#635bff" />
      </>
    ),
  },
  crypto: {
    bg: '#f7931a',
    icon: <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">₿</text>,
  },
}
