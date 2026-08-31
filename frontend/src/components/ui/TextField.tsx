import type { InputHTMLAttributes, ReactNode } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  children?: ReactNode
}

function TextField({ label, error, id, children, ...rest }: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-[4px] block text-left font-body text-[16px] text-body-text"
      >
        {label}
      </label>

      {children ?? (
        <input
          id={id}
          className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
          {...rest}
        />
      )}

      {error && (
        <p className="mt-2 text-left font-body text-sm text-danger">{error}</p>
      )}
    </div>
  )
}

export default TextField