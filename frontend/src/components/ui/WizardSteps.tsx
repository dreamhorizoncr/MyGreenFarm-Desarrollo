import { Fragment } from 'react'
import { Check } from 'lucide-react'

interface WizardStepsProps {
  steps: string[]
  current: number
}

function WizardSteps({ steps, current }: WizardStepsProps) {
  return (
    <ol className="flex items-start">
      {steps.map((label, index) => {
        const completed = index < current
        const active = index === current
        const stepClassName = completed || active
          ? 'bg-green-500 text-white'
          : 'bg-[var(--grey-100)] text-body-text'

        return (
          <Fragment key={label}>
            {index > 0 && (
              <span
                className={`mt-4 h-px flex-1 ${index <= current ? 'bg-green-500' : 'bg-neutral-300'}`}
                aria-hidden="true"
              />
            )}

            <li className="flex shrink-0 flex-col items-center gap-1">
              <span
                className={`flex size-8 items-center justify-center rounded-full font-body text-sm font-semibold ${stepClassName}`}
                aria-current={active ? 'step' : undefined}
              >
                {completed ? <Check size={16} /> : index + 1}
              </span>
              <span className={`font-body text-xs leading-tight ${active ? 'font-semibold text-body-text' : 'text-neutral-500'}`}>
                {label}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

export default WizardSteps