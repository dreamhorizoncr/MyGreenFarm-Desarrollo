import { useRef, useState } from 'react'
import { XIcon } from '@animateicons/react/lucide'
import ChatPanel from './ChatPanel'
import ChickAvatar from './ChickAvatar'
import { useTranslation } from 'react-i18next'
import useDismiss from '../../hooks/useDismiss'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [byeKey, setByeKey] = useState(0)
  const chatRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const closeChat = () => {
    setOpen(false)
    setByeKey((key) => key + 1)
  }

  useDismiss({
    ref: chatRef,
    isOpen: open,
    onClose: closeChat,
  })

  return (
    <div ref={chatRef} className="fixed bottom-6 left-6 z-[999] flex flex-col items-start gap-3">
      {open && (
        <div
          className="mb-1 h-[min(72vh,560px)] w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden max-sm:fixed max-sm:inset-x-6 max-sm:bottom-[5.5rem] max-sm:mx-auto max-sm:mb-0 max-sm:h-[min(72svh,560px)] max-sm:w-auto rounded-[20px] border border-neutral-200 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-200"
          role="dialog"
          aria-modal="false"
          aria-label={t('chat.title')}
        >
          <ChatPanel onClose={closeChat} />
        </div>
      )}

      <button
        onClick={() => open ? closeChat() : setOpen(true)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="group flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-heading shadow-lg transition-all hover:scale-105 hover:bg-neutral-50 hover:shadow-xl active:scale-95"
        aria-label={open ? t('chat.close') : t('chat.open')}
      >
        {open ? (
          <XIcon size={24} aria-hidden="true" />
        ) : (
          <ChickAvatar
            waving={hovering}
            reaction={byeKey ? { type: 'bye', key: byeKey } : null}
            inputDirection="up"
            size={44}
          />
        )}
      </button>
    </div>
  )
}
