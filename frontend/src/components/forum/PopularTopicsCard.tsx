import { useTranslation } from 'react-i18next'
import { popularTopics } from './forumData.ts'

function PopularTopicsCard() {
  const { t } = useTranslation()

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-lg text-left">
      <h2 className="m-0 font-heading text-h6 font-bold text-heading">
        {t('forum.popular.title')}
      </h2>

      <ul className="m-0 mt-md flex list-none flex-wrap gap-xs p-0">
        {popularTopics.map((topic) => (
          <li key={topic.id}>
            <button
              type="button"
              className="rounded-full bg-[var(--bg-200)] px-md py-2xs font-body text-body-sm font-semibold text-body-text transition-colors hover:bg-green-500 hover:text-white"
            >
              #{topic.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PopularTopicsCard
