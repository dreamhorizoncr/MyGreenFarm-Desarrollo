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
import type { PaymentQuote } from '../types/servicePlan.ts'
import { currencySymbol, formatCurrency } from '../utils/currency.ts'
import { servicePlanService } from '../services/servicePlan.ts'
import { notifyError } from '../utils/notifications.ts'
import { getErrorMessage } from '../utils/error.ts'
import { SinpeModal } from '../components/SinpeModal'
import Select from '../components/ui/Select.tsx'
import FieldHint from '../components/ui/FieldHint.tsx'
import AutoHeight from '../components/ui/AutoHeight.tsx'
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
    const currency = plan?.currency ?? state?.currency ?? 'CRC'
    const planCurrency = currency
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
    const [couponCode, setCouponCode] = useState('')
    const [quote, setQuote] = useState<PaymentQuote | null>(null)
    const [quoteError, setQuoteError] = useState('')
    const [quoteLoading, setQuoteLoading] = useState(false)
    const [saveSubscription, setSaveSubscription] = useState(false)

    const isRecurring = Boolean(plan && !['ONE_TIME', 'DAILY'].includes(plan.type.toUpperCase()))

    useEffect(() => {
        if (!plan) return
        let isCurrent = true
        setQuote(null)
        setQuoteError('')
        setQuoteLoading(true)
        
        const timeout = window.setTimeout(() => {

            const payload = {
                servicePlanId: plan.id,
                couponCode: couponCode.trim() || undefined,
                paymentMethod,
                cabysCode: plan.cabysCode, 
            }

            console.log("PAYLOAD ENVIADO A /webhooks/quote:", payload)

            void servicePlanService.quoteVariablePlan(payload).then((result) => {
                if (!isCurrent) return
                console.log("COTIZACIÓN RECIBIDA DEL BACKEND:", result)
                setQuote(result)
            }).catch((error: unknown) => {
                console.error("ERROR DE COTIZACIÓN DETALLADO:", error)
                if (error && typeof error === 'object' && 'response' in error) {
                    console.error("DETALLE TÉCNICO DEL ERROR 400:", (error as any).response?.data)
                }
                if (isCurrent) setQuoteError(getErrorMessage(error))
            }).finally(() => {
                if (isCurrent) setQuoteLoading(false)
            })
        }, couponCode.trim() ? 350 : 0)

        return () => {
            isCurrent = false
            window.clearTimeout(timeout)
        }
    }, [couponCode, paymentMethod, plan])

    const [email, setEmail] = useState('')
    const [clientName, setClientName] = useState('')
    const [identificationType, setIdentificationType] = useState('01')
    const [clientIdentification, setClientIdentification] = useState('')

    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvc, setCvc] = useState('')
    const [cardHolder, setCardHolder] = useState('')

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

    // const [expiryMonth = '', expiryYear = ''] = expiry.split('/')
    // const billingReady =
    //     clientName.trim() !== '' &&
    //     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    //     clientIdentification.trim() !== ''
    // const cardReady =
    //     billingReady &&
    //     cardHolder.trim() !== '' &&
    //     cardNumber.replace(/\D/g, '').length >= 13 &&
    //     Number(expiryMonth) >= 1 && Number(expiryMonth) <= 12 && expiryYear.length === 2 &&
    //     cvc.length >= 3
    // const sinpeReady = billingReady && phoneNumber.length === 8 && sinpeReference.trim() !== ''

    const handleCardPayment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientName.trim() || !email.trim() || !clientIdentification.trim()) {
            notifyError(t('services.invoiceFieldsRequired'))
            return
        }
        setLoading(true)

        try {
            const intent = await servicePlanService.createPaymentIntent({
                servicePlanId: plan.id,
                customerEmail: email,
                description: `Pago de ${displayPlan?.name ?? plan.name}`,
                paymentMethod: 'card',
                language: i18n.resolvedLanguage ?? i18n.language,
                couponCode: couponCode.trim() || undefined,
                saveSubscription,
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
                description: `Suscripción: ${displayPlan?.name ?? plan.name}`,
                language: i18n.resolvedLanguage ?? i18n.language,
                servicePlanId: plan.id,
                couponCode: couponCode.trim() || undefined,
                saveSubscription,
            })

            setLoading(false)

            if (confirmResult.status === 'succeeded') {
                if (confirmResult.subscriptionError) notifyError(confirmResult.subscriptionError)
                if (confirmResult.invoiceError) notifyError(confirmResult.invoiceError)
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
        if (!clientName.trim() || !email.trim() || !clientIdentification.trim()) {
            notifyError(t('services.invoiceFieldsRequired'))
            return
        }
        setLoading(true)

        try {
            const intent = await servicePlanService.createPaymentIntent({
                servicePlanId: plan.id,
                customerEmail: email,
                description: `Pago SINPE de ${displayPlan?.name ?? plan.name}`,
                paymentMethod: 'sinpe',
                language: i18n.resolvedLanguage ?? i18n.language,
                couponCode: couponCode.trim() || undefined,
            })

            const confirmResult = await servicePlanService.confirmSinpePayment({
                paymentIntentId: intent.id,
                phoneNumber: phoneNumber.replace(/\s/g, ''),
                sinpeReference: sinpeReference,
                clientName: clientName,
                clientEmail: email,
                identificationType: identificationType,
                clientIdentification: identificationType === '05' ? clientIdentification.trim() : clientIdentification.replace(/\D/g, ''),
                description: `Suscripción SINPE: ${displayPlan?.name ?? plan.name}`,
                language: i18n.resolvedLanguage ?? i18n.language,
                currency: planCurrency,
                servicePlanId: plan.id,
                couponCode: couponCode.trim() || undefined,
            })

            setLoading(false)
            setPaymentResultStatus(confirmResult?.status || '')

            if (confirmResult?.status === 'succeeded') {
                if (confirmResult.invoiceError) notifyError(confirmResult.invoiceError)
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
                        <div className="mt-md space-y-md">
                            <h2 className="font-heading text-h4 font-bold text-heading text-left">
                                {t('services.invoiceInformation')}
                            </h2>
                            <div>
                                <label className="block font-body text-body-sm font-semibold text-heading text-left">
                                    {t('services.fullNameOrCompany')}
                                </label>
                                <input
                                    type="text"
                                    required
                                    form={paymentMethod === 'card' ? 'card-payment-form' : 'sinpe-payment-form'}
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
                                    form={paymentMethod === 'card' ? 'card-payment-form' : 'sinpe-payment-form'}
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
                                        form={paymentMethod === 'card' ? 'card-payment-form' : 'sinpe-payment-form'}
                                        placeholder={identificationType === '05' ? t('services.passportPlaceholder') : '105670890'}
                                        value={clientIdentification}
                                        onChange={(e) => setClientIdentification(e.target.value)}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 bg-white font-body text-body-sm font-normal outline-none focus:border-heading"
                                    />
                                    <FieldHint>{t('fields.payment.identificationNumber.hint')}</FieldHint>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="mt-lg rounded-[28px] border border-neutral-200 bg-white p-lg shadow-sm sm:p-xl">
                        <h2 className="font-heading text-h4 font-bold text-heading text-left">
                            {t('services.paymentInformation')}
                        </h2>
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
                                disabled={planCurrency === 'USD'}
                                onClick={() => {
                                    setSaveSubscription(false)
                                    setPaymentMethod('sinpe')
                                }}
                                className={`flex items-center justify-center gap-xs rounded-2xl border p-md font-body text-body-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${paymentMethod === 'sinpe'
                                    ? 'border-green-500 bg-green-50 text-green-500 shadow-sm'
                                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                                    }`}
                            >
                                <SmartphoneIcon size={20} />
                                {t('services.sinpeMovil')}
                            </button>
                        </div>

                        <AutoHeight className="-mx-1 flow-root px-1 pb-1">
                        {paymentMethod === 'card' && (
                            <form id="card-payment-form" onSubmit={handleCardPayment} className="mt-lg space-y-md">
                                {isRecurring && (
                                    <label className="flex items-start gap-sm rounded-xl border border-neutral-200 p-md font-body text-body-sm text-heading">
                                        <input
                                            type="checkbox"
                                            checked={saveSubscription}
                                            onChange={(event) => setSaveSubscription(event.target.checked)}
                                            className="mt-1 accent-green-600"
                                        />
                                        <span>
                                            <span className="block font-semibold">{t('services.saveSubscription')}</span>
                                            <span className="mt-2xs block text-caption text-neutral-500">
                                                {t('services.subscriptionTerms')}
                                            </span>
                                        </span>
                                    </label>
                                )}
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
                                    disabled={loading || quoteLoading || !quote}
                                    className="mt-lg flex h-12 w-full items-center justify-center gap-xs rounded-full bg-orange-500 font-body text-body font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                                >
                                    <LockIcon size={18} />
                                    {loading
                                        ? t('services.processing')
                                        : quoteLoading
                                            ? t('common.loading')
                                            : quote
                                                ? `${t('services.pay')} ${currencySymbol(currency)}${formatCurrency(quote.totalAmount, currency, i18n.language)}`
                                                : t('services.pay')}
                                </button>
                            </form>
                        )}

                        {paymentMethod === 'sinpe' && planCurrency === 'CRC' && (
                            <form id="sinpe-payment-form" onSubmit={handleSinpePayment} className="mt-lg space-y-md">
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
                                    disabled={loading || quoteLoading || !quote}
                                    className="mt-lg flex h-12 w-full items-center justify-center gap-xs rounded-full bg-orange-500 font-body text-body font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                                >
                                    <CheckCheckIcon size={18} />
                                    {loading ? t('services.verify') : t('services.confirmSinpe')}
                                </button>
                            </form>
                        )}
                        </AutoHeight>
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
                            {quoteError && <p role="alert" className="font-body text-caption text-danger">{quoteError}</p>}
                            <div className="flex justify-between">
                                <span>{t('services.subtotal')}</span>
                                <span>{quote ? `${currencySymbol(currency)}${formatCurrency(quote.baseAmount, currency, i18n.language)}` : '—'}</span>
                            </div>
                            {quote && quote.discountAmount > 0 && (
                                <div className="flex justify-between text-green-700">
                                    <span>{t('services.discount')}</span>
                                    <span>-{currencySymbol(currency)}{formatCurrency(quote.discountAmount, currency, i18n.language)}</span>
                                </div>
                            )}
                            {quote && quote.processingFeeAmount > 0 && (
                                <div className="flex justify-between">
                                    <span>{t('services.processingFee')}</span>
                                    <span>{currencySymbol(currency)}{formatCurrency(quote.processingFeeAmount, currency, i18n.language)}</span>
                                </div>
                            )}
                            {quote && (
                                <>
                                    {quote.exchangeRate !== null && (
                                        <div className="flex justify-between">
                                            <span>{t('services.bacExchangeRate')}</span>
                                            <span>
                                                {currencySymbol('CRC')}{formatCurrency(
                                                    quote.exchangeRate,
                                                    'CRC',
                                                    i18n.language,
                                                )} / USD
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span>{t('services.serviceTax', { rate: quote.taxRate })}</span>
                                        <span>{currencySymbol(currency)}{formatCurrency(quote.serviceTaxAmount, currency, i18n.language)}</span>
                                    </div>
                                    {quote.cabysDescription && (
                                        <p className="pl-sm text-caption text-neutral-500">
                                            {quote.cabysDescription.split(' / ').at(-1)}
                                        </p>
                                    )}
                                    <div className="flex justify-between">
                                        <span>{t('services.onvoTax')}</span>
                                        <span>{currencySymbol(currency)}{formatCurrency(quote.processingFeeTaxAmount, currency, i18n.language)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-lg flex items-center justify-between border-t border-neutral-200 pt-md">
                            <span className="font-heading text-body font-bold text-heading">
                                {t('services.totalToPay')}
                            </span>
                            <span className="font-heading text-h3 font-bold text-green-500">
                                <AnimatedNumber
                                    value={quote?.totalAmount ?? 0}
                                    format={(n) => quote
                                        ? `${currencySymbol(currency)}${formatCurrency(n, currency, i18n.language)}`
                                        : '—'}
                                />
                            </span>
                        </div>
                    </div>

                    {plan.couponCode && (
                        <div className="mt-md rounded-[28px] border border-neutral-200 bg-white p-lg shadow-sm">
                            <label className="block font-body text-caption font-semibold text-heading text-left">
                                {t('services.couponCode')}
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                                    maxLength={60}
                                    placeholder={t('services.couponPlaceholder')}
                                    className="mt-xs w-full rounded-xl border border-neutral-200 px-md h-11 font-body text-body-sm outline-none focus:border-green-500"
                                />
                            </label>
                        </div>
                    )}
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