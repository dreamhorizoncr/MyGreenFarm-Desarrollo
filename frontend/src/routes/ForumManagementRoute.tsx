import { Navigate, Outlet } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

function ForumManagementRoute() {
  const user = userStorage.getUser()

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'OWNER' && user.role !== 'TEACHER') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}

export default ForumManagementRoute
