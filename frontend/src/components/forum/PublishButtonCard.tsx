import { useTranslation } from 'react-i18next'
import { MessageSquarePlusIcon } from '@animateicons/react/lucide'

interface PublishButtonCardProps {
  onPublish: () => void
}

function PublishButtonCard({ onPublish }: PublishButtonCardProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onPublish}
      className="inline-flex w-full items-center justify-center gap-[8px] rounded-full bg-primary px-[18px] py-[11px] font-heading text-[14px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
    >
      <MessageSquarePlusIcon size={17} />
      {t('forum.community.publish')}
    </button>
  )
}

export default PublishButtonCard
