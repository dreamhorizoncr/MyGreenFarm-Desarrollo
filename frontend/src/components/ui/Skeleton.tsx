import { tv } from 'tailwind-variants'

const skeleton = tv({
  base: 'block',
  variants: {
    shape: {
      line: 'rounded-md',
      circle: 'rounded-full',
      rect: 'rounded-2xl',
      pill: 'rounded-full',
    },
    effect: {
      shimmer:
        'animate-[skeleton-shimmer_1.6s_ease-in-out_infinite] bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--color-neutral-200)_25%,var(--color-neutral-100)_37%,var(--color-neutral-200)_63%)]',
      pulse: 'animate-pulse bg-neutral-200',
    },
  },
  defaultVariants: {
    shape: 'rect',
    effect: 'shimmer',
  },
})

interface SkeletonProps {
  shape?: 'line' | 'circle' | 'rect' | 'pill'
  effect?: 'shimmer' | 'pulse'
  className?: string
}

function Skeleton({ shape, effect, className }: Readonly<SkeletonProps>) {
  return <span className={skeleton({ shape, effect, className })} aria-hidden="true" />
}

export default Skeleton
