
import type { ReactNode } from 'react'

interface CheckboxFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  className?: string
}

function CheckboxField({ checked, onChange, children, className = '' }: Readonly<CheckboxFieldProps>) {
  return (
    <label className={`flex cursor-pointer items-center gap-sm rounded-xl border border-neutral-200 px-md py-sm font-body text-body-sm text-body-text ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-green-500"
      />
      {children}
    </label>
  )
}

export default CheckboxField
