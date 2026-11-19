import { Blobatar } from '@blobatar/react'
import 'blobatar/motion.css'

/** Props of {@link PostAvatar}. */
interface PostAvatarProps {
  name: string
  src?: string
  size?: number
}

/** Avatar of the author of a post: their photo, or a blob character generated from the name. */
function PostAvatar({ name, src, size = 44 }: Readonly<PostAvatarProps>) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    )
  }

  return (
    <Blobatar
      name={name}
      size={size}
      animate="always"
      title={name}
      className="shrink-0 rounded-full"
    />
  )
}

export default PostAvatar
