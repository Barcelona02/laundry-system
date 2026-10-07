import { useId } from 'react'

// Logo: washing machine na may mga bula sa likod
export function Logo() {
  // Natatanging id para sa gradient (dalawa ang logo sa layout: desktop at mobile)
  const gradientId = useId()

  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="size-10 shrink-0 drop-shadow-[0_6px_14px_rgb(47_120_200/0.35)]" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9dcaf4" />
            <stop offset="1" stopColor="#aa96f0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill={`url(#${gradientId})`} />

        {/* Mga bula */}
        <circle cx="7" cy="9" r="3.2" fill="#fff" fillOpacity="0.35" />
        <circle cx="33.5" cy="7" r="2.2" fill="#fff" fillOpacity="0.45" />
        <circle cx="34" cy="31" r="3.6" fill="#fff" fillOpacity="0.3" />
        <circle cx="6" cy="31.5" r="1.8" fill="#fff" fillOpacity="0.45" />
        <circle cx="8.6" cy="7.6" r="0.9" fill="#fff" fillOpacity="0.8" />
        <circle cx="35.2" cy="29.4" r="1" fill="#fff" fillOpacity="0.8" />

        {/* Washing machine */}
        <rect x="11" y="9" width="18" height="22" rx="3.5" fill="#fff" />
        <rect x="11" y="9" width="18" height="5" rx="2.5" fill="#e2effc" />
        <circle cx="14.5" cy="11.5" r="1" fill="#2f78c8" />
        <circle cx="17.5" cy="11.5" r="1" fill="#aa96f0" />
        <rect x="21.5" y="10.8" width="5" height="1.4" rx="0.7" fill="#9dcaf4" />
        <circle cx="20" cy="22.5" r="5.6" fill="#c6e0f9" stroke="#2f78c8" strokeWidth="1.6" />
        <path d="M15.6 23.2c1.6-1.4 3.2 1 4.4 0s2.8-1.4 4.4 0v1.1a4.6 4.6 0 0 1-8.8 0z" fill="#6aaeec" />
        <circle cx="18.2" cy="20.6" r="0.9" fill="#fff" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
        Laundry<span className="text-brand-600">System</span>
      </span>
    </span>
  )
}
