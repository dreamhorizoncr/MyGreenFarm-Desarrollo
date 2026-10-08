import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRightIcon } from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import ApplyVacancyModal from '../components/ApplyVacancyModal.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import { useVacancies } from '../hooks/useVacancies.ts'
import { useCurriculums } from '../hooks/useCurriculums.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { notify } from '../utils/notifications.ts'
import type { OptionalApplicationField } from '../types/vacancy.ts'
import type { ApplicationInput } from '../types/curriculum.ts'

interface ApplyTarget {
  title: string
  vacancyId: string | null
  requiredFields: OptionalApplicationField[]
}

const SPONTANEOUS_REQUIRED_FIELDS: OptionalApplicationField[] = ['file']

interface VacancyCardProps {
  title?: string
  description?: string
  onApply?: () => void
  loading?: boolean
}

function VacancyCard({ title, description, onApply, loading = false }: Readonly<VacancyCardProps>) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow">
        <Skeleton shape="line" className="h-6 w-3/4" />
        <div className="mt-sm flex flex-1 flex-col gap-2xs">
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-2/3" />
        </div>
        <div className="mt-md flex justify-end">
          <Skeleton shape="pill" className="h-11 w-28" />
        </div>
      </article>
    )
  }

  return (
    <article className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow transition hover:shadow-lg">
      <h2 className="m-0 font-heading text-xl font-bold leading-snug text-heading">
        {title}
      </h2>

      <p className="mt-sm flex-1 font-body text-body-sm text-body-text">
        {description}
      </p>

      <div className="mt-md flex justify-end">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-11 items-center gap-xs whitespace-nowrap rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          {t('vacancies.apply')}
          <ArrowRightIcon
            size={16}
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </article>
  )
}

function VacanciesPage() {
  const { t, i18n } = useTranslation()

  const { vacancies, loading, error, fetchVacancies } = useVacancies()
  const { submitApplication } = useCurriculums()

  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null)
  const [applicationSent, setApplicationSent] = useState(false)
  const { closing: sentClosing, requestClose: requestCloseSent } = useModalExit(() => setApplicationSent(false))

  useEffect(() => {
    void fetchVacancies(i18n.language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  const openVacancies = vacancies.filter((v) => v.isOpen)

  const handleApplySubmit = async (data: ApplicationInput) => {
    try {
      await submitApplication(data)
      setApplicationSent(true)
    } catch (err) {
      notify.error({
        title: t('vacancies.applyErrorToastTitle'),
        description: t('vacancies.applyErrorToastDescription'),
      })
      throw err
    }
  }

  const openSpontaneousApply = () => {
    setApplyTarget({
      title: t('vacancies.spontaneousApplyTitle'),
      vacancyId: null,
      requiredFields: SPONTANEOUS_REQUIRED_FIELDS,
    })
  }

  return (
    <div id="vacancies-page" className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[280px] items-center bg-green-500 px-7.5 py-10 text-center text-white md:min-h-[320px]">
        <div className="mx-auto w-full max-w-175">
          <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-white md:text-h1">
            {t('vacancies.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-140 font-body text-body-sm leading-[1.6] text-white md:text-body-sm">
            {t('vacancies.subtitle')}
          </p>
        </div>
      </section>

      <main>
        <Container className="py-10 md:py-12">
          {loading && (
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              <VacancyCard loading />
              <VacancyCard loading />
            </div>
          )}
          {error && <p className="m-0 p-xl text-center font-body text-body text-danger">{error}</p>}

          {!loading && !error && (
            openVacancies.length === 0 ? (
              <div className="mx-auto max-w-140 rounded-2xl border border-neutral-200 bg-white p-xl text-center">
                <p className="m-0 font-body text-body text-neutral-500">
                  {t('vacancies.noVacancies')}
                </p>

                <h2 className="mt-lg font-heading text-xl font-bold leading-snug text-heading">
                  {t('vacancies.spontaneousTitle')}
                </h2>
                <p className="mt-sm font-body text-body-sm text-body-text">
                  {t('vacancies.spontaneousDescription')}
                </p>

                <div className="mt-lg flex justify-center">
                  <button
                    type="button"
                    onClick={openSpontaneousApply}
                    className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
                  >
                    {t('vacancies.spontaneousCta')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                {openVacancies.map((vacancy) => (
                  <VacancyCard
                    key={vacancy.id}
                    title={vacancy.title}
                    description={vacancy.description}
                    onApply={() => setApplyTarget({ title: vacancy.title, vacancyId: vacancy.id, requiredFields: vacancy.requiredFields })}
                  />
                ))}
              </div>
            )
          )}
        </Container>
      </main>

      {applyTarget && (
        <ApplyVacancyModal
          title={applyTarget.title}
          vacancyId={applyTarget.vacancyId}
          requiredFields={applyTarget.requiredFields}
          onSubmit={handleApplySubmit}
          onClose={() => setApplyTarget(null)}
        />
      )}

      {applicationSent && (
        <dialog
          ref={(el) => {
            if (el && !el.open) el.showModal()
          }}
          onClose={requestCloseSent}
          onClick={(event) => {
            if (event.target === event.currentTarget) requestCloseSent()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') requestCloseSent()
          }}
          aria-label={t('vacancies.applicationSentTitle')}
          className={`fixed inset-0 m-auto w-[min(420px,92vw)] max-w-none rounded-2xl bg-bg-card text-center backdrop:bg-scrim ${sentClosing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        >
          <div className="p-xl">
            <h2 className="m-0 font-heading text-2xl font-bold text-heading">{t('vacancies.applicationSentTitle')}</h2>
            <p className="mt-sm font-body text-body-sm text-body-text">{t('vacancies.applicationSentMessage')}</p>
            <button
              type="button"
              onClick={requestCloseSent}
              className="mt-lg inline-flex h-11 w-full items-center justify-center rounded-full bg-green-500 font-body text-body-sm font-semibold uppercase tracking-wide text-white"
            >
              {t('vacancies.gotIt')}
            </button>
          </div>
        </dialog>
      )}
    </div>
  )
}

export default VacanciesPage
