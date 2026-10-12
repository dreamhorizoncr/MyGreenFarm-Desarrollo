import { featuredBanner } from './forumData.ts'

function FeaturedBannerCard() {
  return (
    <a
      href="#forum-feed"
      className="block rounded-2xl border border-neutral-200 bg-white card-hover"
    >
      <img
        src={featuredBanner.imageUrl}
        alt={featuredBanner.alt}
        className="h-[160px] w-full rounded-[15px] object-cover xs:h-[200px]"
      />
    </a>
  )
}

export default FeaturedBannerCard
