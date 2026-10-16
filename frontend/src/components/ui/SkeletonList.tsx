import { Fragment, type ReactNode } from 'react'

const KEYS = Array.from({ length: 50 }, (_, position) => `skeleton-${position}`)

interface SkeletonListProps {
  count: number
  children: (position: number) => ReactNode
}

function SkeletonList({ count, children }: Readonly<SkeletonListProps>) {
  return <>{KEYS.slice(0, count).map((key, position) => <Fragment key={key}>{children(position)}</Fragment>)}</>
}

export default SkeletonList
