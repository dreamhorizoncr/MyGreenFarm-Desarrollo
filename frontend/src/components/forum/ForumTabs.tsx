import { useTranslation } from 'react-i18next'

export type ForumTab = 'community' | 'blog'

interface ForumTabsProps {
  activeTab: ForumTab
  onChange: (tab: ForumTab) => void
}

function ForumTabs({ activeTab, onChange }: Readonly<ForumTabsProps>) {
  const { t } = useTranslation()

  return (
    <fieldset
      className="m-0 mt-[22px] flex flex-wrap justify-center gap-[10px] border-0 p-0"
    >
      <legend className="sr-only">{t('forum.tabs.label')}</legend>
      {(['blog', 'community'] as const).map((tab) => {
        const isActive = tab === activeTab

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            aria-pressed={isActive}
            className={`rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
              isActive
                ? 'border-orange-500 bg-orange-500 text-white'
                : 'border-white bg-transparent text-white hover:bg-white/10'
            }`}
          >
            {t(`forum.tabs.${tab}`)}
          </button>
        )
      })}
    </fieldset>
  )
}

export default ForumTabs
