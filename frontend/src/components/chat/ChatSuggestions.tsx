import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TabHighlight from '../ui/TabHighlight'
import { tabCarouselClass, useTabCarousel } from '../../hooks/useTabCarousel'

interface ChatSuggestionsProps {
  onSelect: (question: string) => void
}

const SUGGESTIONS = ['booking', 'plans', 'vacancies'] as const
const suggestionRowClass = tabCarouselClass.replace(' md:flex-wrap md:overflow-visible', '')

export default function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)
  const rowRef = useTabCarousel(selected)

  return (
    <div className="flex flex-col gap-2.5 text-left">
      <p className="font-body text-body-sm font-semibold text-neutral-500">{t('chat.frequentQuestions')}</p>
      <div ref={rowRef} className={suggestionRowClass}>
        {SUGGESTIONS.map((key) => {
          const question = t(`chat.suggestions.${key}`)
          const isActive = selected === key
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => { setSelected(key); onSelect(question) }}
              className={`relative rounded-full border border-green-500 px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
                isActive ? 'text-white' : 'bg-transparent text-heading hover:bg-green-50'
              }`}
            >
              {isActive && <TabHighlight layoutId="chat-suggestion-tab" className="bg-green-500" />}
              {question}
            </button>
          )
        })}
      </div>
    </div>
  )
}
