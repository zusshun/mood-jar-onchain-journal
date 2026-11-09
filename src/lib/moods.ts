import { CloudRain, Leaf, Moon, Sun, Wind, type LucideIcon } from 'lucide-react'

export type MoodId = 'happy' | 'calm' | 'tired' | 'anxious' | 'sad'

export interface Mood {
  id: MoodId
  label: string
  Icon: LucideIcon
  /** Main orb color */
  color: string
  /** Deeper shade for orb shading */
  deep: string
  /** Pale tint for chips and surfaces */
  soft: string
  /** Readable text color on the soft tint */
  text: string
}

export const MOODS: Mood[] = [
  { id: 'happy', label: 'Happy', Icon: Sun, color: '#FFC83D', deep: '#F0A21B', soft: '#FFF3CF', text: '#7A5200' },
  { id: 'calm', label: 'Calm', Icon: Leaf, color: '#8FD3BC', deep: '#4FAE92', soft: '#E1F5EE', text: '#1E6B56' },
  { id: 'tired', label: 'Tired', Icon: Moon, color: '#B9A7F0', deep: '#8D77D6', soft: '#EDE7FC', text: '#5A44A8' },
  { id: 'anxious', label: 'Anxious', Icon: Wind, color: '#FF9A76', deep: '#EE6F45', soft: '#FFE8DE', text: '#A33F1B' },
  { id: 'sad', label: 'Sad', Icon: CloudRain, color: '#7DB3E8', deep: '#4A87C7', soft: '#E2EFFB', text: '#255A94' },
]

const BY_ID = new Map<MoodId, Mood>(MOODS.map((m) => [m.id, m]))

export function getMood(id: MoodId): Mood {
  return BY_ID.get(id) ?? MOODS[1]
}

export function isMoodId(value: unknown): value is MoodId {
  return typeof value === 'string' && BY_ID.has(value as MoodId)
}

/** Glossy orb background + shading, shared by the jar and chips. */
export function orbStyle(mood: Mood): { background: string; boxShadow: string } {
  return {
    background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.95) 0%, ${mood.color} 40%, ${mood.deep} 100%)`,
    boxShadow: `inset -4px -6px 10px ${mood.deep}66, inset 3px 3px 8px rgba(255,255,255,0.55), 0 6px 14px ${mood.deep}40`,
  }
}
