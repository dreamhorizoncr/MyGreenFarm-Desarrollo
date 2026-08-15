// Esto de aquí es para tener un botón reutilizable, usado en signup y forgot password.

interface AppButtonProps {
  text: string
  className?: string
  disabled?: boolean
  onClick: () => void
}

function AppButton({ text, className = '', onClick, disabled = false }: AppButtonProps) {
  return (
    <button className={`btn ${className}`} onClick={onClick} disabled={disabled}>
      {text}
    </button>
  )
}

export default AppButton
