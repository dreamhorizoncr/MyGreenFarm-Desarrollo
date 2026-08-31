import { Navigate, Outlet } from 'react-router-dom'
import { tokenStorage } from '../utils/token.ts'

function ProtectedRoute() {
  const token = tokenStorage.getToken()
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export default ProtectedRoute