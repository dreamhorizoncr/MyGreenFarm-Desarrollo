import { useAnimatedNumber } from '../../hooks/useAnimatedNumber.ts'

interface AnimatedNumberProps {
  value: number
  format: (value: number) => string
  duration?: number
  from?: number
  className?: string
}

function AnimatedNumber({ value, format, duration, from, className }: Readonly<AnimatedNumberProps>) {
  const displayValue = useAnimatedNumber(value, { duration, from })

  return (
    <span className={className}>
      <span aria-hidden="true">{format(displayValue)}</span>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {format(value)}
      </span>
    </span>
  )
}

export default AnimatedNumber
