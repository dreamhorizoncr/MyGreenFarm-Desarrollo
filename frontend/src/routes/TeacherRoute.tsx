import { Navigate, Outlet } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

function TeacherRoute() {
  const user = userStorage.getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export default TeacherRoute