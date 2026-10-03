import { Fragment } from 'react'
import { CheckIcon } from '@animateicons/react/lucide'

interface WizardStepsProps {
  steps: string[]
  current: number
}

function WizardSteps({ steps, current }: Readonly<WizardStepsProps>) {
  return (
    <ol className="flex items-start">
      {steps.map((label, index) => {
        const completed = index < current
        const active = index === current
        const stepClassName = completed || active
          ? 'bg-green-500 text-white'
          : 'border border-green-500 bg-white text-green-600'

        return (
          <Fragment key={label}>
            {index > 0 && (
              <span className="mt-4 h-0.5 flex-1 overflow-hidden bg-[var(--grey-100)]" aria-hidden="true">
                <span
                  className={`block h-full origin-left bg-green-500 transition-transform duration-500 ease-out ${
                    index <= current ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </span>
            )}

            <li className="flex shrink-0 flex-col items-center gap-1">
              <span
                className={`flex size-8 items-center justify-center rounded-full font-body text-body-sm font-semibold transition-colors ${stepClassName}`}
                aria-current={active ? 'step' : undefined}
              >
                {completed ? <CheckIcon size={16} /> : index + 1}
              </span>
              <span className={`font-body text-caption leading-tight ${active ? 'font-semibold text-body-text' : 'text-neutral-500'}`}>
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