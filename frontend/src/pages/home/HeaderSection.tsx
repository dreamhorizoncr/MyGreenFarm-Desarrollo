import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { HEADER_BG_SIZES } from './heroSizes.ts'
import headerBgSmall from '../../assets/imgs/homeHeaderBg-640.webp'
import headerBgMedium from '../../assets/imgs/homeHeaderBg-1024.webp'
import headerBgLarge from '../../assets/imgs/homeHeaderBg-1600.webp'
import cloudsUp from '../../assets/imgs/cloudsUp.svg'
import Container from '../../components/home/Container.tsx'
import BlobButton from '../../components/ui/BlobButton.tsx'

const headerBg = {
  src: headerBgLarge,
  srcSet: `${headerBgSmall} 640w, ${headerBgMedium} 1024w, ${headerBgLarge} 1600w`,
}

function HeaderSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section id="header" className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden text-left">
      <img
        src={headerBg.src}
        srcSet={headerBg.srcSet}
        sizes={HEADER_BG_SIZES}
        alt=""
        aria-hidden="true"
        width={1600}
        height={1200}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-20 size-full object-cover object-[70%_80%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-black/50 md:bg-transparent md:bg-linear-to-r md:from-black/65 md:via-black/45 md:to-black/25"
      />

      <div className="flex w-full flex-1 flex-col justify-center">
        <Container className="pb-1600 pt-1500">
          <div className="grid w-full items-center gap-lg md:grid-cols-2">
            <div className="flex flex-col items-start gap-700">
              <span className="inline-flex w-fit items-center rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
                {t('home.header.badge')}
              </span>

              <h1 className="m-0 font-heading text-h1 font-bold leading-[1.1] text-white">
                {t('home.header.welcome')}
                <br />
                My Green Farm
              </h1>

              <p className="max-w-[40rem] font-body text-body-lg font-normal text-white/90">
                {t('home.header.description')}
              </p>

              <BlobButton
                variant="filled"
                className="h-11 w-fit px-lg font-body text-button font-bold"
                onClick={() => navigate('/booking')}
              >
                {t('home.header.cta')}
              </BlobButton>
            </div>
          </div>
        </Container>
      </div>

      <div className="relative w-full overflow-hidden leading-none">
        <img
          src={cloudsUp}
          width={1441}
          height={175}
          alt=""
          aria-hidden="true"
          data-scroll-bg="green"
          className="relative -mb-1 block w-[110vw] max-w-none -translate-x-1/2 left-1/2 object-cover"
        />
      </div>
    </section>
  )
}

export default HeaderSection
