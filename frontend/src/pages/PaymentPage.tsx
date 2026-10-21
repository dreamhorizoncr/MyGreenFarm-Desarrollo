import { useState } from 'react'
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

interface LocationState {
    plan: ServicePlan
    currency: Currency
    price: number
}

type PaymentMethod = 'card' | 'sinpe'

export default function PaymentPage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()

    // Datos transferidos desde la página anterior
    const state = location.state as LocationState | null
    const plan = state?.plan
    const currency = state?.currency ?? 'CRC'
    const price = state?.price ?? 0

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
    const [loading, setLoading] = useState(false)

    // Campos del formulario
    const [email, setEmail] = useState('')
    const [cardNumber, setCardNumber] = useState('')
    const [expiry, setExpiry] = useState('')
    const [cvc, setCvc] = useState('')
    const [cardHolder, setCardHolder] = useState('')

    // Campo SINPE Móvil
    const [phoneNumber, setPhoneNumber] = useState('')
    const [sinpeReference, setSinpeReference] = useState('')
    const [showSinpeModal, setShowSinpeModal] = useState(false)
    const [paymentResultStatus, setPaymentResultStatus] = useState<string>('')

    if (!plan) {
        return (
            <div className="min-h-screen bg-bg-page">
                <Navbar />
                <Container className="py-20 text-center">
                    <p className="font-body text-body text-neutral-600">No se seleccionó ningún plan de servicio.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/services')}
                        className="mt-md rounded-full bg-green-500 px-lg py-sm font-body font-semibold text-white hover:bg-green-600"
                    >
                        Volver a Servicios
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
            // 1. Crear la intención de pago en el backend
            const intent = await servicePlanService.createPaymentIntent({
                priceId: plan.gatewayPriceId,
                customerEmail: email,
                description: `Pago de ${plan.name}`
            })

            const [expMonth, expYear] = expiry.split('/')

            // 2. Enviar los datos de los inputs al backend para que este confirme el pago en Onvo
            const confirmResult = await servicePlanService.confirmPayment({
                paymentIntentId: intent.id,
                cardNumber: cardNumber.replace(/\s/g, ''),
                expMonth: parseInt(expMonth, 10),
                expYear: parseInt(`20${expYear}`, 10),
                cvc: cvc,
                cardHolder: cardHolder
            })

            setLoading(false)

            if (confirmResult.status === 'succeeded') {
                navigate('/payment-success');
            } else {
                navigate('/payment-failed');
            }
        } catch (err: any) {
            setLoading(false)
            console.error("Error en el pago:", err)
            notifyError(err?.message || "Hubo un error al procesar el pago.")
        }
    }

    const handleSinpePayment = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Crear la intención de pago
            const intent = await servicePlanService.createPaymentIntent({
                priceId: plan.gatewayPriceId,
                customerEmail: email,
                description: `Pago SINPE de ${plan.name}`
            })

            // 2. Confirmar la intención con SINPE
            const confirmResult = await servicePlanService.confirmSinpePayment({
                paymentIntentId: intent.id,
                phoneNumber: phoneNumber.replace(/\s/g, ''),
                sinpeReference: sinpeReference
            })

            setLoading(false)
            setPaymentResultStatus(confirmResult?.status || '')

            const status = confirmResult?.status;

            if (confirmResult?.status === 'succeeded') {
                navigate('/payment-success')
            } else if (confirmResult?.status === 'pending' || confirmResult?.status === 'processing' || confirmResult?.status === 'requires_action') {
                setShowSinpeModal(true)
            } else {
                navigate('/payment-failed')
            }
        } catch (err: any) {
            setLoading(false)
            console.error("Error en el pago SINPE:", err)
            notifyError(err?.message || "Hubo un error al procesar el pago con SINPE.")
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
                    {t('common.back', 'Volver')}
                </button>
            </Container>

            <Container className="mt-6 grid grid-cols-1 gap-xl lg:grid-cols-12">
                {/* COLUMNA IZQUIERDA: Formulario de Pago */}
                <main className="lg:col-span-7">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-lg shadow-sm sm:p-xl">
                        <h1 className="font-heading text-h3 font-bold text-heading text-left my-2">
                            Finalizar Compra
                        </h1>
                        <p className="font-body text-body-sm text-neutral-500 text-left">
                            Selecciona tu método de pago preferido para completar la suscripción.
                        </p>

                        <div className="mt-lg grid grid-cols-2 gap-sm">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('card')}
                                className={`flex items-center justify-center gap-xs rounded-2xl border p-md font-body text-body-sm font-semibold transition ${paymentMethod === 'card'
                                    ? 'border-green-500 bg-green-50 text-green-500 shadow-sm'
                                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                                    }`}
                            >
                                <CreditCardIcon size={20} className={paymentMethod === 'card' ? 'text-green-500' : 'text-neutral-400'} />
                                Tarjeta
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('sinpe')}
                                className={`flex items-center justify-center gap-xs rounded-2xl border p-md font-body text-body-sm font-semibold transition ${paymentMethod === 'sinpe'
                                    ? 'border-green-500 bg-green-50 text-green-500 shadow-sm'
                                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                                    }`}
                            >
                                <SmartphoneIcon size={20} className={paymentMethod === 'sinpe' ? 'text-green-500' : 'text-neutral-400'} />
                                SINPE Móvil
                            </button>
                        </div>

                        {paymentMethod === 'card' && (
                            <form onSubmit={handleCardPayment} className="mt-lg space-y-md">
                                <div>
                                    <label className="block font-body text-caption font-semibold text-heading flex">
                                        Correo Electrónico
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="ejemplo@correo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-body text-caption font-semibold text-heading flex">
                                        Nombre en la Tarjeta
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Juan Pérez"
                                        value={cardHolder}
                                        onChange={(e) => setCardHolder(e.target.value)}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="block font-body text-caption font-semibold text-heading flex">
                                        Número de Tarjeta
                                    </label>
                                    <div className="relative mt-xs">
                                        <input
                                            type="text"
                                            required
                                            placeholder="0000 0000 0000 0000"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            className="w-full rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        />
                                        <CreditCardIcon size={20} className="absolute right-md top-1/2 -translate-y-1/2 text-neutral-400" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-md">
                                    <div>
                                        <label className="block font-body text-caption font-semibold text-heading flex">
                                            Expiración (MM/AA)
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="MM/AA"
                                            value={expiry}
                                            onChange={handleExpiryChange}
                                            className="mt-xs w-full rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-body text-caption font-semibold text-heading flex">
                                            CVC / CVV
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            maxLength={4}
                                            placeholder="123"
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                                            className="mt-xs w-full rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-lg flex h-12 w-full items-center justify-center gap-xs rounded-full bg-orange-500 font-body text-body font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                                >
                                    <LockIcon size={18} />
                                    {loading ? 'Procesando...' : `Pagar ${currencySymbol(currency)}${formatCurrency(price, currency, i18n.language)}`}
                                </button>
                            </form>
                        )}

                        {paymentMethod === 'sinpe' && (
                            <form onSubmit={handleSinpePayment} className="mt-lg space-y-md">
                                <div className="rounded-2xl bg-neutral-50 p-md">
                                    <p className="font-body text-body-sm text-neutral-600 text-left">
                                        Realiza la transferencia por el monto exacto al número SINPE Móvil oficial y adjunta el comprobante o número de referencia.
                                    </p>
                                    <div className="mt-sm flex items-center justify-between border-t border-neutral-200 pt-sm">
                                        <span className="font-body text-body-sm font-semibold text-heading">Número Destino:</span>
                                        <span className="font-heading text-h4 font-bold text-green-500">+506 8888-8888</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-body text-caption font-semibold text-heading flex">
                                        Número de Teléfono Emisor
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="88888888"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    />
                                </div>

                                <div>
                                    <label className="font-body text-caption font-semibold text-heading flex">
                                        Número de Referencia / Comprobante
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. 123456789"
                                        value={sinpeReference}
                                        onChange={(e) => setSinpeReference(e.target.value)}
                                        className="mt-xs w-full rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-lg flex h-12 w-full items-center justify-center gap-xs rounded-full bg-orange-500 font-body text-body font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                                >
                                    <CheckCheckIcon size={18} />
                                    {loading ? 'Verificando...' : 'Confirmar Pago SINPE'}
                                </button>
                            </form>
                        )}
                    </div>
                </main>

                <aside className="lg:col-span-5">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-lg shadow-sm">
                        <h2 className="font-heading text-h4 font-bold text-heading">Resumen de la Orden</h2>

                        <div className="mt-md flex gap-md border-b border-neutral-100 pb-md">
                            {plan.imageUrl && (
                                <img
                                    src={plan.imageUrl}
                                    alt={plan.name}
                                    className="h-16 w-16 rounded-xl object-cover"
                                />
                            )}
                            <div>
                                <h3 className="font-heading text-body font-bold text-green-500 text-left">{plan.name}</h3>
                                <p className="font-body text-caption text-neutral-500 line-clamp-1 text-left">{plan.description}</p>
                            </div>
                        </div>

                        <div className="mt-md space-y-xs font-body text-body-sm text-neutral-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{currencySymbol(currency)}{formatCurrency(price, currency, i18n.language)}</span>
                            </div>
                            <div className="flex justify-between text-neutral-400">
                                <span>Impuestos (IVA)</span>
                                <span>Incluido</span>
                            </div>
                        </div>

                        <div className="mt-lg flex items-center justify-between border-t border-neutral-200 pt-md">
                            <span className="font-heading text-body font-bold text-heading">Total a Pagar</span>
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
                planName={plan.name}
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