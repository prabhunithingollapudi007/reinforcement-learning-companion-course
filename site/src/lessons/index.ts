import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

// Every file named WeekNN.mdx in this folder is a lesson; no registration needed.
// A week with no file shows its planned outline instead.
const modules = import.meta.glob<{ default: ComponentType }>('./Week*.mdx')

export const LESSONS: Record<number, LazyExoticComponent<ComponentType>> = {}
for (const [path, load] of Object.entries(modules)) {
  const match = /Week(\d+)\.mdx$/.exec(path)
  if (match) LESSONS[Number(match[1])] = lazy(load)
}

/** Rough reading-and-playing time, shown under the lesson title. */
export const LESSON_MINUTES: Record<number, number> = {
  1: 60,
  2: 60,
  3: 60,
  4: 60,
  5: 60,
  6: 70,
  7: 60,
  8: 60,
  9: 70,
  10: 60,
  11: 50,
  12: 60,
  13: 55,
  14: 50,
  15: 60,
}
