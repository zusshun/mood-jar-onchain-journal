import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useSwitchChain } from 'wagmi'
import { arcTestnet } from 'viem/chains'
import { toHex, type Hex } from 'viem'
import type { MoodId } from './moods'

export const PUBLISH_CHAIN = arcTestnet

export interface PublishDraft {
  mood: MoodId
  text: string
  /** Unix ms, frozen when the preview is shown so the preview matches what is sent. */
  createdAt: number
  /** Set when retrying a failed entry. */
  retryId?: string
}

/** The exact text that is written onchain. */
export function payloadJson(draft: PublishDraft): string {
  return JSON.stringify({
    app: 'mood-jar',
    v: 1,
    mood: draft.mood,
    text: draft.text,
    createdAt: new Date(draft.createdAt).toISOString(),
  })
}

export function hasBrowserWallet(): boolean {
  return typeof window !== 'undefined' && Boolean((window as unknown as { ethereum?: unknown }).ethereum)
}

export type PublishFailure = 'rejected' | 'funds' | 'switch' | 'unknown'

export type PublishPhase =
  | { kind: 'idle' }
  | { kind: 'switching' }
  | { kind: 'signing' }
  | { kind: 'failed'; reason: PublishFailure }

function errorText(error: unknown): string {
  const parts: string[] = []
  let cur: unknown = error
  for (let i = 0; i < 6 && cur && typeof cur === 'object'; i++) {
    const e = cur as { name?: unknown; message?: unknown; shortMessage?: unknown; cause?: unknown }
    if (typeof e.name === 'string') parts.push(e.name)
    if (typeof e.shortMessage === 'string') parts.push(e.shortMessage)
    if (typeof e.message === 'string') parts.push(e.message)
    cur = e.cause
  }
  return parts.join(' | ')
}

function errorCode(error: unknown): number | undefined {
  let cur: unknown = error
  for (let i = 0; i < 6 && cur && typeof cur === 'object'; i++) {
    const e = cur as { code?: unknown; cause?: unknown }
    if (typeof e.code === 'number') return e.code
    cur = e.cause
  }
  return undefined
}

export function classifyFailure(error: unknown, stage: 'switching' | 'signing'): PublishFailure {
  const text = errorText(error)
  if (errorCode(error) === 4001 || /user rejected|user denied|rejected the request|UserRejected/i.test(text)) {
    return 'rejected'
  }
  if (stage === 'switching') return 'switch'
  if (/insufficient funds|exceeds the balance|insufficient balance|exceeds balance/i.test(text)) return 'funds'
  return 'unknown'
}

/**
 * Sends the entry as a zero-value transaction to the sender's own address,
 * with the entry JSON as transaction data. Lives at the app level so a
 * wallet request keeps going even if the dialog is dismissed.
 */
export function usePublisher(onSubmitted: (draft: PublishDraft, hash: Hex) => void) {
  const { address, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()
  const [phase, setPhase] = useState<PublishPhase>({ kind: 'idle' })
  const busy = useRef(false)
  const submitted = useRef(onSubmitted)

  useEffect(() => {
    submitted.current = onSubmitted
  }, [onSubmitted])

  const publish = useCallback(
    async (draft: PublishDraft) => {
      if (!address || busy.current) return
      busy.current = true
      let stage: 'switching' | 'signing' = 'signing'
      try {
        if (chainId !== PUBLISH_CHAIN.id) {
          stage = 'switching'
          setPhase({ kind: 'switching' })
          await switchChainAsync({ chainId: PUBLISH_CHAIN.id })
        }
        stage = 'signing'
        setPhase({ kind: 'signing' })
        const hash = await sendTransactionAsync({
          chainId: PUBLISH_CHAIN.id,
          to: address,
          value: 0n,
          data: toHex(payloadJson(draft)),
        })
        setPhase({ kind: 'idle' })
        submitted.current(draft, hash)
      } catch (error) {
        setPhase({ kind: 'failed', reason: classifyFailure(error, stage) })
      } finally {
        busy.current = false
      }
    },
    [address, chainId, sendTransactionAsync, switchChainAsync],
  )

  const reset = useCallback(() => setPhase({ kind: 'idle' }), [])

  return { phase, publish, reset }
}

interface Watchable {
  id: string
  txHash?: Hex
  pending: boolean
}

/** Polls the chain for receipts of pending entries. Only a mined receipt changes an entry's status. */
export function usePendingWatcher(items: Watchable[], onResolved: (id: string, success: boolean) => void) {
  const client = usePublicClient({ chainId: PUBLISH_CHAIN.id })
  const itemsRef = useRef(items)
  const resolvedRef = useRef(onResolved)

  useEffect(() => {
    itemsRef.current = items
    resolvedRef.current = onResolved
  }, [items, onResolved])

  const watchKey = items
    .filter((i) => i.pending && i.txHash)
    .map((i) => i.txHash)
    .join(',')

  useEffect(() => {
    if (!client || !watchKey) return
    let cancelled = false
    let running = false
    const check = async () => {
      if (running) return
      running = true
      try {
        for (const item of itemsRef.current) {
          if (!item.pending || !item.txHash) continue
          try {
            const receipt = await client.getTransactionReceipt({ hash: item.txHash })
            if (cancelled) return
            resolvedRef.current(item.id, receipt.status === 'success')
          } catch {
            // Not mined yet (or a transient RPC error): try again on the next tick.
          }
        }
      } finally {
        running = false
      }
    }
    void check()
    const timer = setInterval(() => void check(), 4000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [client, watchKey])
}
