import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Globe, Heart, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Hex } from 'viem'
import { Jar } from '@/components/Jar'
import { CreateEntryModal } from '@/components/CreateEntryModal'
import { EntryDetailsModal } from '@/components/EntryDetailsModal'
import { EntryList } from '@/components/EntryList'
import { entryState, newId, useEntries, type Entry } from '@/lib/entries'
import { JAR_CAPACITY } from '@/lib/layout'
import type { MoodId } from '@/lib/moods'
import { PUBLISH_CHAIN, usePendingWatcher, usePublisher, type PublishDraft } from '@/lib/publish'

type View = { kind: 'none' } | { kind: 'create'; retry: Entry | null } | { kind: 'details'; id: string }

export default function App() {
  const { entries, storageOk, add, update, remove } = useEntries()
  const [view, setView] = useState<View>({ kind: 'none' })
  const [fallingId, setFallingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const reduce = useReducedMotion()
  const jarRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const celebrate = useCallback(
    (id: string | null, message: string) => {
      setFallingId(id)
      setNotice(message)
      timers.current.push(
        window.setTimeout(() => setFallingId(null), 5000),
        window.setTimeout(() => setNotice(null), 6500),
      )
      jarRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
    },
    [reduce],
  )

  const handleSavePrivate = useCallback(
    (draft: { mood: MoodId; text: string }) => {
      const entry: Entry = { id: newId(), mood: draft.mood, text: draft.text, createdAt: Date.now(), visibility: 'private' }
      add(entry)
      setView({ kind: 'none' })
      celebrate(entry.id, 'Your feeling has a home.')
    },
    [add, celebrate],
  )

  const handleSubmitted = useCallback(
    (draft: PublishDraft, hash: Hex) => {
      const chain = { txHash: hash, chainId: PUBLISH_CHAIN.id, publishStatus: 'pending' as const }
      if (draft.retryId) {
        update(draft.retryId, chain)
        setView({ kind: 'details', id: draft.retryId })
        celebrate(null, 'Sent again. Waiting for the network to confirm.')
        return
      }
      const entry: Entry = {
        id: newId(),
        mood: draft.mood,
        text: draft.text,
        createdAt: draft.createdAt,
        visibility: 'public',
        ...chain,
      }
      add(entry)
      setView({ kind: 'none' })
      celebrate(entry.id, 'Your feeling has a home. It will show as published once the network confirms it.')
    },
    [add, update, celebrate],
  )

  const publisher = usePublisher(handleSubmitted)

  const handleResolved = useCallback(
    (id: string, success: boolean) => {
      update(id, { publishStatus: success ? 'confirmed' : 'failed' })
      if (success) toast.success('Your feeling is now published onchain.')
      else toast.error('The transaction did not go through. Your entry is still saved in this browser.')
    },
    [update],
  )

  const watchItems = useMemo(
    () => entries.map((e) => ({ id: e.id, txHash: e.txHash, pending: entryState(e) === 'pending' })),
    [entries],
  )
  usePendingWatcher(watchItems, handleResolved)

  const openCreate = () => {
    publisher.reset()
    setView({ kind: 'create', retry: null })
  }

  const detailsEntry = view.kind === 'details' ? (entries.find((e) => e.id === view.id) ?? null) : null
  const closeView = () => setView({ kind: 'none' })
  const count = entries.length

  return (
    <div className="min-h-dvh text-ink">
      <div className="mj-backdrop" aria-hidden="true" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 rounded-full"
            style={{
              background: 'radial-gradient(circle at 32% 26%, #fff 0%, #CDBBF1 45%, #F9A682 100%)',
              boxShadow: 'inset -3px -4px 8px rgba(116,88,186,0.35), 0 4px 10px rgba(179,156,230,0.5)',
            }}
            aria-hidden="true"
          />
          <span className="font-display text-xl tracking-tight">Mood Jar</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 pb-32 pt-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-x-20 lg:gap-y-8 lg:pt-10">
        <section className="lg:self-end">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-lavender-600">
              A gentle mood journal
            </p>
            <h1 className="font-display text-5xl leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">
              A little space for how you feel.
            </h1>
            <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-ink-soft text-pretty">
              Each feeling becomes a small, glowing orb. Keep it to yourself, or share it onchain when you choose.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex min-h-[56px] items-center gap-2.5 rounded-full bg-ink px-7 text-base font-semibold text-cream-50 shadow-xl shadow-ink/25 transition hover:bg-ink-soft active:scale-[0.98]"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
                Capture a feeling
              </button>
              {count > 0 && (
                <p className="text-sm text-ink-muted">
                  <span className="font-semibold tabular-nums text-ink">{count}</span>{' '}
                  {count === 1 ? 'feeling' : 'feelings'} in your jar
                </p>
              )}
            </div>
          </motion.div>
        </section>

        <section className="lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Your mood jar">
          <div ref={jarRef}>
            <Jar entries={entries} fallingId={fallingId} onOpen={(id) => setView({ kind: 'details', id })} />
          </div>
          {count > JAR_CAPACITY && (
            <p className="mt-3 text-center text-xs text-ink-muted">
              The jar shows your {JAR_CAPACITY} most recent feelings. All of them are listed below.
            </p>
          )}
          <div className="mt-4 flex min-h-[56px] justify-center" role="status" aria-live="polite">
            <AnimatePresence>
              {notice && (
                <motion.p
                  key={notice}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: reduce ? 0 : 0.9, duration: 0.3 }}
                  className="flex max-w-sm items-center gap-2.5 rounded-full bg-white/90 px-5 py-3 text-center font-display text-lg leading-snug text-ink shadow-md"
                >
                  <Heart className="h-4 w-4 shrink-0 text-peach-400" aria-hidden="true" />
                  {notice}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="space-y-3 lg:self-start" aria-label="About your data">
          <div className="space-y-4 rounded-3xl bg-white/60 p-5 shadow-sm sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Where your feelings live
            </h2>
            <div className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-lavender-600" aria-hidden="true" />
              <p>
                <strong className="font-semibold text-ink">Private by default.</strong> Private entries stay in this
                browser. If you clear your browser data, they may be lost.
              </p>
            </div>
            <div className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-peach-600" aria-hidden="true" />
              <p>
                <strong className="font-semibold text-ink">Publishing is your choice.</strong> Onchain entries are
                public on {PUBLISH_CHAIN.name} and may remain accessible permanently. A wallet is only needed then.
              </p>
            </div>
          </div>
          {!storageOk && (
            <div role="alert" className="flex gap-3 rounded-3xl bg-[#FDE8E8] p-4 text-sm leading-relaxed text-[#7D1D1D]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>Your browser is blocking storage, so new entries may disappear when you close this tab.</p>
            </div>
          )}
        </section>

        {count > 0 && (
          <div className="lg:col-span-2">
            <EntryList entries={entries} onOpen={(id) => setView({ kind: 'details', id })} />
          </div>
        )}
      </main>

      <CreateEntryModal
        open={view.kind === 'create'}
        retry={view.kind === 'create' ? view.retry : null}
        phase={publisher.phase}
        onClose={closeView}
        onSavePrivate={handleSavePrivate}
        onPublish={(draft) => void publisher.publish(draft)}
        onResetPhase={publisher.reset}
      />
      <EntryDetailsModal
        entry={detailsEntry}
        onClose={closeView}
        onDelete={(id) => {
          remove(id)
          closeView()
        }}
        onRetry={(entry) => {
          publisher.reset()
          setView({ kind: 'create', retry: entry })
        }}
      />
    </div>
  )
}
