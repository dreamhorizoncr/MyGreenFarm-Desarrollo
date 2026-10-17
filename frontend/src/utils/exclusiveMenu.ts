let activeClose: (() => void) | null = null

export function claimExclusiveOpen(close: () => void) {
  if (activeClose && activeClose !== close) activeClose()
  activeClose = close
}

export function releaseExclusiveOpen(close: () => void) {
  if (activeClose === close) activeClose = null
}
