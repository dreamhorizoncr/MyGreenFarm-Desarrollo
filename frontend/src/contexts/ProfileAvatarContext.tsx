import { useMemo, useState, type ReactNode } from 'react'
import { ProfileAvatarContext } from './profileAvatar.ts'

/** Shares whether the pointer is over the admin sidebar with the profile avatar. */
export function ProfileAvatarProvider({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const value = useMemo(() => ({ sidebarHovered, setSidebarHovered }), [sidebarHovered])

  return (
    <ProfileAvatarContext.Provider value={value}>
      {children}
    </ProfileAvatarContext.Provider>
  )
}
