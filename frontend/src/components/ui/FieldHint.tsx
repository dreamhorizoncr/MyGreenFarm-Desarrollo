import type { ReactNode } from 'react'

function FieldHint({ children }: Readonly<{ children: ReactNode }>) {
  return <span className="mt-xs block text-left font-body text-caption font-normal text-neutral-500">{children}</span>
}

export default FieldHint
