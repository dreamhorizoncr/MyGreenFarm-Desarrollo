import { useTranslation } from 'react-i18next'
import ninos2 from '../../assets/imgs/niños2.svg'
import nubeWhiteDown from '../../assets/imgs/nubeWhiteDown.svg'
import Container from '../../components/home/Container.tsx'
import MultimediaCard from '../../components/home/MultimediaCard.tsx'

function MultimediaSection() {
  const { t } = useTranslation()
  const albumCount = 3

  return (
    <section id="multimedia" className="relative flex min-h-[100svh] w-full flex-col bg-pink-400">
      <img src={nubeWhiteDown} alt="" aria-hidden="true" className="block w-full" />

      <div className="flex w-full flex-1 flex-col justify-center">
        <Container className="flex flex-col items-start gap-700 pt-1500 text-left">
          <h2 className="m-0 font-heading text-h2 font-bold text-white">
            {t('home.multimedia.title')}
          </h2>

          <div className="h-1 w-12 rounded-full bg-white" aria-hidden="true" />

          <div className="flex w-full flex-col items-start gap-md md:flex-row md:items-center md:justify-between">
            <p className="max-w-[25rem] font-body text-body-sm font-normal text-white">
              {t('home.multimedia.description')}
            </p>

            <a
              href="#"
              className="whitespace-nowrap font-link text-body-sm uppercase tracking-wide text-white hover:opacity-80"
            >
              {t('home.multimedia.viewMore')}
            </a>
          </div>
        </Container>

        <Container className="grid grid-cols-1 gap-xl pb-1500 pt-1000 md:grid-cols-3">
          {Array.from({ length: albumCount }, (_, i) => (
            <MultimediaCard
              key={i}
              imageSrc={ninos2}
              alt={t('home.multimedia.albumTitle')}
              badge={t('home.multimedia.albumCount')}
              title={t('home.multimedia.albumTitle')}
              description={t('home.multimedia.cardText')}
            />
          ))}
        </Container>
      </div>
    </section>
  )
}

export default MultimediaSection