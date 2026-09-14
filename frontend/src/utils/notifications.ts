import { sileo } from 'sileo'
import type { SileoButton, SileoOptions } from 'sileo'

type NotifyInput = string | SileoOptions

const DEFAULT_DURATION = 4000

function toOptions(input: NotifyInput): SileoOptions {
  return typeof input === 'string' ? { title: input } : input
}

function withDefaults(options: SileoOptions, fill: string): SileoOptions {
  if (options.duration === undefined) options.duration = DEFAULT_DURATION
  if (options.fill === undefined) options.fill = fill
  return options
}

export const notify = {
  success(input: NotifyInput): string {
    return sileo.success(withDefaults(toOptions(input), 'var(--success-default)'))
  },

  error(input: NotifyInput): string {
    return sileo.error(withDefaults(toOptions(input), 'var(--danger-default)'))
  },

  warning(input: NotifyInput): string {
    return sileo.warning(withDefaults(toOptions(input), 'var(--warning-default)'))
  },

  info(input: NotifyInput): string {
    return sileo.info(withDefaults(toOptions(input), 'var(--info-default)'))
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
