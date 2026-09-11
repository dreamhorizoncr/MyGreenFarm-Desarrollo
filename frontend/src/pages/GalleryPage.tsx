import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import MultimediaCard from '../components/home/MultimediaCard.tsx'
import ninos2 from '../assets/imgs/niños2.svg'
import nubeWhiteDown from '../assets/imgs/nubeWhiteDown.svg'

function GalleryPage() {
  const { t } = useTranslation()
  const albumCount = 3

  return (
    <div id="gallery-page" className="min-h-screen bg-bg-page">
      <Navbar />

      {/* Header de Galería */}
      <section className="flex min-h-[360px] items-center bg-white px-[30px] py-[60px] text-center md:min-h-[420px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-green-500 md:text-[46px]">
            {t('home.galeria.title')}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-[13px] leading-[1.6] text-green-500 md:text-[15px]">
            {t('home.galeria.description')}
          </p>
        </div>
      </section>

      {/* Sección de Álbumes */}
      <section className="relative flex w-full flex-col bg-green-500">
        {/* Nube blanca en la parte inferior
         <img src={nubeWhiteDown} alt="" aria-hidden="true" className="block w-full" /> */}
       

        <div className="flex w-full flex-col">
          <Container className="flex flex-col items-start gap-700 pt-1500 text-left">
            <h2 className="m-0 font-heading text-h2 font-bold text-white">
              {t('home.galeria.albumTitle')}
            </h2>

            <div className="h-1 w-12 rounded-full bg-orange-500" aria-hidden="true" />

            <p className="max-w-[25rem] font-body text-body-sm font-normal text-white">
              {t('home.galeria.description')}
            </p>
          </Container>

          <Container className="grid grid-cols-1 gap-xl pb-1500 pt-1000 md:grid-cols-3">
            {Array.from({ length: albumCount }, (_, i) => (
              <MultimediaCard
                key={i}
                imageSrc={ninos2}
                alt={t('home.galeria.albumTitle')}
                badge={t('home.galeria.albumCount')}
                title={t('home.galeria.albumTitle')}
                description={t('home.galeria.cardText')}
              />
            ))}
          </Container>
        </div>
      </section>
    </div>
  )
}

export default GalleryPage