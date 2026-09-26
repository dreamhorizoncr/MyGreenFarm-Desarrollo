import { Navigate, Outlet } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

const ALLOWED_ROLES = new Set(['ADMIN', 'OWNER', 'TEACHER'])

function ExpedientsRoute() {
  const user = userStorage.getUser()
  if (!user) return <Navigate to="/login" replace />
  if (!ALLOWED_ROLES.has(user.role)) return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export default ExpedientsRoute
