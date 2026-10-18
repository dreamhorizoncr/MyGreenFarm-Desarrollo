import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, BanknoteIcon, CalendarDaysIcon, CircleCheckIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import type { ServicePlan } from '../types/servicePlan.ts'
import type { Currency, ExchangeRate } from '../types/exchangeRate.ts'
import { getPlanTypeLabel } from '../utils/planTypeLabels.ts'
import { convertCurrency, currencySymbol, formatCurrency } from '../utils/currency.ts'
import ModalCloseButton from './ui/ModalCloseButton.tsx'
import AnimatedNumber from './ui/AnimatedNumber.tsx'
import CurrencyToggle from './currency/CurrencyToggle.tsx'
import SchedulePopover from './SchedulePopover.tsx'

interface ServiceDetailModalProps {
    plan: ServicePlan
    // Moneda que el usuario ya eligió en la tarjeta
    initialCurrency?: Currency
    exchangeRate?: ExchangeRate | null
    isLoading?: boolean
    onSubscribe: (plan: ServicePlan) => void
    onClose: () => void
}

const cleanCurrency = (value?: string): Currency => {
    const upper = value?.toUpperCase()
    return upper === 'USD' || upper === 'EUR' ? upper : 'CRC'
}

function ServiceDetailModal({ plan, initialCurrency, exchangeRate, isLoading = false, onSubscribe, onClose }: Readonly<ServiceDetailModalProps>) {
    const { t, i18n } = useTranslation()
    const dialogRef = useRef<HTMLDialogElement>(null)
    const [scheduleOpen, setScheduleOpen] = useState(false)
    const [currency, setCurrency] = useState<Currency>(() => initialCurrency ?? cleanCurrency(plan.currency))
    const { closing, requestClose } = useModalExit(onClose)
    // Con el horario abierto, Escape y el clic afuera cierran solo el mini modal y no el detalle
    useDialogDismiss(dialogRef, requestClose, !scheduleOpen)

    useEffect(() => {
        dialogRef.current?.showModal()
    }, [])

    const price = exchangeRate
        ? convertCurrency(plan.price, cleanCurrency(plan.currency), currency, 'buy', exchangeRate)
        : plan.price

    return (
        <dialog
            ref={dialogRef}
            onClose={requestClose}
            aria-label={plan.name}
            className={`fixed inset-0 m-auto max-h-[90vh] w-[min(1100px,92vw)] max-w-none modal-scroll rounded-[20px] bg-bg-page backdrop:bg-black/50 ${
                closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'
            }`}
        >
            <div className="relative px-[22px] pb-[45px] pt-[40px] md:px-[55px] md:pb-[60px] md:pt-[55px]">
                <ModalCloseButton
                    onClick={requestClose}
                    aria-label={t('common.close')}
                    className="absolute right-3 top-[26px] z-20"
                />

                <header className="mx-auto max-w-[850px] text-center">
                    <h2 className="mt-[16px] font-heading text-h2 font-bold leading-[1.15] text-heading">
                        {plan.name}
                    </h2>
                    <div className="mt-[16px] flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[8px] font-body text-body-sm text-neutral-500">
                        <div className="flex items-center gap-[6px]">
                            <CalendarDaysIcon size={16} className="text-pink-400" />
                            <span>{getPlanTypeLabel(plan.type, t as never)}</span>
                        </div>
                        <SchedulePopover schedule={plan.schedule} onOpenChange={setScheduleOpen} />
                    </div>
                </header>

                {plan.imageUrl && (
                    <div className="mt-[40px] overflow-hidden rounded-[22px]">
                        <img
                            src={plan.imageUrl}
                            alt={plan.name}
                            className="h-[260px] w-full object-cover sm:h-[360px] md:h-[480px]"
                        />
                    </div>
                )}

                <section className="mx-auto mt-[40px] max-w-[950px] text-left">
                    <p className="m-0 whitespace-pre-line font-body text-body-sm leading-[1.85] text-body-text md:text-body">
                        {plan.description}
                    </p>

                    {plan.includes && (
                        <div className="mt-xl">
                            <h3 className="m-0 flex items-center gap-xs font-heading text-h5 font-bold text-heading">
                                <CircleCheckIcon size={18} className="text-pink-400" aria-hidden="true" />
                                {t('services.includes')}
                            </h3>
                            <p className="m-0 mt-xs whitespace-pre-line font-body text-body-sm leading-[1.85] text-body-text md:text-body">
                                {plan.includes}
                            </p>
                        </div>
                    )}

                    <div className="mt-xl">
                        <h3 className="m-0 flex items-center gap-xs font-heading text-h5 font-bold text-heading">
                            <BanknoteIcon size={18} className="text-pink-400" aria-hidden="true" />
                            {t('services.priceLabel')}
                        </h3>
                        <div className="mt-xs flex flex-col gap-xl sm:flex-row sm:items-end sm:justify-between sm:gap-md">
                            <div className="flex min-w-0 flex-col items-start gap-xs [&>div:first-child]:justify-start">
                                <CurrencyToggle value={currency} onChange={setCurrency} hasExchangeRate={Boolean(exchangeRate)} />
                                <span className="font-heading text-h2 font-bold leading-none text-green-500">
                                    <AnimatedNumber
                                        value={price}
                                        format={(n) => `${currencySymbol(currency)}${formatCurrency(n, currency, i18n.language)}`}
                                    />
                                </span>
                                <span className="font-body text-caption text-neutral-500">{t('services.approxPrice')}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onSubscribe(plan)}
                                disabled={isLoading}
                                className="group inline-flex h-12 w-full items-center justify-center gap-xs rounded-full bg-orange-500 px-xl font-body text-body font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
                            >
                                {isLoading ? t('common.loading') : t('services.subscribe')}
                                {!isLoading && <ArrowRightIcon size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </dialog>
    )
}

export default ServiceDetailModal
