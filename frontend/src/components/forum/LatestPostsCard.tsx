import { useTranslation } from 'react-i18next'
import type { BlogPost } from '../../types/forum.ts'

interface LatestPostsCardProps {
  blogPosts: BlogPost[]
  onOpen: (postId: string) => void
}

function LatestPostsCard({ blogPosts, onOpen }: Readonly<LatestPostsCardProps>) {
  const { t, i18n } = useTranslation()
  const latestPosts = [...blogPosts]
    .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
    .slice(0, 5)

  if (latestPosts.length === 0) return null

  return (
    <section id="forum-latest" className="rounded-2xl border border-neutral-200 bg-white p-lg text-left">
      <h2 className="m-0 font-heading text-h6 font-bold text-heading">
        {t('forum.latest.title')}
      </h2>

      <ul className="m-0 mt-md flex list-none flex-col p-0">
        {latestPosts.map((post) => {
          return (
            <li key={post.id} className="border-b border-neutral-100 last:border-b-0">
              <button
                type="button"
                onClick={() => onOpen(post.id)}
                className="flex w-full items-start gap-sm rounded-lg py-sm text-left transition-colors hover:bg-neutral-50"
              >
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.imageAlt || post.title}
                    className="h-12 w-12 shrink-0 rounded-sm object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className="line-clamp-2 block font-body text-body-sm font-semibold leading-[1.4] text-body-text"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {post.title}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default LatestPostsCard
