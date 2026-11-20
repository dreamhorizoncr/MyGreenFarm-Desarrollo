import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FooterColumn from '../components/footer/FooterColumn.tsx'
import FooterSocialLinks from '../components/footer/FooterSocialLinks.tsx'
import TermsModal from '../components/legal/TermsModal.tsx'
import { footerColumns, legalLink } from '../components/footer/footerData.ts'
import cloudFooter from '../assets/imgs/cloudFooter.svg'
import logo from '../assets/imgs/logo-48.webp'
import logo2x from '../assets/imgs/logo-96.webp'
import logo3x from '../assets/imgs/logo-144.webp'
import goatSitting from '../assets/imgs/goatSitting-160.webp'
import goatSitting2x from '../assets/imgs/goatSitting-320.webp'

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src={logo} srcSet={`${logo} 1x, ${logo2x} 2x, ${logo3x} 3x`} alt="My Green Farm" width={48} height={48} loading="lazy" decoding="async" className="h-12 w-auto object-contain" />
      <span className="font-heading text-h6 text-white">My Green Farm</span>
    </div>
  )
}

/** Footer of the public pages: logo, social networks, link columns, credits and the legal terms. */
function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false)

  return (
    <footer id="site-footer" data-scroll-bg="green" className="w-full text-white">
      <div className="relative w-full overflow-hidden leading-none">
        <img
          src={cloudFooter}
          alt=""
          aria-hidden="true"
          data-scroll-bg="green"
          className="relative -mb-1 block w-[110vw] max-w-none -translate-x-1/2 left-1/2 object-cover"
        />
      </div>
      <div className="relative z-20 -mt-[2px] flex w-full flex-col gap-1500 bg-[var(--green-500)] px-[var(--scale-1100)] py-1500 text-center md:px-[var(--scale-1600)] md:text-left">
        <div className="grid w-full gap-xl md:grid-cols-3 md:items-start">
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

          <img
            src={goatSitting}
            srcSet={`${goatSitting} 160w, ${goatSitting2x} 320w`}
            sizes="(min-width: 768px) 160px, 128px"
            alt=""
            aria-hidden="true"
            width={160}
            height={176}
            loading="lazy"
            decoding="async"
            className="pointer-events-none h-auto w-32 select-none justify-self-center md:w-40 md:justify-self-end md:self-center"
          />
        </div>

        <hr className="w-full border-white/20" />

        {/* centered on the page like the Contact column above, so the links sit under it */}
        <div className="grid w-full justify-items-center gap-md md:grid-cols-[1fr_auto_1fr] md:items-center">
          <p className="m-0 font-body text-body-sm text-white md:justify-self-start">
            © {year} My Green Farm · {t('footer.rights')}
          </p>

          <nav
            className="flex items-center gap-lg font-body text-body-sm"
            aria-label={t('footer.legalLabel')}
          >
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="min-h-6 bg-transparent text-white underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
            >
              {t(legalLink.label)}
            </button>
          </nav>

          <p className="m-0 font-body text-body-sm text-white md:justify-self-end md:text-right">
            {t('footer.developedBy')}{' '}
            <a
              href="https://linktr.ee/dreamhorizoncr"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
            >
              Dream Horizon
            </a>
          </p>
        </div>
      </div>

      {isLegalModalOpen && <TermsModal onClose={() => setIsLegalModalOpen(false)} />}
    </footer>
  )
}

export default Footer
