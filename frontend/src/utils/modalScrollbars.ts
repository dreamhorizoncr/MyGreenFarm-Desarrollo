
const SELECTOR = '.modal-scroll'
const EDGE_GAP = 20
const MIN_THUMB = 24
const MAX_THUMB = 56

const updaters = new Map<HTMLElement, () => void>()

function enhance(container: HTMLElement) {
  const track = document.createElement('div')
  track.className = 'modal-scrollbar'
  track.setAttribute('aria-hidden', 'true')
  const thumb = document.createElement('div')
  thumb.className = 'modal-scrollbar-thumb'
  track.appendChild(thumb)
  container.prepend(track)

  let thumbHeight = 0
  let trackHeight = 0

  const update = () => {
    if (track.parentElement !== container) container.prepend(track)
    for (const child of Array.from(container.children)) {
      if (child !== track) resizeObserver.observe(child)
    }

    const { scrollTop, scrollHeight, clientHeight } = container
    const maxScroll = scrollHeight - clientHeight
    if (maxScroll <= 1) {
      track.hidden = true
      return
    }
    track.hidden = false
    trackHeight = clientHeight - EDGE_GAP * 2
    thumbHeight = Math.min(MAX_THUMB, Math.max(MIN_THUMB, (trackHeight * clientHeight) / scrollHeight))
    track.style.top = `${scrollTop + EDGE_GAP}px`
    track.style.height = `${trackHeight}px`
    thumb.style.height = `${thumbHeight}px`
    thumb.style.transform = `translateY(${(scrollTop / maxScroll) * (trackHeight - thumbHeight)}px)`
  }

  thumb.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    event.stopPropagation()
    thumb.setPointerCapture(event.pointerId)
    track.classList.add('is-dragging')
    const startY = event.clientY
    const startScroll = container.scrollTop
    const ratio = (container.scrollHeight - container.clientHeight) / Math.max(1, trackHeight - thumbHeight)

    const onMove = (moveEvent: PointerEvent) => {
      container.scrollTop = startScroll + (moveEvent.clientY - startY) * ratio
    }
    const onUp = () => {
      track.classList.remove('is-dragging')
      thumb.removeEventListener('pointermove', onMove)
      thumb.removeEventListener('pointerup', onUp)
      thumb.removeEventListener('pointercancel', onUp)
    }
    thumb.addEventListener('pointermove', onMove)
    thumb.addEventListener('pointerup', onUp)
    thumb.addEventListener('pointercancel', onUp)
  })

  track.addEventListener('pointerdown', (event) => {
    if (event.target !== track) return
    event.preventDefault()
    event.stopPropagation()
    const offset = event.clientY - track.getBoundingClientRect().top - thumbHeight / 2
    const maxScroll = container.scrollHeight - container.clientHeight
    container.scrollTo({ top: (offset / Math.max(1, trackHeight - thumbHeight)) * maxScroll, behavior: 'smooth' })
  })
  track.addEventListener('click', (event) => event.stopPropagation())

  const resizeObserver = new ResizeObserver(update)
  resizeObserver.observe(container)
  container.addEventListener('scroll', update, { passive: true })
  updaters.set(container, () => {
    if (container.isConnected) update()
    else {
      resizeObserver.disconnect()
      updaters.delete(container)
    }
  })
  update()
}

function scan() {
  for (const element of document.querySelectorAll<HTMLElement>(SELECTOR)) {
    if (!updaters.has(element)) enhance(element)
  }
  for (const update of Array.from(updaters.values())) update()
}

let installed = false

export function installModalScrollbars() {
  if (installed || typeof window === 'undefined') return
  installed = true
  let frame = 0
  const schedule = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(scan)
  }
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', schedule)
  schedule()
}
