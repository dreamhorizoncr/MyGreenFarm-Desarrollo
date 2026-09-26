import { createContext, useContext, type ReactNode } from 'react'
import useForumFeed from '../hooks/useForumFeed.ts'

type ForumFeedValue = ReturnType<typeof useForumFeed>

const ForumFeedContext = createContext<ForumFeedValue | null>(null)

export function ForumFeedProvider({ children }: Readonly<{ children: ReactNode }>) {
  const feed = useForumFeed()

  return (
    <ForumFeedContext.Provider value={feed}>{children}</ForumFeedContext.Provider>
  )
}

export function useForumFeedContext() {
  const context = useContext(ForumFeedContext)
  if (!context) {
    throw new Error('useForumFeedContext must be used inside ForumFeedProvider')
  }
  return context
}
