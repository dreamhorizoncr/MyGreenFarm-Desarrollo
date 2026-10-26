import { Children, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react'

const DURATION = 350
const EASING = 'ease'

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

type ItemElement = ReactElement<HTMLAttributes<HTMLDivElement> & { 'data-flip-key'?: string; 'data-flip-exit'?: string }>

function itemsOf(children: ReactNode) {
  return Children.toArray(children).filter(isValidElement) as ItemElement[]
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function measure(node: HTMLElement): Rect {
  return { left: node.offsetLeft, top: node.offsetTop, width: node.offsetWidth, height: node.offsetHeight }
}

function waitForImages(node: HTMLElement) {
  const images = [...node.querySelectorAll('img')].map((image) => image.decode().catch(() => {}))
  return Promise.race([Promise.all(images), new Promise((resolve) => setTimeout(resolve, 1500))])
}

const TIMING = { duration: DURATION, easing: EASING }

function resetNode(node: HTMLElement) {
  node.getAnimations().forEach((animation) => animation.cancel())
  if (!node.dataset.flipKey || !node.dataset.flipStarted) return
  delete node.dataset.flipStarted
  Object.assign(node.style, { position: '', left: '', top: '', width: '', height: '', opacity: '' })
}

function startExit(node: HTMLElement, rect: Rect | undefined, finish: () => void) {
  if (!rect) {
    finish()
    return
  }
  Object.assign(node.style, { position: 'absolute', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` })
  const exit = node.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.6)', opacity: 0 }], { ...TIMING, fill: 'forwards' })
  void exit.finished.then(finish, finish)
}

function animateHeight(grid: HTMLElement, startHeight: number | null) {
  const endHeight = grid.offsetHeight
  if (startHeight === null || startHeight === endHeight) return
  grid.animate([{ height: `${startHeight}px` }, { height: `${endHeight}px` }], TIMING)
}

function animateItem(node: HTMLElement, before: Rect | undefined, next: Rect) {
  if (!before) {
    node.style.opacity = '0'
    void waitForImages(node).then(() => {
      node.style.opacity = ''
      node.animate([{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], TIMING)
    })
    return
  }
  const dx = before.left - next.left
  const dy = before.top - next.top
  if (dx || dy) node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], TIMING)
}

interface FilterGridProps {
  children: ReactNode
  className?: string
}

export function FilterGrid({ children, className = '' }: Readonly<FilterGridProps>) {
  const gridRef = useRef<HTMLDivElement>(null)
  const rects = useRef(new Map<string, Rect>())
  const gridHeight = useRef<number | null>(null)
  const lastSignature = useRef<string | null>(null)
  const items = itemsOf(children)
  const keys = items.map((item) => String(item.key))
  const keySignature = keys.join('|')

  const [previous, setPrevious] = useState({ signature: keySignature, items })
  const [exiting, setExiting] = useState<ItemElement[]>([])

  if (previous.signature !== keySignature) {
    const removed = previous.items.filter((item) => !keys.includes(String(item.key)))
    setExiting((current) => [
      ...current.filter((item) => !keys.includes(String(item.key)) && !removed.some((r) => r.key === item.key)),
      ...removed,
    ])
    setPrevious({ signature: keySignature, items })
  }

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || lastSignature.current === keySignature) return
    lastSignature.current = keySignature
    const animate = gridHeight.current !== null && !prefersReducedMotion()
    const nodes = [...grid.children] as HTMLElement[]

    nodes.forEach(resetNode)

    for (const node of nodes) {
      const key = node.dataset.flipExit
      if (!key || node.dataset.flipStarted) continue
      node.dataset.flipStarted = 'true'
      const finish = () => setExiting((current) => current.filter((item) => String(item.key) !== key))
      startExit(node, animate ? rects.current.get(key) : undefined, finish)
    }

    animateHeight(grid, animate ? gridHeight.current : null)
    gridHeight.current = grid.offsetHeight

    for (const node of nodes) {
      const key = node.dataset.flipKey
      if (!key) continue
      const next = measure(node)
      const before = rects.current.get(key)
      rects.current.set(key, next)
      if (animate) animateItem(node, before, next)
    }

    for (const key of rects.current.keys()) {
      if (!keys.includes(key) && !nodes.some((node) => node.dataset.flipExit === key)) rects.current.delete(key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keySignature])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const remeasure = () => {
      for (const node of [...grid.children] as HTMLElement[]) {
        if (node.dataset.flipKey && node.getAnimations().length === 0) rects.current.set(node.dataset.flipKey, measure(node))
      }
      if (grid.getAnimations().length === 0) gridHeight.current = grid.offsetHeight
    }
    const observer = new ResizeObserver(remeasure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={gridRef} className={`relative content-start ${className}`}>
      {[
        ...items.map((item) => cloneElement(item, { 'data-flip-key': String(item.key) })),
        ...exiting.map((item) => cloneElement(item, { 'data-flip-exit': String(item.key), 'aria-hidden': true })),
      ]}
    </div>
  )
}

interface FilterGridItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function FilterGridItem({ children, className = 'rounded-[20px]', ...rest }: Readonly<FilterGridItemProps>) {
  return (
    <div className={className} {...rest}>
      <div className="grid h-full">{children}</div>
    </div>
  )
}
