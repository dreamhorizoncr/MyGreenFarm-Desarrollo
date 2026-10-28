import type { ChatMessage } from '../../hooks/useChat'

interface ChatMessageProps {
  message: ChatMessage
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  if (isUser) {
    return (
      <div className="flex justify-end animate-in fade-in slide-in-from-bottom-1 duration-200">
        <div className="max-w-[84%] rounded-2xl rounded-tr-md bg-green-500 px-md py-sm font-body text-body-sm text-white whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div
        className={`max-w-[84%] rounded-2xl rounded-tl-md px-md py-sm font-body text-body-sm whitespace-pre-wrap break-words ${
          message.blocked
            ? 'border border-orange-500 bg-orange-500 text-white'
            : 'bg-green-50 text-body-text-dark'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
