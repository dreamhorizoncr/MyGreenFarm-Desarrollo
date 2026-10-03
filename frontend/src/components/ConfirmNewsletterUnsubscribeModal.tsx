import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import { getErrorMessage } from '../utils/error.ts'
import type { NewsletterRecipient } from '../types/newsletter.ts'

interface ConfirmNewsletterUnsubscribeModalProps {
    recipient: NewsletterRecipient
    onConfirm: (recipient: NewsletterRecipient) => Promise<void>
    onClose: () => void
}

function ConfirmNewsletterUnsubscribeModal({ recipient, onConfirm, onClose }: Readonly<ConfirmNewsletterUnsubscribeModalProps>) {
    const { t } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [unsubscribing, setUnsubscribing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleConfirm = async () => {
        setUnsubscribing(true)
        setError(null)
        try {
            await onConfirm(recipient)
            onClose()
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setUnsubscribing(false)
        }
    }

    return (
        <dialog
            ref={(el) => {
                dialogRef.current = el
                if (el && !el.open) el.showModal()
            }}
            onClose={onClose}
            onClick={(event) => {
                if (event.target === dialogRef.current) onClose()
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') onClose()
            }}
            aria-labelledby="newsletter-unsubscribe-title"
            className="m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
        >
                <button
                    type="button"
                    className="absolute right-3 top-6.5 z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
                    onClick={onClose}
                    aria-label={t('admin.cancel', 'Cancelar')}
                >
                    <XIcon size={20} aria-hidden="true" />
                </button>

                <div className="relative mb-lg text-center">
                    <h2 id="newsletter-unsubscribe-title" className="m-0 font-heading text-page-title font-bold leading-tight text-heading">
                        {t('admin.newsletter.unsubscribeConfirmTitle')}
                    </h2>
                </div>

                <div className="flex flex-col gap-md px-7 pb-8 pt-2.5">
                    <p className="m-0 break-all text-left font-body text-body-sm text-body-text">
                        {t('admin.newsletter.unsubscribeConfirmMessage', { email: recipient.email })}
                    </p>

                    {error && <p className="m-0 text-left font-body text-body-sm text-danger">{error}</p>}

                    <div className="mt-sm flex gap-md">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={unsubscribing}
                            className="h-11 flex-1 rounded-full font-body text-button uppercase tracking-wide"
                        >
                            {t('admin.cancel', 'Cancelar')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleConfirm}
                            loading={unsubscribing}
                            className="h-11 flex-1 rounded-full bg-danger font-body text-button font-normal uppercase tracking-wide"
                        >
                            {t('admin.newsletter.unsubscribe')}
                        </Button>
                    </div>
                </div>
        </dialog>
    )
}

export default ConfirmNewsletterUnsubscribeModal