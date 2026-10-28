import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    CreditCardIcon,
    SmartphoneIcon,
    LockIcon,
    CheckCheckIcon,
    ArrowLeftIcon
} from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import AnimatedNumber from '../components/ui/AnimatedNumber.tsx'
import type { ServicePlan } from '../types/servicePlan.ts'
import type { Currency } from '../types/exchangeRate.ts'
import { currencySymbol, formatCurrency } from '../utils/currency.ts'
import { servicePlanService } from '../services/servicePlan.ts'
import { notifyError } from '../utils/notifications.ts'
import { SinpeModal } from '../components/SinpeModal'
import Select from '../components/ui/Select.tsx'
import FieldHint from '../components/ui/FieldHint.tsx'
import { SUPPORTED_LANGUAGES } from '../i18n/index.ts'

interface LocationState {
    plan: ServicePlan
    currency: Currency
    price: number
}

type PaymentMethod = 'card' | 'sinpe'

const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback

export default function PaymentPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()

    // Datos transferidos desde la página anterior
    const state = location.state as LocationState | null
    const plan = state?.plan
    const currency = state?.currency ?? 'CRC'
    const price = state?.price ?? 0
    const [translatedPlans, setTranslatedPlans] = useState<Record<string, ServicePlan>>(
        () => plan ? { [i18n.language.split('-')[0]]: plan } : {},
    )

    useEffect(() => {
        if (!plan) return

        let isCurrent = true

        const items = [
            { entityId: plan.id, fieldName: 'name', originalText: plan.name },
            { entityId: plan.id, fieldName: 'description', originalText: plan.description },
        ]

        void Promise.all(SUPPORTED_LANGUAGES.map(async ({ code }) => {
            const sourceLanguage = i18n.language.split('-')[0]
            if (code === sourceLanguage) return

            try {
                const translations = await servicePlanService.translateBatch('service_plan', code, items)
                if (!isCurrent) return

                setTranslatedPlans((current) => ({
                    ...current,
                    [code]: {
                        ...plan,
                        name: translations[`${plan.id}:name`] ?? plan.name,
                        description: translations[`${plan.id}:description`] ?? plan.description,
                    },
                }))
            } catch (error: unknown) {
                if (isCurrent) {
                    notifyError(i18n.getFixedT(i18n.language)('services.translationError'), error)
                }
            }
        }))

        return () => {
            isCurrent = false
        }
    }, [i18n, plan])

    const displayPlan = translatedPlans[i18n.language.split('-')[0]] ?? plan

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
    const [loading, setLoading] = useState(false)

    // Campos del formulario y Facturación Electrónica (Obligatorios)
    const [email, setEmail] = useState('')
    const [clientName, setClientName] = useState('')
    const [identificationType, setIdentificationType] = useState('01')
    const [clientIdentification, setClientIdentification] = useState('')

    // Campos de Tarjeta
    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvc, setCvc] = useState('')
    const [cardHolder, setCardHolder] = useState('')

    // Campo SINPE Móvil
    const [phoneNumber, setPhoneNumber] = useState('')
    const [sinpeReference, setSinpeReference] = useState('')
    const [showSinpeModal, setShowSinpeModal] = useState(false)
    const [paymentResultStatus, setPaymentResultStatus] = useState<string>('')

    const identificationOptions = [
        { value: '01', label: t('services.physicalId') },
        { value: '02', label: t('services.legalId') },
        { value: '03', label: t('services.dimex') },
        { value: '04', label: t('services.nite') },
        { value: '05', label: t('services.passport') },
    ]

    if (!plan) {
        return (
            <div className="min-h-screen bg-bg-page">
                <Navbar />
                <Container className="py-20 text-center">
                    <p className="font-body text-body text-neutral-600">
                        {t('services.noPlanSelected', 'No se seleccionó ningún plan de servicio.')}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/services')}
                        className="mt-md rounded-full bg-green-500 px-lg h-11 font-body font-semibold text-white hover:bg-green-600"
                    >
                        {t('services.backToServices', 'Volver a Servicios')}
                    </button>
                </Container>
            </div>
        )
    }

    // Formateadores de inputs
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 16)
        setCardNumber(val.replace(/(.{4})/g, '$1 ').trim())
    }

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 4)
        if (val.length >= 2) {
            setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`)
        } else {
            setExpiry(val)
        }
    }

    const handleCardPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const intent = await servicePlanService.createPaymentIntent({
                priceId: plan.gatewayPriceId,
                customerEmail: email,
                description: `Pago de ${displayPlan?.name ?? plan.name}`
            })

            const [expMonth, expYear] = expiry.split('/')

            const confirmResult = await servicePlanService.confirmPayment({
                paymentIntentId: intent.id,
                cardNumber: cardNumber.replace(/\s/g, ''),
                expMonth: parseInt(expMonth, 10),
                expYear: parseInt(`20${expYear}`, 10),
                cvc: cvc,
                cardHolder: cardHolder,
                clientName: clientName,
                clientEmail: email,
                identificationType: identificationType,
                clientIdentification: identificationType === '05' ? clientIdentification.trim() : clientIdentification.replace(/\D/g, ''),
                totalAmount: price,
                description: `Suscripción: ${displayPlan?.name ?? plan.name}`,
                language: i18n.resolvedLanguage ?? i18n.language,
                cabysCode: plan.cabysCode || "9310211050502",
                taxRate: plan.taxRate || 4.0
            })

            setLoading(false)

            if (confirmResult.status === 'succeeded') {
                navigate('/payment-success');
            } else {
                navigate('/payment-failed');
            }
        } catch (err: unknown) {
            setLoading(false)
            console.error("Error en el pago:", err)
            notifyError(errorMessage(err, "Hubo un error al procesar el pago o la factura."))
        }
    }

    const handleSinpePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const intent = await servicePlanService.createPaymentIntent({
                priceId: plan.gatewayPriceId,
                customerEmail: email,
                description: `Pago SINPE de ${displayPlan?.name ?? plan.name}`
            })

            const confirmResult = await servicePlanService.confirmSinpePayment({
                paymentIntentId: intent.id,
                phoneNumber: phoneNumber.replace(/\s/g, ''),
                sinpeReference: sinpeReference,
                clientName: clientName,
                clientEmail: email,
                identificationType: identificationType,
                clientIdentification: identificationType === '05' ? clientIdentification.trim() : clientIdentification.replace(/\D/g, ''),
                totalAmount: price,
                description: `Suscripción SINPE: ${displayPlan?.name ?? plan.name}`,
                language: i18n.resolvedLanguage ?? i18n.language,
                cabysCode: plan.cabysCode || "9310211050502",
                taxRate: plan.taxRate || 4.0,
                currency: currency
            })

            setLoading(false)
            setPaymentResultStatus(confirmResult?.status || '')

            if (confirmResult?.status === 'succeeded') {
                navigate('/payment-success')
            } else if (['pending', 'processing', 'requires_action'].includes(confirmResult?.status)) {
                setShowSinpeModal(true)
            } else {
                navigate('/payment-failed')
            }
        } catch (err: unknown) {
            setLoading(false)
            console.error("Error en el pago SINPE:", err)
            notifyError(errorMessage(err, "Hubo un error al procesar el pago con SINPE."))
            navigate('/payment-failed')
        }
    }

    return (
        <div className="min-h-screen bg-bg-page pb-20">
            <Navbar />

            <Container className="pt-8 flex">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-xs font-body text-body-sm font-semibold text-green-500 transition hover:text-green-600"
                >
                    <ArrowLeftIcon size={18} />
                    {t('services.back')}
                </button>
            </Container>

            <Container className="mt-6 grid grid-cols-1 gap-xl lg:grid-cols-12">
                <main className="lg:col-span-7">
                    <div className="rounded-[20px] border border-neutral-200 bg-white p-lg shadow-sm sm:p-xl">
                        <h1 className="m-0 font-heading text-h3 font-bold leading-tight text-heading text-left">
                            {t('services.finalizePurchase')}
                        </h1>
                        <p className="mt-xs font-body text-body-sm text-neutral-500 text-left">
                            {t('services.completeDetails')}
                        </p>

                        {/* SECCIÓN: Datos Obligatorios de Facturación Electrónica */}
                        <div className="mt-md space-y-md border-b border-neutral-200 pb-lg">
                            <div>
                                <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                    {t('services.fullNameOrCompany')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Sofía Rodríguez Mora"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                />
                                <FieldHint>{t('fields.payment.fullName.hint')}</FieldHint>
                            </div>

                            <div>
                                <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                    {t('services.email')}
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="juan@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                />
                                <FieldHint>{t('fields.payment.email.hint')}</FieldHint>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                                <div>
                                    <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                        {t('services.identificationType')}
                                    </label>
                                    <div className="mt-xs">
                                        <Select
                                            value={identificationType}
                                            onChange={(val) => setIdentificationType(val)}
                                            options={identificationOptions}
                                        />
                                    </div>
                                    <FieldHint>{t('fields.payment.identificationType.hint')}</FieldHint>
                                </div>

                                <div>
                                    <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                        {t('services.identificationNumber',)}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={identificationType === '05' ? t('services.passportPlaceholder') : '105670890'}
                                        value={clientIdentification}
                                        onChange={(e) => setClientIdentification(e.target.value)}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                    />
                                    <FieldHint>{t('fields.payment.identificationNumber.hint')}</FieldHint>
                                </div>
                            </div>
                        </div>

                        <div className="mt-lg grid grid-cols-2 gap-sm">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                className={`flex h-11 items-center justify-center gap-xs rounded-full border border-green-500 px-md font-body text-body-sm font-semibold transition-colors duration-300 ${paymentMethod === 'card'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-transparent text-heading hover:bg-green-50'
                                    }`}
                            >
                                <CreditCardIcon size={20} />
                                {t('services.card')}
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('sinpe')}
                                className={`flex h-11 items-center justify-center gap-xs rounded-full border border-green-500 px-md font-body text-body-sm font-semibold transition-colors duration-300 ${paymentMethod === 'sinpe'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-transparent text-heading hover:bg-green-50'
                                    }`}
                            >
                                <SmartphoneIcon size={20} />
                                {t('services.sinpeMovil')}
                            </button>
                        </div>

                        {paymentMethod === 'card' && (
                            <form onSubmit={handleCardPayment} className="mt-lg space-y-md">
                                <div>
                                    <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                        {t('services.cardHolderName')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Juan Pérez"
                                        value={cardHolder}
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                    />
                                    <FieldHint>{t('fields.payment.cardHolderName.hint')}</FieldHint>
                                </div>

                                <div>
                                    <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                        {t('services.cardNumber')}
                                    </label>
                                    <div className="relative mt-xs">
                                        <input
                                            type="text"
                                            required
                                            placeholder="0000 0000 0000 0000"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            className="w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                        />
                                        <CreditCardIcon size={20} className="absolute right-md top-1/2 -translate-y-1/2 text-neutral-400" />
                                    </div>
                                    <FieldHint>{t('fields.payment.cardNumber.hint')}</FieldHint>
                                </div>

                                <div className="grid grid-cols-2 gap-md">
                                    <div>
                                        <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                            {t('services.expiry')}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="MM/AA"
                                            value={expiry}
                                            onChange={handleExpiryChange}
                                            className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                        />
                                        <FieldHint>{t('fields.payment.expiry.hint')}</FieldHint>
                                    </div>

                                    <div>
                                        <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                            {t('services.cvc')}
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            maxLength={4}
                                            placeholder="123"
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                                            className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                        />
                                        <FieldHint>{t('fields.payment.cvc.hint')}</FieldHint>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-lg flex h-11 w-full items-center justify-center gap-xs rounded-full bg-orange-500 font-body text-body-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                                >
                                    <LockIcon size={18} />
                                    {loading ? t('services.processing') : `${t('services.pay')} ${currencySymbol(currency)}${formatCurrency(price, currency, i18n.language)}`}
                                </button>
                            </form>
                        )}

                        {paymentMethod === 'sinpe' && currency === 'CRC' && (
                            <form onSubmit={handleSinpePayment} className="mt-lg space-y-md">
                                <div className="rounded-2xl bg-neutral-50 p-md">
                                    <p className="font-body text-body-sm text-neutral-600 text-left">
                                        {t('services.sinpeInstructions')}
                                    </p>
                                    <div className="mt-sm flex items-center justify-between border-t border-neutral-200 pt-sm">
                                        <span className="font-body text-body-sm font-semibold text-heading">
                                            {t('services.destinationNumber')}
                                        </span>
                                        <span className="font-heading text-h4 font-bold text-green-500">+506 8888-8888</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-body text-body-sm font-semibold text-heading flex">
                                        {t('services.senderPhone')}
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="88888888"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                    />
                                    <FieldHint>{t('fields.payment.senderPhone.hint')}</FieldHint>
                                </div>

                                <div>
                                    <label className="font-body text-body-sm font-semibold text-heading flex">
                                        {t('services.referenceNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. 123456789"
                                        value={sinpeReference}
                                        onChange={(e) => setSinpeReference(e.target.value)}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                    />
                                    <FieldHint>{t('fields.payment.referenceNumber.hint')}</FieldHint>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-lg flex h-11 w-full items-center justify-center gap-xs rounded-full bg-orange-500 font-body text-body-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                                >
                                    <CheckCheckIcon size={18} />
                                    {loading ? t('services.verify') : t('services.confirmSinpe')}
                                </button>
                            </form>
                        )}
                    </div>
                </main>

                <aside className="lg:col-span-5">
                    <div className="rounded-[20px] border border-neutral-200 bg-white p-lg shadow-sm sm:p-xl">
                        <h2 className="m-0 font-heading text-h3 font-bold leading-tight text-heading text-left">
                            {t('services.orderSummary')}
                        </h2>

                        <div className="mt-md flex gap-md border-b border-neutral-100 pb-md">
                            {plan.imageUrl && (
                                <img
                                    src={plan.imageUrl}
                                    alt={plan.imageAlt || displayPlan?.name || plan.name}
                                    className="h-16 w-16 rounded-xl object-cover"
                                />
                            )}
                            <div>
                                <h3 className="font-heading text-body font-bold text-green-500 text-left">{displayPlan?.name ?? plan.name}</h3>
                                <p className="font-body text-caption text-neutral-500 line-clamp-1 text-left">{displayPlan?.description ?? plan.description}</p>
                            </div>
                        </div>

                        <div className="mt-md space-y-xs font-body text-body-sm text-neutral-600">
                            <div className="flex justify-between">
                                <span>{t('services.subtotal')}</span>
                                <span>{currencySymbol(currency)}{formatCurrency(price, currency, i18n.language)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                                <span>{t('services.taxes')}</span>
                                <span>{t('services.included')}</span>
                            </div>
                        </div>

                        <div className="mt-lg flex items-center justify-between border-t border-neutral-200 pt-md">
                            <span className="font-heading text-body font-bold text-heading">
                                {t('services.totalToPay')}
                            </span>
                            <span className="font-heading text-h3 font-bold text-green-500">
                                <AnimatedNumber
                                    value={price}
                                    format={(n) => `${currencySymbol(currency)}${formatCurrency(n, currency, i18n.language)}`}
                                />
                            </span>
                        </div>
                    </div>
                </aside>
            </Container>
            <SinpeModal
                isOpen={showSinpeModal}
                onClose={() => setShowSinpeModal(false)}
                planName={displayPlan?.name ?? plan.name}
                phoneNumber={phoneNumber}
                sinpeReference={sinpeReference}
                onConfirm={() => {
                    setShowSinpeModal(false)
                    if (paymentResultStatus === 'failed' || phoneNumber.includes('88889521')) {
                        navigate('/payment-failed')
                    } else {
                        navigate('/payment-success')
                    }
                }}
                onCancel={() => {
                    setShowSinpeModal(false)
                    navigate('/services')
                }}
            />
        </div>
    )
}