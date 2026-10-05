import { useTranslation } from 'react-i18next'
import DeleteConfirmModal from './ui/DeleteConfirmModal.tsx'
import type { NewsletterRecipient } from '../types/newsletter.ts'

interface ConfirmNewsletterUnsubscribeModalProps {
    recipient: NewsletterRecipient
    onConfirm: (recipient: NewsletterRecipient) => Promise<void>
    onClose: () => void
}

function ConfirmNewsletterUnsubscribeModal({ recipient, onConfirm, onClose }: Readonly<ConfirmNewsletterUnsubscribeModalProps>) {
    const { t } = useTranslation()

    return (
        <DeleteConfirmModal
            title={t('admin.newsletter.unsubscribeConfirmTitle')}
            message={t('admin.newsletter.unsubscribeConfirmMessage', { email: recipient.email })}
            confirmLabel={t('admin.newsletter.unsubscribe')}
            onConfirm={() => onConfirm(recipient)}
            onClose={onClose}
        />
    )
}

export default ConfirmNewsletterUnsubscribeModal
