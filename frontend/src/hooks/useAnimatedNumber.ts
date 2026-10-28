import { useEffect, useRef, useState } from 'react'
import { animationsStopped } from '../utils/reducedMotion'

const DEFAULT_DURATION = 700

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3)
}

function prefersReducedMotion(): boolean {
  return animationsStopped()
}

interface UseAnimatedNumberOptions {
  duration?: number
  from?: number
}

export function useAnimatedNumber(value: number, options: UseAnimatedNumberOptions = {}): number {
  const duration = options.duration ?? DEFAULT_DURATION
  const initialFrom = options.from ?? 0

  const [displayValue, setDisplayValue] = useState(initialFrom)
  const currentRef = useRef(initialFrom)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (currentRef.current === value) {
      return
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
    }

    if (prefersReducedMotion()) {
      frameRef.current = requestAnimationFrame(() => {
        currentRef.current = value
        setDisplayValue(value)
        frameRef.current = null
      })
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }
      }
    }

    const from = currentRef.current
    const to = value
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const next = from + (to - from) * easeOutCubic(progress)
      currentRef.current = next
      setDisplayValue(next)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [value, duration])

  return displayValue
}
