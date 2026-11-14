import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

// Week number -> lesson. A week with no entry shows its planned outline instead.
export const LESSONS: Record<number, LazyExoticComponent<ComponentType>> = {
  1: lazy(() => import('./Week01.mdx')),
}

export const LESSON_MINUTES: Record<number, number> = {
  1: 60,
}
