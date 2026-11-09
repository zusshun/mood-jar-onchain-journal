import { useState } from 'react'
import { ExternalLink, RotateCcw, Trash2 } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { entryState, formatLongDate, formatTime, type Entry, type EntryState } from '@/lib/entries'
import { getMood, orbStyle } from '@/lib/moods'
import { PUBLISH_CHAIN } from '@/lib/publish'
import { Modal } from './Modal'
import { ModalHeader, StatusBadge } from './ui'

interface EntryDetailsModalProps {
  entry: Entry | null
  onClose: () => void
  onDelete: (id: string) => void
  onRetry: (entry: Entry) => void
}

const STATE_COPY: Record<EntryState, string> = {
  private: 'Saved only in this browser. It may be lost if you clear your browser data.',
  pending:
    'Your transaction was sent and is waiting for the network to confirm it. This entry will be marked as published once it is confirmed.',
  published:
    'This entry is public on Arc Testnet and may remain accessible permanently, even if you remove it from this browser.',
  failed:
    'The transaction did not go through, so this entry is not published. It is still saved in this browser. Transaction data can remain visible on the explorer.',
}

export function EntryDetailsModal({ entry, onClose, onDelete, onRetry }: EntryDetailsModalProps) {
  return (
    <Modal open={entry !== null} onClose={onClose} labelledBy="details-title">
      {entry && <Details entry={entry} onClose={onClose} onDelete={onDelete} onRetry={onRetry} />}
    </Modal>
  )
}

function Details({ entry, onClose, onDelete, onRetry }: Omit<EntryDetailsModalProps, 'entry'> & { entry: Entry }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [openedAt] = useState(() => Date.now())
  const mood = getMood(entry.mood)
  const state = entryState(entry)
  const chainId = entry.chainId ?? PUBLISH_CHAIN.id
  const txUrl = entry.txHash ? buildTxExplorerUrl(chainId, entry.txHash) : null
  const slow = state === 'pending' && openedAt - entry.createdAt > 3 * 60 * 1000

  const txStatus = state === 'published' ? 'Confirmed' : state === 'failed' ? 'Failed' : 'Pending'

  return (
    <div>
      <ModalHeader
        id="details-title"
        title={mood.label}
        subtitle={
          <time dateTime={new Date(entry.createdAt).toISOString()}>
            {formatLongDate(entry.createdAt)} at {formatTime(entry.createdAt)}
          </time>
        }
        onClose={onClose}
      />

      <div className="space-y-5 px-6 pb-6 pt-3 sm:px-8 sm:pb-8">
        <div className="flex justify-center py-1">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={orbStyle(mood)}
            aria-hidden="true"
          >
            <mood.Icon className="h-8 w-8 text-white/90" strokeWidth={2.2} />
          </span>
        </div>

        <blockquote className="m-0 rounded-3xl bg-white/80 px-5 py-4 font-display text-xl leading-relaxed text-ink">
          <p className="m-0 whitespace-pre-wrap break-words text-pretty">{entry.text}</p>
        </blockquote>

        <section aria-labelledby="visibility-heading" className="space-y-3 rounded-3xl bg-cream-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="visibility-heading" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Visibility
            </h3>
            <StatusBadge state={state} />
          </div>
          <p className="text-sm leading-relaxed text-ink-soft text-pretty">{STATE_COPY[state]}</p>
          {slow && (
            <p className="text-sm leading-relaxed text-ink-soft">
              This is taking longer than usual. You can follow it on the explorer.
            </p>
          )}

          {entry.txHash && txUrl && (
            <dl className="m-0 space-y-1.5 border-t border-cream-300/80 pt-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Transaction status</dt>
                <dd className="m-0 font-semibold text-ink">{txStatus}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Network</dt>
                <dd className="m-0 text-ink">{PUBLISH_CHAIN.name}</dd>
              </div>
              <div className="pt-1.5">
                <a
                  href={txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink shadow-sm transition hover:bg-lavender-100"
                >
                  View transaction on explorer
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
                <p className="mt-2 break-all font-mono text-xs text-ink-muted">{entry.txHash}</p>
              </div>
            </dl>
          )}
        </section>

        {state === 'failed' && (
          <button
            type="button"
            onClick={() => onRetry(entry)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-cream-50 shadow-lg shadow-ink/20 transition hover:bg-ink-soft active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try publishing again
          </button>
        )}

        <div className="flex flex-col items-center gap-2">
          {confirmDelete ? (
            <div role="group" aria-label="Confirm removal" className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                className="min-h-[44px] rounded-full bg-[#FDE8E8] px-5 text-sm font-semibold text-[#A32626] transition hover:bg-[#fbd5d5]"
              >
                Yes, remove it
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] rounded-full px-5 text-sm font-semibold text-ink-soft hover:underline"
              >
                Keep it
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-soft transition hover:bg-white/70 hover:text-ink"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove from this browser
            </button>
          )}
          {entry.visibility === 'public' && (
            <p className="text-center text-xs text-ink-muted">Removing it here does not erase the onchain record.</p>
          )}
        </div>
      </div>
    </div>
  )
}
