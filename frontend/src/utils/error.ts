import i18n from '../i18n/index.ts'

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : i18n.t('common.error')
}