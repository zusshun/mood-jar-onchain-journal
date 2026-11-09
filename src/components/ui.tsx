import type { ReactNode } from 'react'
import { AlertTriangle, Globe, Loader2, Lock, X } from 'lucide-react'
import type { EntryState } from '@/lib/entries'

export function ModalHeader({
  id,
  title,
  subtitle,
  onClose,
}: {
  id: string
  title: string
  subtitle?: ReactNode
  onClose: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6 sm:px-8 sm:pt-8">
      <div className="min-w-0">
        <h2 id={id} className="font-display text-3xl leading-tight tracking-tight text-ink text-balance">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-ink-muted text-pretty">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-lavender-100 active:scale-95"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}

const BADGES: Record<EntryState, { label: string; className: string; Icon: typeof Lock; spin?: boolean }> = {
  private: { label: 'Private, in this browser', className: 'bg-lavender-100 text-lavender-600', Icon: Lock },
  pending: { label: 'Confirming onchain', className: 'bg-peach-100 text-peach-600', Icon: Loader2, spin: true },
  published: { label: 'Published onchain', className: 'bg-[#E1F5EE] text-[#1E6B56]', Icon: Globe },
  failed: { label: 'Not published', className: 'bg-[#FDE8E8] text-[#A32626]', Icon: AlertTriangle },
}

export function StatusBadge({ state, compact = false }: { state: EntryState; compact?: boolean }) {
  const b = BADGES[state]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${b.className}`}
    >
      <b.Icon className={`h-3.5 w-3.5 ${b.spin ? 'animate-spin' : ''}`} aria-hidden="true" />
      {compact ? b.label.split(',')[0] : b.label}
    </span>
  )
}
