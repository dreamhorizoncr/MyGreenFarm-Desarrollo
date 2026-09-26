interface TermsSectionItem {
  title: string
  body: string
}

interface TermsSectionProps {
  intro: string
  items: TermsSectionItem[]
}

function TermsSection({ intro, items }: Readonly<TermsSectionProps>) {
  return (
    <div className="flex flex-col gap-md">
      <p className="m-0 font-body text-body-sm text-body-text">{intro}</p>

      {items.map((item) => (
        <div key={item.title} className="flex flex-col gap-2xs">
          <h3 className="m-0 font-heading text-h6 font-bold text-heading">{item.title}</h3>
          <p className="m-0 font-body text-body-sm text-body-text">{item.body}</p>
        </div>
      ))}
    </div>
  )
}

export default TermsSection
