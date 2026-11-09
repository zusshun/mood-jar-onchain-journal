import { useState } from 'react'
import { entryState, formatShortDate, type Entry } from '@/lib/entries'
import { getMood, orbStyle } from '@/lib/moods'
import { StatusBadge } from './ui'

const PREVIEW_COUNT = 4

export function EntryList({ entries, onOpen }: { entries: Entry[]; onOpen: (id: string) => void }) {
  const [showAll, setShowAll] = useState(false)
  const newestFirst = [...entries].reverse()
  const shown = showAll ? newestFirst : newestFirst.slice(0, PREVIEW_COUNT)

  return (
    <section aria-labelledby="recent-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id="recent-heading" className="font-display text-2xl tracking-tight text-ink">
          Your feelings
        </h2>
        {newestFirst.length > PREVIEW_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-ink-soft underline-offset-4 hover:text-ink hover:underline"
          >
            {showAll ? 'Show fewer' : `Show all ${newestFirst.length}`}
          </button>
        )}
      </div>
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
        {shown.map((entry) => {
          const mood = getMood(entry.mood)
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onOpen(entry.id)}
                className="flex w-full items-center gap-4 rounded-3xl bg-white/70 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-[0.99]"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={orbStyle(mood)}
                  aria-hidden="true"
                >
                  <mood.Icon className="h-5 w-5 text-white" strokeWidth={2.3} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {mood.label}
                    <span className="font-normal text-ink-muted">{formatShortDate(entry.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-soft">{entry.text}</span>
                </span>
                <span className="hidden shrink-0 sm:block">
                  <StatusBadge state={entryState(entry)} compact />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
