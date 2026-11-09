import type { ReactNode } from 'react'
import { Globe, Lock } from 'lucide-react'
import { MAX_TEXT } from '@/lib/entries'
import { MOODS, orbStyle, type MoodId } from '@/lib/moods'
import { ModalHeader } from './ui'

export type Visibility = 'private' | 'public'

interface ComposeStepProps {
  mood: MoodId | null
  text: string
  visibility: Visibility
  onMood: (m: MoodId) => void
  onText: (t: string) => void
  onVisibility: (v: Visibility) => void
  onContinue: () => void
  onClose: () => void
}

export function ComposeStep({
  mood,
  text,
  visibility,
  onMood,
  onText,
  onVisibility,
  onContinue,
  onClose,
}: ComposeStepProps) {
  const ready = mood !== null && text.trim().length > 0

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) onContinue()
      }}
    >
      <ModalHeader
        id="create-title"
        title="Capture a feeling"
        subtitle="Take a breath. There is no wrong answer."
        onClose={onClose}
      />

      <div className="space-y-6 px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">How are you feeling?</legend>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map((m) => {
              const selected = mood === m.id
              return (
                <label key={m.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="mood"
                    value={m.id}
                    checked={selected}
                    onChange={() => onMood(m.id)}
                    className="peer sr-only"
                  />
                  <span
                    className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-1 py-2.5 transition active:scale-95 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
                    style={{
                      background: selected ? m.soft : 'rgba(255,255,255,0.6)',
                      borderColor: selected ? m.deep : 'transparent',
                    }}
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full"
                      style={orbStyle(m)}
                      aria-hidden="true"
                    >
                      <m.Icon className="h-[18px] w-[18px] text-white" strokeWidth={2.4} />
                    </span>
                    <span className="text-xs font-semibold" style={{ color: selected ? m.text : '#5E5673' }}>
                      {m.label}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="entry-text" className="mb-2 block text-sm font-semibold text-ink">
            What stayed with you today?
          </label>
          <textarea
            id="entry-text"
            value={text}
            onChange={(e) => onText(e.target.value)}
            maxLength={MAX_TEXT}
            rows={4}
            placeholder="A few words are plenty."
            className="w-full resize-none rounded-2xl border-2 border-transparent bg-white/80 px-4 py-3 text-base leading-relaxed text-ink shadow-sm placeholder:text-ink-muted/70 focus:border-lavender-400 focus:outline-none"
          />
          <p className="mt-1.5 text-right text-xs tabular-nums text-ink-muted" aria-live="off">
            {text.length}/{MAX_TEXT}
          </p>
        </div>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Where should it live?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <VisibilityOption
              value="private"
              checked={visibility === 'private'}
              onSelect={onVisibility}
              icon={<Lock className="h-4 w-4" aria-hidden="true" />}
              title="Save privately"
              body="Stays in this browser only."
            />
            <VisibilityOption
              value="public"
              checked={visibility === 'public'}
              onSelect={onVisibility}
              icon={<Globe className="h-4 w-4" aria-hidden="true" />}
              title="Publish onchain"
              body="Public on Arc Testnet. You will review it first."
            />
          </div>
          {visibility === 'private' && (
            <p className="mt-3 text-xs leading-relaxed text-ink-muted text-pretty">
              Private entries are kept in this browser's storage. If you clear your browser data, they may be lost.
            </p>
          )}
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={!ready}
            aria-describedby={ready ? undefined : 'compose-hint'}
            className="flex min-h-[52px] w-full items-center justify-center rounded-full bg-ink px-6 text-base font-semibold text-cream-50 shadow-lg shadow-ink/20 transition hover:bg-ink-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            {visibility === 'private' ? 'Save privately' : 'Review before publishing'}
          </button>
          {!ready && (
            <p id="compose-hint" className="mt-2 text-center text-xs text-ink-muted">
              Choose a mood and write a few words to continue.
            </p>
          )}
        </div>
      </div>
    </form>
  )
}

function VisibilityOption({
  value,
  checked,
  onSelect,
  icon,
  title,
  body,
}: {
  value: Visibility
  checked: boolean
  onSelect: (v: Visibility) => void
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="visibility"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="peer sr-only"
      />
      <span
        className={`flex h-full min-h-[76px] flex-col gap-1 rounded-2xl border-2 px-4 py-3 transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
          checked ? 'border-lavender-400 bg-lavender-100' : 'border-transparent bg-white/60 hover:bg-white/90'
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          {icon}
          {title}
        </span>
        <span className="text-xs leading-relaxed text-ink-muted">{body}</span>
      </span>
    </label>
  )
}
