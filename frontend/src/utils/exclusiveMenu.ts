// Lets independent navbar menus (profile menu, language switcher, etc.) close each
// other so only one stays open at a time, without needing a shared parent/context.
let activeClose: (() => void) | null = null

export function claimExclusiveOpen(close: () => void) {
  if (activeClose && activeClose !== close) activeClose()
  activeClose = close
}

export function releaseExclusiveOpen(close: () => void) {
  if (activeClose === close) activeClose = null
}
