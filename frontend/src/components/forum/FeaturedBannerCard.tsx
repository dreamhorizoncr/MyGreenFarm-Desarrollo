import { featuredBanner } from './forumData.ts'

function FeaturedBannerCard() {
  return (
    <a
      href="#forum-feed"
      className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-lg"
    >
      <img
        src={featuredBanner.imageUrl}
        alt={featuredBanner.alt}
        className="h-[160px] w-full object-cover xs:h-[200px]"
      />
    </a>
  )
}

export default FeaturedBannerCard
