const STOP_CLASS = 'stop-animations-mode'
const changeListeners = new Set<() => void>()

function stopModeOn() {
  return document.documentElement.classList.contains(STOP_CLASS)
}

function storedStopMode() {
  try {
    return localStorage.getItem('a11y_stop_animations') === 'true'
  } catch {
    return false
  }
}

export function animationsStopped(): boolean {
  if (typeof window === 'undefined') return false
  return stopModeOn() || window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function installReducedMotionBridge() {
  if (typeof window === 'undefined' || !window.matchMedia) return
  if (storedStopMode()) document.documentElement.classList.add(STOP_CLASS)

  const nativeMatchMedia = window.matchMedia.bind(window)
  window.matchMedia = (query: string) => {
    const list = nativeMatchMedia(query)
    if (!query.includes('prefers-reduced-motion')) return list

    const wrappers = new Map<EventListenerOrEventListenerObject, () => void>()
    const proxy: MediaQueryList = new Proxy(list, {
      get(target, property) {
        if (property === 'matches') return target.matches || stopModeOn()
        if (property === 'addEventListener' || property === 'addListener') {
          return (...args: unknown[]) => {
            const listener = (property === 'addListener' ? args[0] : args[1]) as EventListenerOrEventListenerObject | null
            if (listener && (property === 'addListener' || args[0] === 'change')) {
              const notify = () => {
                const event = new Event('change')
                if (typeof listener === 'function') listener.call(proxy, event)
                else listener.handleEvent(event)
              }
              wrappers.set(listener, notify)
              changeListeners.add(notify)
            }
            return Reflect.apply(target[property], target, args)
          }
        }
        if (property === 'removeEventListener' || property === 'removeListener') {
          return (...args: unknown[]) => {
            const listener = (property === 'removeListener' ? args[0] : args[1]) as EventListenerOrEventListenerObject | null
            const notify = listener ? wrappers.get(listener) : undefined
            if (notify) changeListeners.delete(notify)
            return Reflect.apply(target[property], target, args)
          }
        }
        const value = Reflect.get(target, property)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    return proxy
  }
}

export function notifyReducedMotionChange() {
  changeListeners.forEach((notify) => notify())
}
