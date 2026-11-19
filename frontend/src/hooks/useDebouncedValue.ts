import { useEffect, useState } from 'react'

/**
 * Delays a value that changes quickly, such as the text of a search box, so a request is only sent
 * once the user stops typing.
 *
 * @param value - the value that changes
 * @param delayMs - how long it must stay the same, 300 ms by default
 * @returns the value once it has not changed for `delayMs`
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
