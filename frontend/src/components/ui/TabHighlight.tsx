import { motion, useReducedMotion } from 'motion/react'

/** Props of {@link TabHighlight}. */
interface TabHighlightProps {
  /** Shared by the tabs of one group, so the highlight slides between them. */
  layoutId: string
  className?: string
}

/** Background of the active tab, which slides to the tab chosen. */
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
