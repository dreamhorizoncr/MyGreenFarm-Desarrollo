import { Blobatar } from '@blobatar/react'
import 'blobatar/motion.css'
import { Link } from 'react-router-dom'
import { userStorage } from '../utils/userStorage.ts'

function ProfileButton() {
  const user = userStorage.getUser()
  if (!user) return null

  return (
    <Link
      to="/profile"
      aria-label={`${user.firstName} ${user.lastName}`}
      className="inline-flex items-center justify-center rounded-full bg-transparent transition-shadow duration-150 hover:shadow-[0_0_0_4px_var(--heading-100)] focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
    >
      <Blobatar
        name={user.email}
        size={38}
        animate="always"
        title={`${user.firstName} ${user.lastName}`}
        className="shrink-0 rounded-full"
      />
    </Link>
  )
}

export default ProfileButton