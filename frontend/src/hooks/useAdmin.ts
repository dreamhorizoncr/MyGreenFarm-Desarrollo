import { useState } from 'react'
import i18n from '../i18n/index.ts'
import { adminService } from '../services/admin.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

export function useAdmin() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.getUsers()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, data: UpdateUserData) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await adminService.updateUser(id, data)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return { users, loading, error, fetchUsers, updateUser }
}
