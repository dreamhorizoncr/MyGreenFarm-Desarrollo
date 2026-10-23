import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import ApplyVacancyModal from '../components/ApplyVacancyModal.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import ScallopEdge from '../components/ui/ScallopEdge.tsx'
import BlobButton from '../components/ui/BlobButton.tsx'
import lapiz from '../assets/imgs/lapiz.svg'
import tijera from '../assets/imgs/Tijera.svg'
import goma from '../assets/imgs/Goma.svg'
import cabra from '../assets/imgs/Cabra.svg'
import ModalCloseButton from '../components/ui/ModalCloseButton.tsx'
import { useVacancies } from '../hooks/useVacancies.ts'
import { useCurriculums } from '../hooks/useCurriculums.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import { notifyError } from '../utils/notifications.ts'
import type { OptionalApplicationField } from '../types/vacancy.ts'
import type { ApplicationInput } from '../types/curriculum.ts'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'

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
  position?: number
}

const HEADER_ILLUSTRATIONS = [lapiz, tijera, goma, cabra]

function toneAttributes(position: number) {
  const mobilePink = position % 2 === 0
  const desktopPink = (Math.floor(position / 2) + (position % 2)) % 2 === 0
  return {
    'data-tone-mobile': mobilePink ? 'pink' : 'green',
    'data-tone-desktop': desktopPink ? 'pink' : 'green',
  }
}

function VacancyCard({ title, description, onApply, loading = false, position = 0 }: Readonly<VacancyCardProps>) {
  const { t } = useTranslation()
  const tone = toneAttributes(position)
  const illustration = HEADER_ILLUSTRATIONS[position % HEADER_ILLUSTRATIONS.length]

  if (loading) {
    return (
      <article {...tone} className="vacancy-card flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow">
        <div className="flex items-center justify-between gap-md bg-(--tone) px-lg pb-xs pt-md [@media(hover:hover)]:bg-(--tone-soft)">
          <Skeleton shape="line" className="h-7 w-3/5 opacity-50 [@media(hover:hover)]:opacity-100" />
          <Skeleton shape="rect" className="h-14 w-14 shrink-0 opacity-50 [@media(hover:hover)]:opacity-100" />
        </div>
        <ScallopEdge className="text-(--tone) [@media(hover:hover)]:text-(--tone-soft)" />
        <div className="flex flex-1 flex-col p-lg pt-md">
          <div className="flex flex-1 flex-col gap-2xs">
            <Skeleton shape="line" className="h-4 w-full" />
            <Skeleton shape="line" className="h-4 w-full" />
            <Skeleton shape="line" className="h-4 w-2/3" />
          </div>
          <div className="mt-md flex justify-start">
            <Skeleton shape="pill" className="h-11 w-28" />
          </div>
        </div>
      </article>
    )
  }

  return (
    <article {...tone} className="vacancy-card group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow card-hover">
      <div className="flex items-center justify-between gap-md bg-(--tone) px-lg pb-xs pt-md transition-colors duration-300 [@media(hover:hover)]:bg-(--tone-soft) group-hover:bg-(--tone)">
        <h2 className="m-0 min-w-0 font-heading text-h4 font-bold leading-snug text-white transition-colors duration-300 [@media(hover:hover)]:text-(--tone-ink) group-hover:text-white">
          {title}
        </h2>
        <span
          aria-hidden="true"
          className="h-14 w-14 shrink-0 bg-white transition-colors duration-300 [@media(hover:hover)]:bg-(--tone-ink) group-hover:bg-white"
          style={{
            maskImage: `url(${illustration})`,
            WebkitMaskImage: `url(${illustration})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
      </div>
      <ScallopEdge className="text-(--tone) transition-colors duration-300 [@media(hover:hover)]:text-(--tone-soft) group-hover:text-(--tone)" />

      <div className="flex flex-1 flex-col p-lg pt-md">
      <p className="m-0 flex-1 font-body text-body-sm text-[var(--grey-600)]">
        {description}
      </p>

      <div className="mt-md flex justify-start">
        <BlobButton onClick={onApply} className="h-11 w-fit px-lg font-body text-button font-bold">
          {t('vacancies.apply')}
        </BlobButton>
      </div>
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
  const sentDialogRef = useRef<HTMLDialogElement | null>(null)
  const { closing: sentClosing, requestClose: requestCloseSent } = useModalExit(() => setApplicationSent(false))
  useDialogDismiss(sentDialogRef, requestCloseSent)

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
      notifyError(t('vacancies.applyErrorToastTitle'), err)
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

  const skeletonCount = useSkeletonCount('vacancies', loading, openVacancies.length, 2)

  return (
    <div id="vacancies-page" className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[280px] items-start bg-white px-[30px] pt-[48px] pb-[40px] text-center md:min-h-[320px] md:pt-[72px]">
        <div className="mx-auto w-full max-w-175">
          <h1 className="m-0 font-heading text-h1 font-bold leading-tight text-green-500">
            {t('vacancies.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-140 font-body text-body-sm leading-[1.6] text-green-500 md:text-body-sm">
            {t('vacancies.subtitle')}
          </p>
        </div>
      </section>

      <main>
        <Container className="py-10 md:py-12">
          {loading && (
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              <SkeletonList count={skeletonCount}>{(position) => <VacancyCard loading position={position} />}</SkeletonList>
            </div>
          )}
          {error && <p className="m-0 p-xl text-center font-body text-body text-danger">{error}</p>}

          {!loading && !error && (
            openVacancies.length === 0 ? (
              <div className="mx-auto max-w-140 rounded-2xl border border-neutral-200 bg-white p-xl text-center">
                <p className="m-0 font-body text-body text-neutral-500">
                  {t('vacancies.noVacancies')}
                </p>

                <h2 className="mt-lg font-heading text-h4 font-bold leading-snug text-heading">
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
                {openVacancies.map((vacancy, position) => (
                  <VacancyCard
                    key={vacancy.id}
                    position={position}
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
            sentDialogRef.current = el
            if (el && !el.open) el.showModal()
          }}
          onClose={requestCloseSent}
          aria-label={t('vacancies.applicationSentTitle')}
          className={`fixed inset-0 m-auto max-h-[90vh] w-[min(420px,92vw)] max-w-none modal-scroll rounded-[20px] bg-bg-card text-center backdrop:bg-scrim ${sentClosing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
        >
          <div className="relative p-lg md:p-xl">
            <ModalCloseButton onClick={requestCloseSent} aria-label={t('legalModal.close')} className="absolute right-lg top-lg z-20 md:right-xl md:top-xl" />
            <h2 className="m-0 px-xl pt-xl font-heading text-h4 font-bold text-heading">{t('vacancies.applicationSentTitle')}</h2>
            <p className="mt-sm font-body text-body-sm text-body-text">{t('vacancies.applicationSentMessage')}</p>
            <button
              type="button"
              onClick={requestCloseSent}
              className="mt-lg inline-flex h-11 w-full items-center justify-center rounded-full bg-green-500 font-body text-body-sm font-semibold text-white"
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
