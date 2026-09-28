import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface ProfileAvatarContextValue {
  sidebarHovered: boolean
  setSidebarHovered: (hovered: boolean) => void
}

const ProfileAvatarContext = createContext<ProfileAvatarContextValue | null>(null)

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

export function useProfileAvatar() {
  const context = useContext(ProfileAvatarContext)
  if (!context) {
    throw new Error('useProfileAvatar must be used inside ProfileAvatarProvider')
  }
  return context
}
