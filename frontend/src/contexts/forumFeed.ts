import { createContext, useContext } from 'react'
import type useForumFeed from '../hooks/useForumFeed.ts'

/** Forum feed state shared by the forum pages: the posts already loaded and their actions. */
export type ForumFeedValue = ReturnType<typeof useForumFeed>

/** Context of {@link ForumFeedLayout}. */
export const ForumFeedContext = createContext<ForumFeedValue | null>(null)

/**
 * Gives access to the forum feed shared by the forum pages, so going back to the list does not
 * reload it.
 *
 * @returns the feed provided by {@link ForumFeedLayout}
 * @throws Error if it is used outside {@link ForumFeedLayout}
 */
export function useForumFeedContext(): ForumFeedValue {
  const context = useContext(ForumFeedContext)
  if (!context) {
    throw new Error('useForumFeedContext must be used inside ForumFeedLayout')
  }
  return context
}
