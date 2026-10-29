import React from 'react'
import { createPortal } from 'react-dom'
import { SmartphoneIcon } from '@animateicons/react/lucide'

interface SinpeModalProps {
    isOpen: boolean
    onClose: () => void
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
    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/55 backdrop-blur p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="sinpe-modal-title"
                className="w-full max-w-lg min-w-[320px] rounded-[28px] bg-white p-6 text-center shadow-2xl animate-fade-in"
            >
                <div className="mx-auto mb-md flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <SmartphoneIcon size={32} />
            </div>

                <h3 id="sinpe-modal-title" className="font-heading text-xl font-bold">
                    Procesando Transferencia SINPE
                </h3>

                <p className="mt-2 font-body text-sm text-neutral-500">
                    Hemos recibido la instrucción de pago para <strong className="text-orange-500">{planName}</strong>. La red bancaria está validando la acreditación de los fondos.
                </p>

                <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-left font-body text-xs text-neutral-600">
                    <div className="flex justify-between py-1 border-b border-neutral-200">
                        <span className="font-semibold">Teléfono asociado:</span>
                        <span>{phoneNumber}</span>
                    </div>
                    <div className="flex justify-between py-1">
                        <span className="font-semibold">Referencia:</span>
                        <span>{sinpeReference}</span>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full rounded-full bg-green-500 py-3 font-body text-sm font-semibold text-white transition hover:bg-green-600 shadow-sm"
                    >
                        Entendido / Ir al inicio
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full rounded-full bg-transparent py-2 font-body text-xs font-semibold text-neutral-500 transition hover:text-orange-500"
                    >
                        Volver a Servicios
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}