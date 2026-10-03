import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CircleCheck } from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'
import { useEffect } from 'react'

function PaymentSuccessPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    const channel = new BroadcastChannel('payment_channel')
    channel.postMessage('PAYMENT_SUCCESS')
    channel.close()
  }, [])

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[600px] items-center justify-center px-[30px] py-[60px]">
        <div className="flex flex-col items-center gap-lg text-center">
          <CircleCheck size={80} className="text-green-500" />

          <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-green-500 md:text-h1">
            {t('paymentSuccess.title')}
          </h1>

          <p className="m-0 max-w-[460px] font-body text-body-sm leading-[1.6] text-neutral-500">
            {t('paymentSuccess.description')}
          </p>

          <button
            type="button"
            onClick={() => navigate('/services')}
            className="mt-sm rounded-full bg-green-500 px-xl py-md font-body text-body-sm font-semibold text-white transition hover:bg-green-600"
          >
            {t('paymentSuccess.backToServices')}
          </button>
        </div>
      </section>
    </div>
  )
}

export default PaymentSuccessPage
