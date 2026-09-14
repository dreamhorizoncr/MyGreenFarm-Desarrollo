import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { tokenStorage } from '../utils/token.ts'
import { notify } from '../utils/notifications.ts'

function ProtectedRoute() {
  const { t } = useTranslation()
  const token = tokenStorage.getToken()

  useEffect(() => {
    if (!token) {
      notify.info({
        title: t('login.requireLoginTitle'),
        description: t('login.requireLoginDescription'),
      })
    }
  }, [token, t])

  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

export default ProtectedRoute