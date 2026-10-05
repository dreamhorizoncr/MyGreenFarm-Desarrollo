import { sileo } from 'sileo'
import type { SileoButton, SileoOptions } from 'sileo'

type NotifyInput = string | SileoOptions
type SileoKind = 'success' | 'error' | 'warning' | 'info'

const DEFAULT_DURATION = 4000

function toOptions(input: NotifyInput): SileoOptions {
  return typeof input === 'string' ? { title: input } : input
}

function withDefaults(options: SileoOptions, fill: string): SileoOptions {
  if (options.duration === undefined) options.duration = DEFAULT_DURATION
  if (options.fill === undefined) options.fill = fill
  return options
}

// Sileo has no dismiss-on-click option, so toast nodes are tagged with their id as they appear.
const pendingIds: string[] = []
let tapToDismissReady = false

function setupTapToDismiss() {
  if (tapToDismissReady) return
  tapToDismissReady = true

  document.addEventListener('click', (event) => {
    const toastEl = (event.target as HTMLElement | null)?.closest('[data-sileo-toast]')
    const id = toastEl instanceof HTMLElement ? toastEl.dataset.notifyId : undefined
    if (id) sileo.dismiss(id)
  })

  const tagToast = (el: Element) => {
    if (el instanceof HTMLElement && !el.dataset.notifyId) {
      const id = pendingIds.shift()
      if (id) el.dataset.notifyId = id
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return
        if (node.matches('[data-sileo-toast]')) tagToast(node)
        node.querySelectorAll('[data-sileo-toast]').forEach(tagToast)
      })
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

function show(kind: SileoKind, input: NotifyInput, fill: string): string {
  setupTapToDismiss()
  const id = sileo[kind](withDefaults(toOptions(input), fill))
  pendingIds.push(id)
  return id
}

export const notify = {
  success(input: NotifyInput): string {
    return show('success', input, 'var(--success-default)')
  },

  error(input: NotifyInput): string {
    return show('error', input, 'var(--danger-default)')
  },

  warning(input: NotifyInput): string {
    return show('warning', input, 'var(--warning-default)')
  },

  info(input: NotifyInput): string {
    return show('info', input, 'var(--info-default)')
  },

  action(input: NotifyInput, button: SileoButton): string {
    const options = toOptions(input)
    options.button = button
    return sileo.action(withDefaults(options, 'var(--link-default)'))
  },

  promise: sileo.promise,

  dismiss(id: string): void {
    sileo.dismiss(id)
  },

  clear(position?: SileoOptions['position']): void {
    sileo.clear(position)
  },
}
