import { useCallback, useEffect, useRef, useState } from 'react'
import { isMoodId, type MoodId } from './moods'

const STORAGE_KEY = 'mood-jar:entries:v1'

export const MAX_TEXT = 280

export type PublishStatus = 'pending' | 'confirmed' | 'failed'

export interface Entry {
  id: string
  mood: MoodId
  text: string
  /** Unix ms */
  createdAt: number
  visibility: 'private' | 'public'
  txHash?: `0x${string}`
  chainId?: number
  publishStatus?: PublishStatus
}

/** What the visitor sees as the entry's state. */
export type EntryState = 'private' | 'pending' | 'published' | 'failed'

export function entryState(e: Entry): EntryState {
  if (e.visibility === 'private') return 'private'
  if (e.publishStatus === 'confirmed') return 'published'
  if (e.publishStatus === 'failed') return 'failed'
  return 'pending'
}

function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    isMoodId(v.mood) &&
    typeof v.text === 'string' &&
    typeof v.createdAt === 'number' &&
    (v.visibility === 'private' || v.visibility === 'public')
  )
}

function readStorage(): Entry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isEntry) : []
  } catch {
    return []
  }
}

function writeStorage(entries: Entry[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function canWrite(): boolean {
  try {
    const key = 'mood-jar:probe'
    window.localStorage.setItem(key, '1')
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(readStorage)
  const [storageOk, setStorageOk] = useState<boolean>(canWrite)
  const latest = useRef(entries)

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      const next = readStorage()
      latest.current = next
      setEntries(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = useCallback((change: (prev: Entry[]) => Entry[]) => {
    const next = change(latest.current)
    latest.current = next
    setEntries(next)
    setStorageOk(writeStorage(next))
  }, [])

  const add = useCallback(
    (entry: Entry) => commit((prev) => [...prev, entry].sort((a, b) => a.createdAt - b.createdAt)),
    [commit],
  )

  const update = useCallback(
    (id: string, patch: Partial<Entry>) => commit((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [commit],
  )

  const remove = useCallback((id: string) => commit((prev) => prev.filter((e) => e.id !== id)), [commit])

  return { entries, storageOk, add, update, remove }
}

const dateFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })

export const formatLongDate = (ms: number) => dateFmt.format(ms)
export const formatShortDate = (ms: number) => shortFmt.format(ms)
export const formatTime = (ms: number) => timeFmt.format(ms)
