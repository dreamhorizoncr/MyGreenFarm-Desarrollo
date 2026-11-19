import { Outlet } from 'react-router-dom'
import useForumFeed from '../hooks/useForumFeed.ts'
import { ForumFeedContext } from './forumFeed.ts'

/**
 * Layout route of the forum pages: loads the forum feed once and shares it with the nested routes, so
 * moving between them does not load it again. The rest of the site does not load it at all.
 */
export function ForumFeedLayout() {
  const feed = useForumFeed()

  return (
    <ForumFeedContext.Provider value={feed}>
      <Outlet />
    </ForumFeedContext.Provider>
  )
}
