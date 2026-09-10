import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { FooterColumnData } from './footerData.ts'

function FooterColumn({ titleKey, links }: FooterColumnData) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-md md:items-end">
      <div className="flex flex-col items-center gap-md md:items-start">
        <h2 className="m-0 font-heading text-h6 font-bold text-center text-white md:text-left">
          {t(titleKey)}
        </h2>

        <ul className="m-0 list-none space-y-sm p-0">
          {links.map((link) => {
            const label = t(link.label)

            if (link.to) {
              return (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="font-body text-body-sm text-white"
                  >
                    {label}
                  </Link>
                </li>
              )
            }

            if (link.href) {
              const isExternal = link.href.startsWith('http')
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="font-body text-body-sm text-white"
                    {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {label}
                  </a>
                </li>
              )
            }

            return (
              <li
                key={link.label}
                className="font-body text-body-sm text-white"
              >
                {label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default FooterColumn