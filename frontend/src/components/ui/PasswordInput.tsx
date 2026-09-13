import { useState, type ChangeEvent } from 'react'
import { EyeIcon, EyeOffIcon } from '@animateicons/react/lucide'

interface PasswordInputProps {
  id: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  className?: string
  showAriaLabel: string
  hideAriaLabel: string
}

function PasswordInput({
  id,
  value,
  onChange,
  className = '',
  showAriaLabel,
  hideAriaLabel,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        className={`${className} pr-10`}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideAriaLabel : showAriaLabel}
        className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center justify-center p-1 text-grey-500 transition-colors focus-visible:outline-2 focus-visible:outline-link"
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  )
}

export default PasswordInput