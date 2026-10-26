import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'

interface AutoHeightProps {
  children: ReactNode
  className?: string
}

function AutoHeight({ children, className = '' }: Readonly<AutoHeightProps>) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    const update = () => setHeight(content.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      initial={false}
      animate={{ height }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <div ref={contentRef} className={className}>
        {children}
      </div>
    </motion.div>
  )
}

export default AutoHeight
