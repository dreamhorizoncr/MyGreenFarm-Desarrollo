import { Navigate, Outlet } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

function AdminRoute() {
  const user = userStorage.getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}

export default AdminRoute
