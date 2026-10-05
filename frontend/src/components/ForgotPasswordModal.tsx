import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import { useForgotPassword } from '../hooks/useForgotPassword.ts'
import { notify } from '../utils/notifications.ts'

interface ForgotPasswordModalProps {
  email: string
  onClose: () => void
}

function ForgotPasswordModal({ email, onClose }: Readonly<ForgotPasswordModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { submitForgotPassword, loading, error, success } = useForgotPassword()

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const handleSubmit = async () => {
    await submitForgotPassword(
      { email },
      () => {
        notify.success({
          title: t('forgotPassword.successToastTitle'),
          description: t('forgotPassword.success'),
        })
      },
      (message) => {
        notify.error({
          title: t('forgotPassword.errorToastTitle'),
          description: message,
        })
      },
    )
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      aria-label={t('profile.resetPassword')}
      className="fixed inset-0 m-auto max-h-[90vh] w-[min(480px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
    >
      <div className="relative p-[28px_22px_30px]">
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        {success ? (
          <div className="flex flex-col items-center gap-md px-[10px] py-[20px] text-center">
            <CircleCheck size={64} className="text-green-500" />
            <h2 className="m-0 font-heading text-[26px] font-bold leading-none text-heading">
              {t('forgotPassword.successToastTitle')}
            </h2>
            <p className="m-0 max-w-[22rem] font-body text-body-sm text-body-text">
              {t('forgotPassword.success')}
            </p>
          </div>
        ) : (
          <>
            <div className="relative mb-lg text-center">
              <h2 className="m-0 font-heading text-[30px] font-bold leading-none text-heading">
                {t('profile.resetPassword')}
              </h2>
            </div>

            <div className="flex flex-col gap-md px-[10px] pb-[10px] text-left">
              <p className="m-0 font-body text-body-sm text-body-text">
                {t('forgotPassword.description')}
              </p>

              <div className="flex flex-col">
                <label htmlFor="profile-reset-email" className="mb-1 font-body text-body font-normal leading-[1.6] text-body-text">
                  {t('forgotPassword.email')}
                </label>
                <input
                  id="profile-reset-email"
                  type="email"
                  value={email}
                  readOnly
                  className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-body-sm text-body-text outline-none disabled:cursor-not-allowed"
                />
              </div>

              {error && (
                <p className="m-0 text-left font-body text-body-sm text-danger">{error}</p>
              )}

              <div className="flex gap-md mt-sm">
                <Button variant="secondary" onClick={onClose} className="h-11 flex-1 rounded-full font-body text-button uppercase tracking-wide">
                  {t('admin.cancel')}
                </Button>
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  loading={loading}
                  className="h-11 flex-1 rounded-full bg-green-500 font-body text-button font-normal uppercase tracking-wide text-white"
                >
                  {loading ? t('forgotPassword.loading') : t('forgotPassword.buttonLabel')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}

export default ForgotPasswordModal
