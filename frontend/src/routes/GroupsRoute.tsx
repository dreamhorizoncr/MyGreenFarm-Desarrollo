
import { Navigate, Outlet } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

    const ALLOWED_ROLES = new Set(['OWNER', 'TEACHER'])

    function GroupsRoute() {
    const user = userStorage.getUser()

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!ALLOWED_ROLES.has(user.role)) {
        return <Navigate to="/admin/dashboard" replace />
    }

    return <Outlet />
    }

export default GroupsRoute
