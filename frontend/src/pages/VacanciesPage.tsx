import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import ApplyVacancyModal from '../components/ApplyVacancyModal.tsx'
import { useVacancies } from '../hooks/useVacancies.ts'
import { useCurriculums } from '../hooks/useCurriculums.ts'
import type { Vacancy } from '../types/vacancy.ts'
import type { ApplicationInput } from '../types/curriculum.ts'

function VacanciesPage() {
  const { t } = useTranslation()

  const { vacancies, loading, error, fetchVacancies } = useVacancies()
  const { submitApplication } = useCurriculums()

  const [vacancyToApply, setVacancyToApply] = useState<Vacancy | null>(null)
  const [applicationSent, setApplicationSent] = useState(false)

  useEffect(() => {
    fetchVacancies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openVacancies = vacancies.filter((v) => v.isOpen)

  const handleApplySubmit = async (data: ApplicationInput) => {
    await submitApplication(data)
    setApplicationSent(true)
  }

  return (
    <div id="vacancies-page" className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[280px] items-center bg-green-500 px-7.5 py-10 text-center text-white md:min-h-[320px]">
        <div className="mx-auto w-full max-w-175">
          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-white md:text-[46px]">
            {t('vacancies.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-140 font-body text-[13px] leading-[1.6] text-white md:text-[15px]">
            {t('vacancies.subtitle')}
          </p>
        </div>
      </section>

      <main>
        <Container className="py-10 md:py-12">
          {loading && <p className="m-0 p-xl text-center font-body text-base text-neutral-500">{t('common.loading')}</p>}
          {error && <p className="m-0 p-xl text-center font-body text-base text-danger">{error}</p>}

          {!loading && !error && (
            openVacancies.length === 0 ? (
              <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
                {t('vacancies.noVacancies')}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-md md:grid-cols-2">
                {openVacancies.map((vacancy) => (
                  <article key={vacancy.id} className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-lg">
                    <h2 className="m-0 font-heading text-xl font-bold leading-snug text-heading">
                      {vacancy.title}
                    </h2>

                    <p className="mt-sm flex-1 font-body text-[15px] text-body-text">
                      {vacancy.description}
                    </p>

                    <div className="mt-md flex justify-end">
                      <button
                        type="button"
                        onClick={() => setVacancyToApply(vacancy)}
                        className="inline-flex h-11 items-center whitespace-nowrap rounded-full bg-green-500 px-lg font-body text-sm font-semibold text-white hover:opacity-90"
                      >
                        {t('vacancies.apply')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          )}
        </Container>
      </main>

      {vacancyToApply && (
        <ApplyVacancyModal
          vacancy={vacancyToApply}
          onSubmit={handleApplySubmit}
          onClose={() => setVacancyToApply(null)}
        />
      )}

      {applicationSent && (
        <div
          className="fixed inset-0 z-100 grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
          onClick={() => setApplicationSent(false)}
        >
          <div
            className="w-[min(420px,92vw)] rounded-2xl bg-bg-card p-xl text-center animate-[modal-in_0.2s_ease-out]"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="m-0 font-heading text-2xl font-bold text-heading">{t('vacancies.applicationSentTitle')}</h2>
            <p className="mt-sm font-body text-[15px] text-body-text">{t('vacancies.applicationSentMessage')}</p>
            <button
              type="button"
              onClick={() => setApplicationSent(false)}
              className="mt-lg inline-flex h-11 w-full items-center justify-center rounded-full bg-green-500 font-body text-sm font-semibold uppercase tracking-wide text-white"
            >
              {t('vacancies.gotIt')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VacanciesPage
