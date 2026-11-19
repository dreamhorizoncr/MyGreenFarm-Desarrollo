import { Navigate, Outlet } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

/** Roles of the user accounts. */
export type Role = 'OWNER' | 'ADMIN' | 'TEACHER' | 'PARENT'

interface RoleRouteProps {
  /** Roles that may open the nested routes. */
  roles: readonly Role[]
}

/**
 * Lets only some roles into its nested routes: without a session it goes to the login page, and with
 * another role to the dashboard. It only hides pages; the backend checks the permissions again in
 * every request.
 */
function RoleRoute({ roles }: Readonly<RoleRouteProps>) {
  const user = userStorage.getUser()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role as Role)) return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}

export default RoleRoute
