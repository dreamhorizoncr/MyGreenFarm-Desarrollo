import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import FooterColumn from '../components/footer/FooterColumn.tsx'
import FooterSocialLinks from '../components/footer/FooterSocialLinks.tsx'
import { footerColumns, legalLinks } from '../components/footer/footerData.ts'
import nubesUp from '../assets/imgs/nubesUp.svg'
import logo from '../assets/imgs/Logo.svg'

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src={logo} alt="My Green Farm" className="h-12 w-auto max-w-[48px] object-contain" />
      <span className="font-heading text-h6 text-white">My Green Farm</span>
    </div>
  )
}

function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="w-full bg-[var(--green-500)] text-white">
      <img
        src={nubesUp}
        alt=""
        aria-hidden="true"
        className="-mt-500 block w-full bg-bg-page"
      />
      <div className="mx-auto flex w-full max-w-[var(--container-max-width)] flex-col gap-1500 px-1100 py-1500 text-center md:text-left">
        <div className="grid w-full gap-xl md:grid-cols-[1.5fr_1fr] md:items-start">
          <div className="flex flex-col items-center gap-md md:items-start">
            <Brand />
            <p className="m-0 max-w-[24rem] font-body text-body-sm text-white">
              {t('footer.tagline')}
            </p>
            <FooterSocialLinks />
          </div>

          {footerColumns.map((column) => (
            <FooterColumn
              key={column.titleKey}
              titleKey={column.titleKey}
              links={column.links}
            />
          ))}
        </div>

        <hr className="w-full border-white/20" />

        <div className="flex w-full flex-col items-center justify-between gap-md md:flex-row">
          <p className="m-0 font-body text-body-sm text-white">
            © {year} My Green Farm · {t('footer.rights')}
          </p>

          <nav
            className="flex items-center gap-lg font-body text-body-sm"
            aria-label={t('footer.legalLabel')}
          >
            {legalLinks.map(
              (link) =>
                link.to && (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-white transition-colors hover:text-[var(--orange-300)]"
                  >
                    {t(link.label)}
                  </Link>
                ),
            )}
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default Footer
