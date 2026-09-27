import type { ReactNode } from 'react'

interface PhilosophyPillarItemProps {
  icon: ReactNode
  tag: string
  title: string
  body: string
}

function PhilosophyPillarItem({ icon, tag, title, body }: Readonly<PhilosophyPillarItemProps>) {
  return (
    <div className="flex flex-col gap-xs rounded-2xl border border-neutral-200 bg-white p-md transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-sm">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-(--green-50) text-green-500">
          {icon}
        </span>
        <span className="font-body text-[12px] font-semibold uppercase tracking-wide text-orange-500">
          {tag}
        </span>
      </div>

      <h3 className="m-0 font-heading text-h6 font-bold text-heading">{title}</h3>

      <p className="m-0 font-body text-body-sm text-body-text">{body}</p>
    </div>
  )
}

export default PhilosophyPillarItem
