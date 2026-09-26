import { useTranslation } from 'react-i18next'
import { UsersIcon } from '@animateicons/react/lucide'

interface AboutWallCardProps {
  onGoToCommunity?: () => void
  community?: boolean
}

function AboutWallCard({ onGoToCommunity, community = false }: AboutWallCardProps) {
  const { t } = useTranslation()

  const handleScrollToFeed = () => {
    onGoToCommunity?.()

    document
      .getElementById('forum-feed')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-lg text-left">
      <span className="flex size-[56px] items-center justify-center rounded-full bg-[var(--orange-100)] text-[var(--orange-500)]">
        <UsersIcon size={24} aria-hidden="true" />
      </span>

      <h2 className="m-0 mt-md font-heading text-h6 font-bold text-heading">
        {t('forum.about.title')}
      </h2>

      <p className="m-0 mt-sm font-body text-body-sm text-body-text">
        {t(community ? 'forum.about.communityDescription' : 'forum.about.description')}
      </p>

      <button
        type="button"
        onClick={handleScrollToFeed}
        className="mt-lg inline-flex h-11 w-fit items-center justify-center rounded-full bg-green-500 px-lg font-body text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t('forum.about.cta')}
      </button>
    </section>
  )
}

export default AboutWallCard
