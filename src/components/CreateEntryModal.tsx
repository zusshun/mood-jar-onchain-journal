import { useState } from 'react'
import type { Entry } from '@/lib/entries'
import type { MoodId } from '@/lib/moods'
import type { PublishDraft, PublishPhase } from '@/lib/publish'
import { ComposeStep, type Visibility } from './ComposeStep'
import { ReviewStep } from './ReviewStep'
import { Modal } from './Modal'

interface CreateEntryModalProps {
  open: boolean
  /** A failed entry being re-published */
  retry: Entry | null
  phase: PublishPhase
  onClose: () => void
  onSavePrivate: (draft: { mood: MoodId; text: string }) => void
  onPublish: (draft: PublishDraft) => void
  onResetPhase: () => void
}

export function CreateEntryModal({ open, onClose, ...rest }: CreateEntryModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="create-title">
      <CreateFlow onClose={onClose} {...rest} />
    </Modal>
  )
}

function CreateFlow({
  retry,
  phase,
  onClose,
  onSavePrivate,
  onPublish,
  onResetPhase,
}: Omit<CreateEntryModalProps, 'open'>) {
  const [mood, setMood] = useState<MoodId | null>(retry?.mood ?? null)
  const [text, setText] = useState(retry?.text ?? '')
  const [visibility, setVisibility] = useState<Visibility>(retry ? 'public' : 'private')
  const [step, setStep] = useState<'compose' | 'review'>(retry ? 'review' : 'compose')
  const [createdAt, setCreatedAt] = useState<number>(retry?.createdAt ?? 0)

  const trimmed = text.trim()

  const handleContinue = () => {
    if (!mood || !trimmed) return
    if (visibility === 'private') {
      onSavePrivate({ mood, text: trimmed })
      return
    }
    // Freeze the timestamp so the preview matches exactly what is published.
    setCreatedAt(Date.now())
    onResetPhase()
    setStep('review')
  }

  if (step === 'review' && mood) {
    const draft: PublishDraft = { mood, text: trimmed, createdAt, retryId: retry?.id }
    return (
      <ReviewStep
        draft={draft}
        phase={phase}
        isRetry={Boolean(retry)}
        onPublish={() => onPublish(draft)}
        onBack={() => {
          onResetPhase()
          setStep('compose')
        }}
        onSavePrivately={() => onSavePrivate({ mood, text: trimmed })}
        onClose={onClose}
      />
    )
  }

  return (
    <ComposeStep
      mood={mood}
      text={text}
      visibility={visibility}
      onMood={setMood}
      onText={setText}
      onVisibility={setVisibility}
      onContinue={handleContinue}
      onClose={onClose}
    />
  )
}
