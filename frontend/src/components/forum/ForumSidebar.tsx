import { useTranslation } from 'react-i18next'
import { SearchIcon } from '@animateicons/react/lucide'
import AboutWallCard from './AboutWallCard.tsx'
import PopularTopicsCard from './PopularTopicsCard.tsx'
import FeaturedBannerCard from './FeaturedBannerCard.tsx'
import PublishButtonCard from './PublishButtonCard.tsx'

interface ForumSidebarProps {
  variant?: 'all' | 'controls' | 'details'
  showPublish?: boolean
  onPublish?: () => void
  showBlogSearch?: boolean
  blogSearch?: string
  onBlogSearchChange?: (value: string) => void
}

function ForumSidebar({
  variant = 'all',
  showPublish = false,
  onPublish,
  showBlogSearch = false,
  blogSearch = '',
  onBlogSearchChange,
}: Readonly<ForumSidebarProps>) {
  const { t } = useTranslation()
  const showControls = variant !== 'details'
  const showDetails = variant !== 'controls'

  return (
    <aside
      aria-label={t('forum.sidebarLabel')}
      className="grid grid-cols-1 gap-md lg:grid-cols-1"
    >
      {showControls && showPublish && onPublish && <div className="hidden lg:block"><PublishButtonCard onPublish={onPublish} /></div>}

      {showControls && showBlogSearch && onBlogSearchChange && (
        <label className="hidden h-12 items-center gap-sm rounded-xl border border-neutral-200 bg-white px-md text-neutral-500 focus-within:border-heading lg:flex">
          <SearchIcon size={20} aria-hidden="true" />
          <input
            type="search"
            value={blogSearch}
            onChange={(event) => onBlogSearchChange(event.target.value)}
            placeholder={t('forum.blog.searchPlaceholder')}
            aria-label={t('forum.blog.searchLabel')}
            className="h-full min-w-0 flex-1 bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
          />
        </label>
      )}

      {showDetails && (
        <>
          <AboutWallCard community={showPublish} />
          <PopularTopicsCard />
          <FeaturedBannerCard />
        </>
      )}
    </aside>
  )
}

export default ForumSidebar
