import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ChatSuggestionsProps {
  onSelect: (question: string) => void
}

const SUGGESTIONS = ['booking', 'plans', 'vacancies'] as const

export default function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-2.5 text-left">
      <p className="font-body text-body-sm font-semibold text-neutral-500">{t('chat.frequentQuestions')}</p>
      <div className="flex w-full flex-nowrap gap-2">
        {SUGGESTIONS.map((key) => {
          const question = t(`chat.suggestions.${key}`)
          return (
          <button
            key={key}
            onClick={() => { setSelected(key); onSelect(question) }}
            style={selected === key ? { backgroundColor: 'var(--orange-500)', borderColor: 'var(--orange-500)', color: '#fff' } : undefined}
            className={`flex min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full border px-1 py-1.5 text-center font-body text-caption leading-tight transition-colors ${
              selected === key
                ? 'border-orange-500 text-white'
                : 'border-neutral-400 bg-transparent text-neutral-600'
            }`}
          >
            {question}
          </button>
          )
        })}
      </div>
    </div>
  )
}
