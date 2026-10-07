import type { CSSProperties } from 'react'

// Posisyon (%), laki (px), kulay, at timing ng bawat bula
const BUBBLES = [
  { left: 4, top: 12, size: 120, tint: 'sky', delay: 0, duration: 16 },
  { left: 18, top: 70, size: 56, tint: 'lavender', delay: 3, duration: 12 },
  { left: 30, top: 28, size: 28, tint: 'sky', delay: 6, duration: 10, desktopOnly: true },
  { left: 46, top: 84, size: 150, tint: 'lavender', delay: 2, duration: 18, desktopOnly: true },
  { left: 58, top: 8, size: 40, tint: 'sky', delay: 5, duration: 11 },
  { left: 68, top: 46, size: 22, tint: 'lavender', delay: 1, duration: 9, desktopOnly: true },
  { left: 80, top: 18, size: 190, tint: 'sky', delay: 4, duration: 20 },
  { left: 88, top: 66, size: 70, tint: 'lavender', delay: 7, duration: 14 },
  { left: 94, top: 40, size: 30, tint: 'sky', delay: 2, duration: 10, desktopOnly: true },
  { left: 38, top: 55, size: 18, tint: 'sky', delay: 8, duration: 9, desktopOnly: true },
  { left: 10, top: 42, size: 34, tint: 'lavender', delay: 9, duration: 13 },
  { left: 74, top: 90, size: 46, tint: 'sky', delay: 3, duration: 15 },
] as const

const TINTS = {
  sky: 'rgb(106 174 236 / 0.6)',
  lavender: 'rgb(170 150 240 / 0.6)',
}

// Pandekorasyon lang: nasa likod ng content at hindi tumatanggap ng click
export function BubbleBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {BUBBLES.map((b) => (
        <span
          key={`${b.left}-${b.top}`}
          className={`bubble absolute motion-safe:animate-float ${'desktopOnly' in b ? 'hidden md:block' : ''}`}
          style={
            {
              left: `${b.left}%`,
              top: `${b.top}%`,
              width: b.size,
              height: b.size,
              animationDelay: `-${b.delay}s`,
              animationDuration: `${b.duration}s`,
              '--bubble-tint': TINTS[b.tint],
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
