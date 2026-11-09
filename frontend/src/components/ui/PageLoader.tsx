import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Skeleton from './Skeleton.tsx'

// Pages that load quickly show their own skeletons instead of this generic one.
const SHOW_AFTER_MS = 600

function PageLoader() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return <span className="sr-only" role="status">{t('common.status.loading')}</span>

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
