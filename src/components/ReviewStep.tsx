import { useState, type ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { useModal } from 'connectkit'
import { AlertTriangle, Info, Loader2, ShieldAlert } from 'lucide-react'
import { formatLongDate, formatTime } from '@/lib/entries'
import { getMood, orbStyle } from '@/lib/moods'
import {
  PUBLISH_CHAIN,
  hasBrowserWallet,
  payloadJson,
  type PublishDraft,
  type PublishFailure,
  type PublishPhase,
} from '@/lib/publish'
import { ModalHeader } from './ui'

interface ReviewStepProps {
  draft: PublishDraft
  phase: PublishPhase
  isRetry: boolean
  onPublish: () => void
  onBack: () => void
  onSavePrivately: () => void
  onClose: () => void
}

const FAILURE_COPY: Record<PublishFailure, string> = {
  rejected:
    "You closed the wallet request, so nothing was published. Your entry is still here whenever you're ready.",
  funds:
    'Your wallet does not have enough USDC for the network fee. Use "Get test USDC" in the sidebar, then try again.',
  switch: 'We could not switch your wallet to Arc Testnet. Switch networks in your wallet, then try again.',
  unknown: 'Something went wrong before the entry was sent. Nothing was published. Please try again.',
}

const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

export function ReviewStep({ draft, phase, isRetry, onPublish, onBack, onSavePrivately, onClose }: ReviewStepProps) {
  const { isConnected, address, chainId } = useAccount()
  const { setOpen } = useModal()
  const [understood, setUnderstood] = useState(false)
  const mood = getMood(draft.mood)
  const walletAvailable = hasBrowserWallet()
  const busy = phase.kind === 'switching' || phase.kind === 'signing'
  const wrongChain = isConnected && chainId !== PUBLISH_CHAIN.id

  let label = 'Publish onchain'
  if (phase.kind === 'switching') label = 'Switching network…'
  else if (phase.kind === 'signing') label = 'Confirm in your wallet…'
  else if (!isConnected) label = 'Connect wallet to publish'
  else if (phase.kind === 'failed') label = 'Try again'
  else if (wrongChain) label = `Switch to ${PUBLISH_CHAIN.name} and publish`

  const onPrimary = () => (isConnected ? onPublish() : setOpen(true))
  const disabled = !walletAvailable || !understood || busy

  return (
    <div>
      <ModalHeader
        id="create-title"
        title="This will become public"
        subtitle="Take a moment to read exactly what will be published."
        onClose={onClose}
      />

      <div className="space-y-5 px-6 pb-6 pt-3 sm:px-8 sm:pb-8">
        {!walletAvailable && (
          <div className="flex gap-3 rounded-2xl bg-lavender-100 p-4 text-sm leading-relaxed text-ink-soft" role="note">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-lavender-600" aria-hidden="true" />
            <p>
              <strong className="font-semibold text-ink">Demo mode.</strong> No browser wallet was found, so onchain
              publishing is not available here. Install a wallet to publish, or save this entry privately.
            </p>
          </div>
        )}

        <dl className="divide-y divide-cream-300/70 overflow-hidden rounded-2xl bg-white/80 text-sm">
          <Row term="Mood">
            <span className="flex items-center gap-2 font-semibold" style={{ color: mood.text }}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={orbStyle(mood)}>
                <mood.Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.4} aria-hidden="true" />
              </span>
              {mood.label}
            </span>
          </Row>
          <Row term="Your words">
            <span className="block whitespace-pre-wrap break-words text-ink">“{draft.text}”</span>
          </Row>
          <Row term="Date and time">
            <span className="text-ink">
              {formatLongDate(draft.createdAt)}, {formatTime(draft.createdAt)}
            </span>
          </Row>
          <Row term="Sent from">
            <span className="text-ink">
              Your wallet address{isConnected && address ? ` (${shortAddress(address)})` : ''}, visible to everyone
            </span>
          </Row>
        </dl>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Exact data written onchain
          </p>
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-ink px-4 py-3 font-mono text-xs leading-relaxed text-cream-100">
            {payloadJson(draft)}
          </pre>
        </div>

        <div className="flex gap-3 rounded-2xl bg-peach-100 p-4 text-sm leading-relaxed text-ink-soft" role="note">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-peach-600" aria-hidden="true" />
          <p>
            Onchain records are public and may remain accessible permanently. They cannot be edited or removed, even if
            you delete this entry from your browser. Publishing costs a small network fee paid in USDC on{' '}
            {PUBLISH_CHAIN.name}.
          </p>
        </div>

        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#3B3350]"
          />
          I understand this will be public and may remain accessible permanently.
        </label>

        {phase.kind === 'failed' && (
          <div
            role="alert"
            className={`flex gap-3 rounded-2xl p-4 text-sm leading-relaxed ${
              phase.reason === 'rejected' ? 'bg-lavender-100 text-ink-soft' : 'bg-[#FDE8E8] text-[#7D1D1D]'
            }`}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>{FAILURE_COPY[phase.reason]}</p>
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={onPrimary}
            disabled={disabled}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-semibold text-cream-50 shadow-lg shadow-ink/20 transition hover:bg-ink-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {label}
          </button>
          {!understood && walletAvailable && (
            <p className="text-center text-xs text-ink-muted">Tick the box above to continue.</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-2">
            {isRetry ? (
              <GhostButton onClick={onClose}>Cancel</GhostButton>
            ) : (
              <>
                <GhostButton onClick={onBack}>Edit entry</GhostButton>
                <span className="text-ink-muted" aria-hidden="true">
                  ·
                </span>
                <GhostButton onClick={onSavePrivately}>Save privately instead</GhostButton>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[7.5rem_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">{term}</dt>
      <dd className="m-0 min-w-0">{children}</dd>
    </div>
  )
}

function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[44px] rounded-full px-3 text-sm font-semibold text-ink-soft underline-offset-4 transition hover:text-ink hover:underline"
    >
      {children}
    </button>
  )
}
