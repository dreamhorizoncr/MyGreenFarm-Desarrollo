import type { ReactNode } from 'react'

/** Props of {@link Container}. */
interface ContainerProps {
  children: ReactNode
  className?: string
}

/** Centers the content of a section with the site's maximum width and side margins. */
function Container({ children, className }: Readonly<ContainerProps>) {
  return (
    <div className={`mx-auto w-full max-w-(--container-max-width) px-1100 ${className ?? ''}`}>
      {children}
    </div>
  )
}

export default Container