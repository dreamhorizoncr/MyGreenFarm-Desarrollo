import { useEffect, useState } from 'react'
import { useAccessibility } from '../contexts/accessibility'

/**
 * Key that changes when the stop animations option is switched, so components keyed with it mount again
 * and their animations start or stop at once.
 *
 * @returns `still` or `moving`
 */
export function useMotionKey() {
  const { stopAnimations } = useAccessibility()
  const [settled, setSettled] = useState(stopAnimations)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(stopAnimations), 0)
    return () => window.clearTimeout(timer)
  }, [stopAnimations])

  return settled ? 'still' : 'moving'
}
