import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button.tsx'
import ForumPendingReviewModal from './ForumPendingReviewModal.tsx'
import { notify } from '../../utils/notifications.ts'
import { getErrorMessage } from '../../utils/error.ts'
import { hasUnsafeText } from '../../utils/validators.ts'
import ModalCloseButton from '../ui/ModalCloseButton.tsx'
import FieldHint from '../ui/FieldHint.tsx'

const MAX_CONTENT = 4000

interface PublishExperienceModalProps {
  onClose: () => void
  onPublish: (input: { name: string; content: string }) => Promise<void>
}

function PublishExperienceModal({
  onClose,
  onPublish,
}: Readonly<PublishExperienceModalProps>) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  function handleSubmit() {
    if (isSubmittingRef.current) return

    const trimmedName = name.trim()
    const trimmedContent = content.trim()

    if (!trimmedName || !trimmedContent) {
      notify.error(
        t(
          trimmedName
            ? 'forum.community.contentRequired'
            : 'forum.community.nameRequired',
        ),
      )
      return
    }

    if (hasUnsafeText(trimmedName) || hasUnsafeText(trimmedContent)) {
      notify.error(t('validation.unsafeText'))
      return
    }

    isSubmittingRef.current = true
    setSubmitted(true)
    onPublish({ name: trimmedName, content: trimmedContent })
      .then(() => {
        notify.success({
          title: t('forum.community.toastTitle'),
          description: t('forum.community.toastDescription'),
        })
      })
      .catch((err) => {
        notify.error(getErrorMessage(err))
      })
  }

  if (submitted) {
    return (
      <ForumPendingReviewModal
        title={t('forum.community.pendingTitle')}
        description={t('forum.community.pendingDescription')}
        onClose={onClose}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('forum.community.cancel')}
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
      />

      <article
        className="relative mx-auto max-h-full modal-scroll w-full max-w-[640px] rounded-[20px] bg-white"
      >
        <div className="p-lg md:p-xl">
          <div className="flex items-center justify-between gap-md">
            <h2 className="m-0 font-heading text-h4 font-bold text-heading">
              {t('forum.community.modalTitle')}
            </h2>
            <ModalCloseButton onClick={onClose} aria-label={t('forum.community.cancel')} />
          </div>

          <input
            id="community-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            aria-label={t('forum.community.nameLabel')}
            placeholder={t('fields.experience.name.placeholder')}
            className="mt-md h-11 w-full rounded-xl border border-neutral-200 bg-white px-md text-left font-body text-body-sm text-body-text-dark outline-none focus:border-heading"
          />
          <FieldHint>{t('fields.experience.name.hint')}</FieldHint>

          <textarea
            id="community-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={MAX_CONTENT}
            rows={6}
            aria-label={t('forum.community.contentLabel')}
            placeholder={t('fields.experience.content.placeholder')}
            className="mt-md w-full resize-y rounded-xl border border-neutral-200 bg-white p-md text-left font-body text-body-sm text-body-text-dark outline-none focus:border-heading"
          />
          <FieldHint>{t('fields.experience.content.hint')}</FieldHint>

          <p className="m-0 mt-xs text-right font-body text-caption text-body-text">
            {content.length}/{MAX_CONTENT}
          </p>

          <div className="mt-lg flex gap-md">
            <Button
              variant="secondary"
              onClick={onClose}
              className="h-11 flex-1 rounded-full border-green-500 font-body text-button text-heading hover:bg-green-50"
            >
              {t('forum.community.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitted || !name.trim() || !content.trim()}
              className="h-11 flex-1 rounded-full bg-orange-500 font-body text-button font-normal text-white hover:bg-orange-600"
            >
              {t('forum.community.submit')}
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}

export default PublishExperienceModal
