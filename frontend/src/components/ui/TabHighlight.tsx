import { motion, useReducedMotion } from 'motion/react'

interface TabHighlightProps {
  layoutId: string
  className?: string
}

function TabHighlight({ layoutId, className = 'bg-orange-500' }: Readonly<TabHighlightProps>) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      layoutId={layoutId}
      data-tab-highlight=""
      aria-hidden="true"
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.55 }}
      className={`pointer-events-none absolute -inset-px -z-10 rounded-[inherit] ${className}`}
    />
  )
}

export default TabHighlight
