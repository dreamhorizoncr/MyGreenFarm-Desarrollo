import { createContext, useContext, useState, type ReactNode } from 'react'

interface ProfileAvatarContextValue {
  sidebarHovered: boolean
  setSidebarHovered: (hovered: boolean) => void
}

const ProfileAvatarContext = createContext<ProfileAvatarContextValue | null>(null)

export function ProfileAvatarProvider({
  children,
}: {
  children: ReactNode
}) {
  const [sidebarHovered, setSidebarHovered] = useState(false)

  return (
    <ProfileAvatarContext.Provider value={{ sidebarHovered, setSidebarHovered }}>
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
