import { useState } from 'react'
import { adminService } from '../services/admin.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { UserInfo, UpdateUserData } from '../types/auth.ts'

export function useAdmin() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminService.getUsers(0, 500)
      setUsers(data.content)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (id: string, data: UpdateUserData) => {
    setError(null)
    try {
      const updated = await adminService.updateUser(id, data)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      throw new Error(message, { cause: err })
    }
  }

  const deleteUser = async (id: string) => {
    setError(null)
    try {
      await adminService.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      throw new Error(message, { cause: err })
    }
  }

  return { users, loading, error, fetchUsers, updateUser, deleteUser }
}
