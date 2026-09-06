import { Link } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'
import type { UserInfo } from '../types/auth.ts'

const initials = (user: UserInfo) => (user.firstName[0] + user.lastName[0]).toUpperCase()

function ProfileButton() {
  const user = userStorage.getUser()
  if (!user) return null

  return (
    <Link
      to="/profile"
      aria-label={`${user.firstName} ${user.lastName}`}
      className="inline-flex items-center justify-center rounded-full bg-transparent transition-shadow duration-150 hover:shadow-[0_0_0_4px_var(--heading-100)] focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
    >
      <span
        className="inline-flex size-[38px] shrink-0 select-none items-center justify-center rounded-full bg-green-500 font-heading text-base leading-none text-white"
        aria-hidden="true"
      >
        {initials(user)}
      </span>
    </Link>
  )
}

export default ProfileButton