import { useTranslation } from 'react-i18next'
import TabHighlight from '../ui/TabHighlight.tsx'

export type ForumTab = 'community' | 'blog'

interface ForumTabsProps {
  activeTab: ForumTab
  onChange: (tab: ForumTab) => void
}

function ForumTabs({ activeTab, onChange }: Readonly<ForumTabsProps>) {
  const { t } = useTranslation()

  return (
    <fieldset
      className="isolate m-0 mt-[24px] flex flex-wrap justify-center gap-[10px] border-0 p-0"
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
            className={`relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
              isActive
                ? 'border-orange-500 text-white'
                : 'border-white bg-transparent text-white hover:bg-white/10'
            }`}
          >
            {isActive && <TabHighlight layoutId="forum-tab" className="bg-orange-500" />}
            {t(`forum.tabs.${tab}`)}
          </button>
        )
      })}
    </fieldset>
  )
}

export default ForumTabs
