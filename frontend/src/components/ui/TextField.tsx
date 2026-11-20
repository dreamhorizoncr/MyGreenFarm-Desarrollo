import type { InputHTMLAttributes, ReactNode } from 'react'
import FieldHint from './FieldHint.tsx'

/** Props of {@link TextField}; the rest go to the `<input>`. */
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: string
  /** A custom input instead of the default one, such as a password input. */
  children?: ReactNode
}

/** Form field with its label, input, hint and error. */
function TextField({ label, error, hint, id, children, ...rest }: Readonly<TextFieldProps>) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-[4px] block text-left font-body text-body-sm font-semibold text-heading"
      >
        {label}
      </label>

      {children ?? (
        <input
          id={id}
          className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-body text-body-sm text-body-text-dark outline-none transition focus:border-green-500"
          {...rest}
        />
      )}

      {hint && <FieldHint>{hint}</FieldHint>}

      {error && (
        <p className="mt-2 text-left font-body text-body-sm text-danger">{error}</p>
      )}
    </div>
  )
}

export default TextField