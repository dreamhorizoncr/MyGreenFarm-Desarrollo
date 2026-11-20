import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { notify } from '../utils/notifications.ts'

/**
 * When a request is rejected because the session ended (the `mgf:unauthorized` event of
 * {@link apiClient}), warns the user and goes to the login page.
 */
export function useSessionExpiredNotice() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleUnauthorized = () => {
      notify.warning({
        title: t('login.sessionExpiredTitle'),
        description: t('login.sessionExpiredDescription'),
      })
      navigate('/login')
    }

    window.addEventListener('mgf:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('mgf:unauthorized', handleUnauthorized)
  }, [navigate, t])
}
