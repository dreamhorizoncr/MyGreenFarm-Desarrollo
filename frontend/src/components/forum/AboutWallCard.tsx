import { useTranslation } from 'react-i18next'
import { UsersIcon } from '@animateicons/react/lucide'

interface AboutWallCardProps {
  community?: boolean
}

function AboutWallCard({ community = false }: Readonly<AboutWallCardProps>) {
  const { t } = useTranslation()

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

    </section>
  )
}

export default AboutWallCard
