import type { ElementType, ReactNode } from 'react'

const TAG_CLASS = 'rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white'

interface TagProps {
  children: ReactNode
  className?: string
  as?: ElementType
}

function Tag({ children, className = '', as: Element = 'span' }: Readonly<TagProps>) {
  return <Element className={`${TAG_CLASS} ${className}`.trim()}>{children}</Element>
}

export default Tag
