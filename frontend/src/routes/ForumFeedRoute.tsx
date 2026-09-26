import { Outlet } from 'react-router-dom'
import { ForumFeedProvider } from '../contexts/ForumFeedContext.tsx'

function ForumFeedRoute() {
  return (
    <ForumFeedProvider>
      <Outlet />
    </ForumFeedProvider>
  )
}

export default ForumFeedRoute
