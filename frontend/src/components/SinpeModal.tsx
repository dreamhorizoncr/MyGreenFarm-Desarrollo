import React from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { SmartphoneIcon } from '@animateicons/react/lucide'

interface SinpeModalProps {
    isOpen: boolean
    planName: string
    phoneNumber: string
    sinpeReference: string
    onConfirm: () => void
    onCancel: () => void
}

export const SinpeModal: React.FC<SinpeModalProps> = ({
    isOpen,
    planName,
    phoneNumber,
    sinpeReference,
    onConfirm,
    onCancel
}) => {
    const { t } = useTranslation()
    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/55 backdrop-blur p-4">
            <dialog
                open
                aria-modal="true"
                aria-labelledby="sinpe-modal-title"
                className="static m-0 text-inherit w-full max-w-lg min-w-80 rounded-[28px] bg-white p-6 text-center shadow-2xl animate-fade-in"
            >
                <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <SmartphoneIcon size={32} />
            </div>

                <h3 id="sinpe-modal-title" className="font-heading text-xl font-bold">
                    {t('services.sinpeModal.title')}
                </h3>

                <p className="mt-2 font-body text-sm text-neutral-500">
                    <Trans
                        i18nKey="services.sinpeModal.received"
                        values={{ plan: planName }}
                        components={{ strong: <strong className="text-orange-500" /> }}
                    />
                </p>

                <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-left font-body text-xs text-neutral-600">
                    <div className="flex justify-between py-1 border-b border-neutral-200">
                        <span className="font-semibold">{t('services.sinpeModal.phone')}</span>
                        <span>{phoneNumber}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="font-semibold">{t('services.sinpeModal.reference')}</span>
                        <span>{sinpeReference}</span>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full rounded-full bg-green-500 py-3 font-body text-sm font-semibold text-white transition hover:bg-green-600 shadow-sm"
                    >
                        {t('services.sinpeModal.confirm')}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full rounded-full bg-transparent py-2 font-body text-xs font-semibold text-neutral-500 transition hover:text-orange-500"
                    >
                        {t('services.sinpeModal.back')}
                    </button>
                </div>
            </dialog>
        </div>,
        document.body
    )
}