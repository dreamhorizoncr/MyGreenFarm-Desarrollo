import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import { useForgotPassword } from '../hooks/useForgotPassword.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { notify } from '../utils/notifications.ts'

interface ForgotPasswordModalProps {
  email: string
  onClose: () => void
}

function ForgotPasswordModal({ email, onClose }: Readonly<ForgotPasswordModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { closing, requestClose } = useModalExit(onClose)
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
      onClose={requestClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') requestClose()
      }}
      aria-label={t('profile.resetPassword')}
      className={`fixed inset-0 m-auto max-h-[90vh] w-[min(480px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-[20px] border border-neutral-200 bg-white shadow-lg backdrop:bg-scrim ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="relative p-lg md:p-xl">
        {success ? (
          <div className="flex flex-col items-center gap-md px-[10px] py-[20px] text-center">
            <CircleCheck size={64} className="text-green-500" />
            <h2 className="m-0 font-heading text-2xl font-bold text-heading">
              {t('forgotPassword.successToastTitle')}
            </h2>
            <p className="m-0 max-w-[22rem] font-body text-body-sm text-body-text">
              {t('forgotPassword.success')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-md">
              <h2 className="m-0 font-heading text-2xl font-bold text-heading">
                {t('profile.resetPassword')}
              </h2>

              <button
                type="button"
                onClick={requestClose}
                aria-label={t('admin.cancel')}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="mt-lg flex flex-col gap-md">
              <p className="m-0 font-body text-body-sm text-body-text">
                {t('forgotPassword.description')}
              </p>

              <label htmlFor="profile-reset-email" className="font-body text-body-sm font-semibold text-heading">
                {t('forgotPassword.email')}
                <input
                  id="profile-reset-email"
                  type="email"
                  value={email}
                  readOnly
                  className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-md font-normal text-body-text outline-none disabled:cursor-not-allowed"
                />
              </label>

              {error && (
                <p className="m-0 rounded-xl bg-red-50 p-md font-body text-body-sm text-red-700">{error}</p>
              )}

              <div className="mt-sm flex flex-wrap justify-end gap-sm">
                <Button
                  variant="secondary"
                  onClick={requestClose}
                  className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
                >
                  {t('admin.cancel')}
                </Button>
                <Button
                  variant="success"
                  onClick={handleSubmit}
                  loading={loading}
                  className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
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
