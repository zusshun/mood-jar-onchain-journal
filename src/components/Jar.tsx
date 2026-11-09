import { motion, useReducedMotion } from 'framer-motion'
import { JAR_CAPACITY, JAR_H, JAR_W, layoutOrbs } from '@/lib/layout'
import { formatShortDate, type Entry } from '@/lib/entries'
import { getMood, orbStyle } from '@/lib/moods'

const JAR_PATH =
  'M92 44 L228 44 L228 66 C228 84 296 92 296 140 L296 344 C296 372 276 392 248 392 L72 392 C44 392 24 372 24 344 L24 140 C24 92 92 84 92 66 Z'

interface JarProps {
  /** All entries, oldest first */
  entries: Entry[]
  /** Entry that should fall into the jar */
  fallingId: string | null
  onOpen: (id: string) => void
}

export function Jar({ entries, fallingId, onOpen }: JarProps) {
  const reduce = useReducedMotion()
  const visible = entries.slice(-JAR_CAPACITY)
  // Cheap and deterministic: at most JAR_CAPACITY orbs.
  const placements = layoutOrbs(visible.map((e) => e.id))
  const byId = new Map(placements.map((p) => [p.id, p]))

  return (
    <div className="relative mx-auto w-full max-w-[360px]" style={{ aspectRatio: `${JAR_W} / ${JAR_H}` }}>
      <svg viewBox={`0 0 ${JAR_W} ${JAR_H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="mj-glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="0.55" stopColor="#F1EBFC" stopOpacity="0.45" />
            <stop offset="1" stopColor="#FFEEE3" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <ellipse cx="160" cy="395" rx="120" ry="5" fill="#3B3350" opacity="0.12" />
        <path d={JAR_PATH} fill="url(#mj-glass)" />
      </svg>

      {entries.length === 0 && (
        <div className="pointer-events-none absolute inset-x-[16%] top-[44%] flex flex-col items-center text-center">
          <div className="mb-4 h-12 w-12 rounded-full border-2 border-dashed border-lavender-400/70" aria-hidden="true" />
          <p className="font-display text-xl leading-snug text-ink-soft text-balance">
            Your jar is waiting for its first feeling.
          </p>
        </div>
      )}

      <ul className="absolute inset-0 m-0 list-none p-0" aria-label="Feelings in your jar">
        {visible.map((entry, i) => {
          const p = byId.get(entry.id)
          if (!p) return null
          const mood = getMood(entry.mood)
          const falls = entry.id === fallingId && !reduce
          const x = `${((p.cx - p.r) / (2 * p.r)) * 100}%`
          const y = `${((p.cy - p.r) / (2 * p.r)) * 100}%`
          const startY = `${((8 - p.r) / (2 * p.r)) * 100}%`
          const label = `${mood.label} feeling from ${formatShortDate(entry.createdAt)}. Open entry.`
          return (
            <li key={entry.id} className="contents">
              <motion.button
                type="button"
                aria-label={label}
                title={`${mood.label}, ${formatShortDate(entry.createdAt)}`}
                onClick={() => onOpen(entry.id)}
                className="absolute left-0 top-0 rounded-full hover:z-10"
                style={{ width: `${((2 * p.r) / JAR_W) * 100}%`, aspectRatio: '1 / 1' }}
                initial={falls ? { x, y: startY, scale: 1, opacity: 0 } : { x, y, scale: 0.6, opacity: 0 }}
                animate={{ x, y, scale: 1, opacity: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : falls
                      ? {
                          y: { type: 'spring', stiffness: 60, damping: 9, mass: 1.1, delay: 0.35 },
                          opacity: { duration: 0.01, delay: 0.35 },
                          scale: { duration: 0 },
                        }
                      : { type: 'spring', stiffness: 220, damping: 24, delay: Math.min(i, 14) * 0.03 }
                }
                whileHover={reduce ? undefined : { scale: 1.1 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
              >
                <span
                  className="flex h-full w-full animate-bob items-center justify-center rounded-full"
                  style={{ ...orbStyle(mood), animationDelay: `${(i % 7) * -0.9}s` }}
                >
                  <mood.Icon className="h-[40%] w-[40%] text-white/80" strokeWidth={2.2} aria-hidden="true" />
                </span>
              </motion.button>
            </li>
          )
        })}
      </ul>

      <svg
        viewBox={`0 0 ${JAR_W} ${JAR_H}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path d={JAR_PATH} fill="none" stroke="#B39CE6" strokeOpacity="0.6" strokeWidth="3" strokeLinejoin="round" />
        <rect x="84" y="34" width="152" height="16" rx="8" fill="#ffffff" fillOpacity="0.6" stroke="#B39CE6" strokeOpacity="0.6" strokeWidth="2" />
        <path d="M44 150 C40 205 40 280 50 326" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="7" strokeLinecap="round" />
        <path d="M276 190 L276 252" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" />
        <circle cx="106" cy="96" r="3.5" fill="#ffffff" fillOpacity="0.9" />
      </svg>
    </div>
  )
}
