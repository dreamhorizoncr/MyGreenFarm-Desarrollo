let activeClose: (() => void) | null = null

/**
 * Registers a menu that just opened and closes the one that was open, so only one is open at a time.
 *
 * @param close - function that closes the new menu
 */
export function claimExclusiveOpen(close: () => void) {
  if (activeClose && activeClose !== close) activeClose()
  activeClose = close
}

/**
 * Forgets a menu that was closed.
 *
 * @param close - the same function given to {@link claimExclusiveOpen}
 */
export function releaseExclusiveOpen(close: () => void) {
  if (activeClose === close) activeClose = null
}
