import { useTranslation } from 'react-i18next'
import { UsersIcon } from '@animateicons/react/lucide'

/** Props of {@link AboutWallCard}. */
interface AboutWallCardProps {
  /** Whether it describes the community instead of the blog. */
  community?: boolean
}

/** Card of the forum's sidebar that explains what the blog or the community is for. */
function AboutWallCard({ community = false }: Readonly<AboutWallCardProps>) {
  const { t } = useTranslation()

  return (
    <section id="forum-about" className="flex flex-col items-start rounded-2xl border border-neutral-200 bg-white p-lg text-left">
      <span className="flex size-14 items-center justify-center rounded-full bg-(--pink-50) text-pink-400">
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
