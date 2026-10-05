import { useEffect, useRef, useState } from 'react'
import { XIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import Button from '../ui/Button.tsx'
import ForumPendingReviewModal from './ForumPendingReviewModal.tsx'
import { notify } from '../../utils/notifications.ts'
import { getErrorMessage } from '../../utils/error.ts'

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
  // Ref (not state) so a second click within the same tick, before React
  // re-renders to hide the button, is still blocked synchronously — avoids
  // firing the Gemini moderation call twice for one submission.
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

    isSubmittingRef.current = true
    // Show the "sent for review" confirmation right away instead of leaving
    // the form stuck while the moderation check runs; the real outcome
    // arrives later as a toast (success or rejection reason).
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
      className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('forum.community.cancel')}
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
      />

      <article
        className="relative mx-auto my-[20px] w-full max-w-[640px] rounded-3xl bg-white"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('forum.community.cancel')}
          className="absolute right-[18px] top-[18px] flex size-[42px] items-center justify-center rounded-full bg-white text-heading transition"
        >
          <XIcon size={20} />
        </button>

        <div className="px-[22px] pb-[30px] pt-[34px] md:px-[40px] md:pb-[36px] md:pt-[40px]">
          <h2 className="m-0 pr-[50px] font-heading text-[24px] font-bold text-heading md:text-[28px]">
            {t('forum.community.modalTitle')}
          </h2>

          <input
            id="community-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            aria-label={t('forum.community.nameLabel')}
            placeholder={t('forum.community.nameLabel')}
            className="mt-md h-11 w-full rounded-xl border border-neutral-200 bg-white px-md text-left font-body text-body-sm text-body-text outline-none focus:border-heading"
          />

          <textarea
            id="community-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={MAX_CONTENT}
            rows={6}
            aria-label={t('forum.community.contentLabel')}
            placeholder={t('forum.community.contentLabel')}
            className="mt-md w-full resize-y rounded-xl border border-neutral-200 bg-white p-md text-left font-body text-body-sm text-body-text outline-none focus:border-heading"
          />

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
              disabled={submitted}
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
