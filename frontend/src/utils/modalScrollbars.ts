// Barra de scroll flotante para el contenido de los modales (.modal-scroll).
// La barra nativa ocupa su propio carril y ensancha el modal; esta va encima del
// contenido, sin ocupar espacio. Se instala una sola vez y detecta sola los modales
// que se abren, así ningún modal tiene que hacer nada más que usar la clase.

const SELECTOR = '.modal-scroll'
// Separación de la barra con los bordes del modal, para que no choque con el redondeado.
const EDGE_GAP = 20
// La barra es apenas una señal de que hay más contenido: corta y de tamaño acotado.
const MIN_THUMB = 24
const MAX_THUMB = 56

// Modales con barra instalada y la función que la reacomoda.
const updaters = new Map<HTMLElement, () => void>()

function enhance(container: HTMLElement) {
  const track = document.createElement('div')
  track.className = 'modal-scrollbar'
  track.setAttribute('aria-hidden', 'true')
  const thumb = document.createElement('div')
  thumb.className = 'modal-scrollbar-thumb'
  track.appendChild(thumb)
  // Primer hijo: no altera estilos que dependen del último hijo (last:, space-y).
  container.prepend(track)

  let thumbHeight = 0
  let trackHeight = 0

  const update = () => {
    if (track.parentElement !== container) container.prepend(track)
    // Observa también el contenido nuevo (imágenes que cargan, secciones que aparecen).
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
    // El track es absolute dentro del contenedor que hace scroll: se compensa el scrollTop para que quede quieto.
    track.style.top = `${scrollTop + EDGE_GAP}px`
    track.style.height = `${trackHeight}px`
    thumb.style.height = `${thumbHeight}px`
    thumb.style.transform = `translateY(${(scrollTop / maxScroll) * (trackHeight - thumbHeight)}px)`
  }

  // Arrastrar la barra mueve el contenido.
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

  // Click en el carril: salta a esa altura.
  track.addEventListener('pointerdown', (event) => {
    if (event.target !== track) return
    event.preventDefault()
    event.stopPropagation()
    const offset = event.clientY - track.getBoundingClientRect().top - thumbHeight / 2
    const maxScroll = container.scrollHeight - container.clientHeight
    container.scrollTo({ top: (offset / Math.max(1, trackHeight - thumbHeight)) * maxScroll, behavior: 'smooth' })
  })
  // Que un click en la barra no cierre el modal (los modales cierran al hacer click en el fondo).
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
  // Reacomoda las barras abiertas y suelta las de modales que ya se cerraron.
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
