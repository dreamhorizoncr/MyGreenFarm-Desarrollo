import { useTranslation } from 'react-i18next'
import type { BlogPost } from '../../types/forum.ts'

interface PopularTopicsCardProps {
  blogPosts: BlogPost[]
}

function PopularTopicsCard({ blogPosts }: Readonly<PopularTopicsCardProps>) {
  const { t } = useTranslation()
  const popularTopics = [...blogPosts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .filter((post) => post.topic.trim())
    .map((post) => post.topic.trim())
    .filter((topic, index, topics) => topics.indexOf(topic) === index)

  return (
    <section id="forum-popular" className="rounded-2xl border border-neutral-200 bg-white p-lg text-left">
      <h2 className="m-0 font-heading text-h6 font-bold text-heading">
        {t('forum.popular.title')}
      </h2>

      <ul className="m-0 mt-md flex list-none flex-wrap gap-xs p-0">
        {popularTopics.map((topic) => (
          <li key={topic}>
            <button
              type="button"
              className="rounded-full px-0 py-2xs font-body text-body-sm font-semibold text-body-text"
            >
              #{topic}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PopularTopicsCard
