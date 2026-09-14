import { Navigate, Outlet } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

function OwnerRoute() {
  const user = userStorage.getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'OWNER') return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export default OwnerRoute
