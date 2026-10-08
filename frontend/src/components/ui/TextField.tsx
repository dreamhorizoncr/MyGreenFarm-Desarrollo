import type { InputHTMLAttributes, ReactNode } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  children?: ReactNode
}

function TextField({ label, error, id, children, ...rest }: Readonly<TextFieldProps>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-[4px] block text-left font-body text-body text-body-text"
      >
        {label}
      </label>

      {children ?? (
        <input
          id={id}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-body text-body-sm text-body-text outline-none transition focus:border-green-500"
          {...rest}
        />
      )}

      {error && (
        <p className="mt-2 text-left font-body text-body-sm text-danger">{error}</p>
      )}
    </div>
  )
}

export default TextField