import { useLayoutEffect, useRef } from 'react'
import { animationsStopped } from '../../utils/reducedMotion.ts'

/** Props of {@link AnimatedNumber}. */
interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  /** Length of the animation in milliseconds, 600 by default. */
  duration?: number
  /** Value the first animation starts from, 0 by default. */
  from?: number
  className?: string
}

const DEFAULT_DURATION = 600

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3)
}

type Ref<T> = { current: T }

/** Shows `n` with the current format, touching the DOM only when the text changes. */
function writeNumber(element: HTMLSpanElement | null, shown: Ref<number>, format: Ref<(n: number) => string>, n: number) {
  shown.current = n
  const text = format.current(n)
  if (element && element.textContent !== text) element.textContent = text
}

/**
 * Number that counts from its previous value to the new one, for example a price when the currency
 * changes. Each frame writes the text straight into the DOM instead of re-rendering with React, so
 * the animation stays smooth: React only renders when `value` changes. The digits have a fixed width
 * (`tabular-nums`), so the layout does not move while it counts. With animations stopped it shows
 * the value at once. Screen readers only hear the final value.
 */
function AnimatedNumber({ value, format, duration = DEFAULT_DURATION, from = 0, className = '' }: Readonly<AnimatedNumberProps>) {
  // React never renders inside this span: only this component writes its text
  const textRef = useRef<HTMLSpanElement>(null)
  const shownRef = useRef(from)
  // the latest format (it changes with the currency), read by the animation without restarting it
  const formatRef = useRef(format)

  // a new format shows the number of this moment in it, before the browser paints
  useLayoutEffect(() => {
    formatRef.current = format
    writeNumber(textRef.current, shownRef, formatRef, shownRef.current)
  })

  useLayoutEffect(() => {
    const element = textRef.current
    const start = shownRef.current
    if (start === value || animationsStopped() || duration <= 0) {
      writeNumber(element, shownRef, formatRef, value)
      return
    }

    let frame = 0
    const begin = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - begin) / duration, 1)
      writeNumber(element, shownRef, formatRef, start + (value - start) * easeOutCubic(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    // a new value starts from the number shown at that moment, without jumping
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return (
    <span className={className}>
      <span ref={textRef} aria-hidden="true" className="tabular-nums" />
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {format(value)}
      </span>
    </span>
  )
}

export default AnimatedNumber
