import { sileo } from 'sileo'
import type { SileoButton, SileoOptions } from 'sileo'
import i18n from '../i18n/index.ts'
import { getErrorMessage } from './error.ts'

/** Just a title, or every option of the toast. */
type NotifyInput = string | SileoOptions
type SileoKind = 'success' | 'error' | 'warning' | 'info'

const DEFAULT_DURATION = 4000
/** Longest title that fits in a toast; longer ones become its description. */
const MAX_TITLE_LENGTH = 36

function toOptions(input: NotifyInput): SileoOptions {
  return typeof input === 'string' ? { title: input } : input
}

/**
 * @returns the options with a title that fits: a long one moves into the description and a generic
 *   title of the kind takes its place
 */
function fitTitle(options: SileoOptions, kind: SileoKind): SileoOptions {
  const { title, description } = options
  if (typeof title !== 'string' || title.length <= MAX_TITLE_LENGTH) return options
  if (description !== undefined && typeof description !== 'string') return options

  return {
    ...options,
    title: i18n.t(`common.notifyTitles.${kind}`),
    description: description && description !== title ? `${withPeriod(title)} ${description}` : title,
  }
}

function withPeriod(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`
}

let modalOpenedSinceRaise = false

/** Shows the toasts' container in the top layer, so they stay above an open `<dialog>`. */
function raiseViewport(viewport: HTMLElement, restack: boolean) {
  if (typeof viewport.showPopover !== 'function') return
  if (!viewport.hasAttribute('popover')) viewport.setAttribute('popover', 'manual')
  const isOpen = viewport.matches(':popover-open')
  if (isOpen && !restack) return
  if (isOpen) viewport.hidePopover()
  viewport.showPopover()
}

/** Moves the toasts above the dialogs, again if a dialog was opened after them. */
function raiseViewports() {
  const restack = modalOpenedSinceRaise
  modalOpenedSinceRaise = false
  document.querySelectorAll<HTMLElement>('[data-sileo-viewport]').forEach((viewport) => raiseViewport(viewport, restack))
}

function withDefaults(options: SileoOptions, fill: string): SileoOptions {
  if (options.duration === undefined) options.duration = DEFAULT_DURATION
  if (options.fill === undefined) options.fill = fill
  return options
}

const pendingIds: string[] = []
let tapToDismissReady = false

/**
 * Lets a toast be dismissed by clicking it, and keeps the toasts above the dialogs opened later. It
 * runs once, with the first toast.
 */
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
    let toastAdded = false
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        if (mutation.target instanceof HTMLDialogElement && mutation.target.open) modalOpenedSinceRaise = true
        continue
      }
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return
        if (node.matches('[data-sileo-toast]')) tagToast(node)
        node.querySelectorAll('[data-sileo-toast]').forEach(tagToast)
        if (node.matches('[data-sileo-viewport], [data-sileo-toast]') || node.querySelector('[data-sileo-toast]')) toastAdded = true
        if (node.matches('dialog[open]') || node.querySelector('dialog[open]')) modalOpenedSinceRaise = true
      })
    }
    if (toastAdded || (modalOpenedSinceRaise && document.querySelector('[data-sileo-toast]'))) raiseViewports()
  })

  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
}

/** @returns the ID of the toast shown */
function show(kind: SileoKind, input: NotifyInput, fill: string): string {
  setupTapToDismiss()
  const id = sileo[kind](withDefaults(fitTitle(toOptions(input), kind), fill))
  pendingIds.push(id)
  return id
}

/**
 * Toasts of the site, on top of Sileo: colors of the design system, four seconds by default, long titles
 * moved into the description, and dismissed by clicking them. Every method returns the toast's ID.
 */
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

  /**
   * @param input - title or options
   * @param button - the toast's button
   * @returns the toast's ID
   */
  action(input: NotifyInput, button: SileoButton): string {
    const options = fitTitle(toOptions(input), 'info')
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

/**
 * Shows an error toast with the reason of the error as its description.
 *
 * @param title - what failed, for example `No se pudo guardar`
 * @param error - the error; its message is added unless it repeats the title
 * @returns the toast's ID
 */
export function notifyError(title: string, error?: unknown): string {
  const reason = error === undefined ? null : getErrorMessage(error)
  return notify.error(reason && reason !== title ? { title, description: reason } : title)
}
