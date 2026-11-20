import { createContext, useContext } from 'react'

/** Whether the pointer is over the admin sidebar, so the profile avatar can react to it. */
export interface ProfileAvatarContextValue {
  sidebarHovered: boolean
  setSidebarHovered: (hovered: boolean) => void
}

/** Context of {@link ProfileAvatarProvider}. */
export const ProfileAvatarContext = createContext<ProfileAvatarContextValue | null>(null)

/**
 * @returns the sidebar hover state provided by {@link ProfileAvatarProvider}
 * @throws Error if it is used outside {@link ProfileAvatarProvider}
 */
export function useProfileAvatar(): ProfileAvatarContextValue {
  const context = useContext(ProfileAvatarContext)
  if (!context) {
    throw new Error('useProfileAvatar must be used inside ProfileAvatarProvider')
  }
  return context
}
