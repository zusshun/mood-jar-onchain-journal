/**
 * Deterministic "gravity" layout for orbs inside the jar.
 * Coordinates live in a 320 x 400 virtual space that matches the jar SVG.
 */

export const JAR_W = 320
export const JAR_H = 400
/** How many of the most recent feelings the jar can hold visually. */
export const JAR_CAPACITY = 20

const X_MIN = 32
const X_MAX = 288
const CORNER_LEFT_X = 72
const CORNER_RIGHT_X = 248
const CORNER_CENTER_Y = 344
const CORNER_RADIUS = 42
const GAP = 1.5

export interface OrbPlacement {
  id: string
  cx: number
  cy: number
  r: number
}

function hashString(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Lowest allowed center-y for an orb of radius r at x (the rounded jar floor). */
function floorCenterY(x: number, r: number): number | null {
  const R = CORNER_RADIUS - r
  if (x < CORNER_LEFT_X) {
    const dx = CORNER_LEFT_X - x
    return dx > R ? null : CORNER_CENTER_Y + Math.sqrt(R * R - dx * dx)
  }
  if (x > CORNER_RIGHT_X) {
    const dx = x - CORNER_RIGHT_X
    return dx > R ? null : CORNER_CENTER_Y + Math.sqrt(R * R - dx * dx)
  }
  return CORNER_CENTER_Y + R
}

/** Where an orb dropped at x would come to rest. */
function restingY(x: number, r: number, placed: OrbPlacement[]): number | null {
  let y = floorCenterY(x, r)
  if (y === null) return null
  for (const o of placed) {
    const dx = Math.abs(x - o.cx)
    const d = r + o.r + GAP
    if (dx < d) y = Math.min(y, o.cy - Math.sqrt(d * d - dx * dx))
  }
  return y
}

export function layoutOrbs(ids: string[]): OrbPlacement[] {
  const placed: OrbPlacement[] = []
  for (const id of ids) {
    const rand = seeded(hashString(id))
    const r = 20 + rand() * 8
    let best: { x: number; y: number } | null = null
    for (let i = 0; i < 48; i++) {
      const x = X_MIN + r + rand() * (X_MAX - X_MIN - 2 * r)
      const y = restingY(x, r, placed)
      if (y !== null && (!best || y > best.y)) best = { x, y }
    }
    if (!best) {
      const x = JAR_W / 2
      best = { x, y: restingY(x, r, placed) ?? CORNER_CENTER_Y + CORNER_RADIUS - r }
    }
    placed.push({ id, cx: best.x, cy: best.y, r })
  }
  return placed
}
