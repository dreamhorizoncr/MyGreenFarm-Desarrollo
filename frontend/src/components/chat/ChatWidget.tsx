import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import ChatPanel from './ChatPanel'
import rutiAssistant from '../../assets/imgs/rutiasistente.png'
import { useTranslation } from 'react-i18next'
import useDismiss from '../../hooks/useDismiss'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const closeChat = () => {
    try {
      sessionStorage.removeItem('mygreenfarm_chat_history')
    } catch {
      // Storage may be unavailable in private browsing contexts.
    }
    setOpen(false)
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
          className="mb-1 h-[min(72vh,560px)] w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 animate-in fade-in slide-in-from-bottom-3 duration-200"
          role="dialog"
          aria-modal="false"
          aria-label={t('chat.title')}
        >
          <ChatPanel onClose={closeChat} />
        </div>
      )}

      <button
        onClick={() => open ? closeChat() : setOpen(true)}
        className="group flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-heading shadow-lg transition-all hover:scale-105 hover:bg-neutral-50 hover:shadow-xl active:scale-95"
        aria-label={open ? t('chat.close') : t('chat.open')}
      >
        {open ? <X className="h-6 w-6" /> : <img src={rutiAssistant} alt="" className="h-full w-full object-contain" />}
      </button>
    </div>
  )
}
