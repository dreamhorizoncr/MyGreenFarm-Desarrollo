import { useEffect, useState } from 'react'
import { useAccessibility } from '../contexts/accessibility'

export function useMotionKey() {
  const { stopAnimations } = useAccessibility()
  const [settled, setSettled] = useState(stopAnimations)

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(stopAnimations), 0)
    return () => window.clearTimeout(timer)
  }, [stopAnimations])

  return settled ? 'still' : 'moving'
}
