import { useTranslation } from 'react-i18next'
import Skeleton from './Skeleton.tsx'

/** Se muestra mientras se descarga el código de una página (carga bajo demanda). */
function PageLoader() {
  const { t } = useTranslation()
  return (
    <div role="status" aria-busy="true" className="mx-auto flex w-full max-w-[75rem] flex-col gap-lg px-md py-2xl md:px-xl">
      <span className="sr-only">{t('common.status.loading')}</span>
      <Skeleton shape="line" className="h-10 w-2/3 max-w-[28rem]" />
      <Skeleton shape="line" className="h-5 w-full max-w-[40rem]" />
      <div className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="hidden h-48 w-full lg:block" />
      </div>
    </div>
  )
}

export default PageLoader
