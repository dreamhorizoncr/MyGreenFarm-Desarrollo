import { Fragment, type ReactNode } from 'react'

const KEYS = Array.from({ length: 50 }, (_, position) => `skeleton-${position}`)

/** Props of {@link SkeletonList}. */
interface SkeletonListProps {
  count: number
  children: (position: number) => ReactNode
}

/** Renders `count` placeholders (up to 50) with stable keys. */
function SkeletonList({ count, children }: Readonly<SkeletonListProps>) {
  return <>{KEYS.slice(0, count).map((key, position) => <Fragment key={key}>{children(position)}</Fragment>)}</>
}

export default SkeletonList
