import { useTranslation } from 'react-i18next'

export type ForumTab = 'community' | 'blog'

interface ForumTabsProps {
  activeTab: ForumTab
  onChange: (tab: ForumTab) => void
}

function ForumTabs({ activeTab, onChange }: ForumTabsProps) {
  const { t } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('forum.tabs.label')}
      className="mt-[22px] flex flex-wrap justify-center gap-[10px]"
    >
      {(['blog', 'community'] as const).map((tab) => {
        const isActive = tab === activeTab

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            aria-pressed={isActive}
            className={`rounded-full px-[18px] py-[8px] font-heading text-[14px] font-semibold text-white transition ${
              isActive ? 'bg-orange-500' : 'bg-orange-400 hover:bg-orange-500'
            }`}
          >
            {t(`forum.tabs.${tab}`)}
          </button>
        )
      })}
    </div>
  )
}

export default ForumTabs
