import { useTranslation } from 'react-i18next'
import { SearchIcon } from '@animateicons/react/lucide'
import AboutWallCard from './AboutWallCard.tsx'
import PopularTopicsCard from './PopularTopicsCard.tsx'
import FeaturedBannerCard from './FeaturedBannerCard.tsx'
import PublishButtonCard from './PublishButtonCard.tsx'

interface ForumSidebarProps {
  onGoToCommunity?: () => void
  showPublish?: boolean
  onPublish?: () => void
  showBlogSearch?: boolean
  blogSearch?: string
  onBlogSearchChange?: (value: string) => void
}

function ForumSidebar({
  onGoToCommunity,
  showPublish = false,
  onPublish,
  showBlogSearch = false,
  blogSearch = '',
  onBlogSearchChange,
}: ForumSidebarProps) {
  const { t } = useTranslation()

  return (
    <aside
      aria-label={t('forum.sidebarLabel')}
      className="grid grid-cols-1 gap-md xs:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] lg:grid-cols-1"
    >
      {showPublish && onPublish && <PublishButtonCard onPublish={onPublish} />}

      {showBlogSearch && onBlogSearchChange && (
        <label className="flex h-12 items-center gap-sm rounded-xl border border-neutral-200 bg-white px-md text-neutral-500 focus-within:border-heading">
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

      <AboutWallCard onGoToCommunity={onGoToCommunity} community={showPublish} />
      <PopularTopicsCard />
      <FeaturedBannerCard />
    </aside>
  )
}

export default ForumSidebar
