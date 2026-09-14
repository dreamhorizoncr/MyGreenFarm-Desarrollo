import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TriangleAlert } from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'

function PaymentFailedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[600px] items-center justify-center px-[30px] py-[60px]">
        <div className="flex flex-col items-center gap-lg text-center">
          <TriangleAlert size={80} className="text-danger" />

          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-danger md:text-[46px]">
            {t('paymentFailed.title')}
          </h1>

          <p className="m-0 max-w-[460px] font-body text-[15px] leading-[1.6] text-neutral-500">
            {t('paymentFailed.description')}
          </p>

          <button
            type="button"
            onClick={() => navigate('/services')}
            className="mt-sm rounded-full bg-green-500 px-xl py-md font-body text-sm font-semibold text-white transition hover:bg-green-600"
          >
            {t('paymentFailed.retry')}
          </button>
        </div>
      </section>
    </div>
  )
}

export default PaymentFailedPage
