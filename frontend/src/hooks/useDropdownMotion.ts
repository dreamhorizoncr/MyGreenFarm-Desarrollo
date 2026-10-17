import { useReducedMotion, type HTMLMotionProps } from 'motion/react'

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const EASE_IN = [0.4, 0, 0.6, 1] as const
const EXPANDED = 'inset(-50% -50% -50% -50%)'
const COLLAPSED_DOWN = 'inset(-50% -50% 100% -50%)'
const COLLAPSED_UP = 'inset(100% -50% -50% -50%)'

export function useDropdownMotion(opensUpward = false): Pick<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> {
  const reduceMotion = useReducedMotion()
  const collapsed = opensUpward ? COLLAPSED_UP : COLLAPSED_DOWN
  const offset = opensUpward ? 6 : -6

  if (reduceMotion) {
    return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
  }

  return {
    initial: { clipPath: collapsed, opacity: 0, y: offset },
    animate: {
      clipPath: EXPANDED,
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: EASE_OUT, opacity: { duration: 0.25, ease: 'easeOut' } },
    },
    exit: {
      clipPath: collapsed,
      opacity: 0,
      y: offset,
      transition: { duration: 0.24, ease: EASE_IN, opacity: { duration: 0.2, delay: 0.04, ease: 'easeIn' } },
    },
  }
}
