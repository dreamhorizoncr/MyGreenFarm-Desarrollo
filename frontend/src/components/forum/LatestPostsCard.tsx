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

  const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
    day: 'numeric',
    month: 'short',
  })

  return (
    <section id="forum-latest" className="rounded-2xl border border-neutral-200 bg-white p-lg text-left">
      <h2 className="m-0 font-heading text-h6 font-bold text-heading">
        {t('forum.latest.title')}
      </h2>

      <ul className="m-0 mt-md flex list-none flex-col gap-lg p-0">
        {latestPosts.map((post) => {
          return (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => onOpen(post.id)}
                className="flex w-full flex-col gap-2xs rounded-lg p-0 text-left transition-transform duration-150 origin-left hover:scale-[1.02]"
              >
                <span className="line-clamp-2 font-body text-body-sm font-semibold text-body-text">
                  {post.title}
                </span>
                <span className="font-body text-xs text-neutral-500">
                  {t('forum.latest.blog')} · {dateFormatter.format(new Date(post.createdAt))}
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
