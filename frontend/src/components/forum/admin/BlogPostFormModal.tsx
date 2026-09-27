import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FileImageIcon, XIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import Button from '../../ui/Button.tsx'
import { userStorage } from '../../../utils/userStorage.ts'
import type { BlogPost, BlogPostInput } from '../../../types/forum.ts'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/svg+xml',
])

const MAX_TITLE = 120
const MAX_TOPIC = 60
const MAX_NAME = 60
const MAX_ROLE = 80
const MAX_ALT = 140
const MAX_CONTENT = 4000

interface SelectedImage {
  file: File
  previewUrl: string
}

interface BlogPostFormModalProps {
  post: BlogPost | null
  onClose: () => void
  onSubmit: (input: BlogPostInput) => void
}

function BlogPostFormModal({ post, onClose, onSubmit }: Readonly<BlogPostFormModalProps>) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<BlogPostInput>(() => {
    if (post) {
      return {
        title: post.title,
        topic: post.topic,
        authorName: post.authorName,
        authorRole: post.authorRole,
        content: post.content,
        imageUrl: post.imageUrl,
        imageAlt: post.imageAlt,
      }
    }

    const user = userStorage.getUser()

    return {
      title: '',
      topic: '',
      authorName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      authorRole: t('adminForum.defaultRole'),
      content: '',
    }
  })

  const [image, setImage] = useState<SelectedImage | null>(null)
  const [imageError, setImageError] = useState('')
  const [altError, setAltError] = useState('')
  const [pendingChanges, setPendingChanges] = useState<BlogPostInput | null>(null)
  const [confirmationText, setConfirmationText] = useState('')

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
      if (image) URL.revokeObjectURL(image.previewUrl)
    }
  }, [onClose, image])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setImageError(t('adminForum.invalidImageType'))
      return
    }

    setImageError('')
    setAltError('')
    setImage({ file, previewUrl: URL.createObjectURL(file) })
    setForm((current) => ({ ...current, imageAlt: '' }))
  }

  function removeImage() {
    if (image) URL.revokeObjectURL(image.previewUrl)
    setImage(null)
    setForm((current) => ({ ...current, imageUrl: undefined, imageAlt: '' }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if ((image || form.imageUrl) && !form.imageAlt?.trim()) {
      setAltError(t('adminForum.imageAltRequired'))
      return
    }

    const input = {
      title: form.title.trim(),
      topic: form.topic.trim(),
      authorName: form.authorName.trim(),
      authorRole: form.authorRole.trim(),
      content: form.content.trim(),
      imageUrl: image ? image.previewUrl : form.imageUrl,
      imageAlt: form.imageAlt?.trim() || undefined,
    }

    if (post) {
      setPendingChanges(input)
      return
    }

    onSubmit(input)
  }

  const previewUrl = image ? image.previewUrl : form.imageUrl

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-[16px] md:p-[30px]"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="mx-auto my-[20px] w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg md:my-[40px] md:p-xl"
      >
        <div className="flex items-center justify-between gap-md">
          <h2 className="m-0 font-heading text-2xl font-bold text-heading">
            {post ? t('adminForum.editPost') : t('adminForum.newPost')}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('adminForum.close')}
            className="rounded-full p-2xs text-neutral-500 transition-colors hover:bg-(--grey-100)"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="mt-lg grid gap-md md:grid-cols-2">
          <label className="font-body text-sm font-semibold text-heading">
            {t('adminForum.postTitle')}

            <input
              required
              maxLength={MAX_TITLE}
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder={t('adminForum.postTitlePlaceholder')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-sm font-semibold text-heading">
            {t('adminForum.postTopic')}

            <input
              required
              maxLength={MAX_TOPIC}
              value={form.topic}
              onChange={(event) =>
                setForm({ ...form, topic: event.target.value })
              }
              placeholder={t('adminForum.postTopicPlaceholder')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-sm font-semibold text-heading">
            {t('adminForum.authorName')}

            <input
              required
              maxLength={MAX_NAME}
              value={form.authorName}
              onChange={(event) =>
                setForm({ ...form, authorName: event.target.value })
              }
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-sm font-semibold text-heading">
            {t('adminForum.authorRole')}

            <input
              required
              maxLength={MAX_ROLE}
              value={form.authorRole}
              onChange={(event) =>
                setForm({ ...form, authorRole: event.target.value })
              }
              placeholder={t('adminForum.defaultRole')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
          </label>

          <label className="font-body text-sm font-semibold text-heading md:col-span-2">
            {t('adminForum.postContent')}

            <textarea
              required
              maxLength={MAX_CONTENT}
              rows={10}
              value={form.content}
              onChange={(event) =>
                setForm({ ...form, content: event.target.value })
              }
              placeholder={t('adminForum.postContentPlaceholder')}
              className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
            />

            <span className="mt-xs block text-right text-xs font-normal text-neutral-500">
              {form.content.length}/{MAX_CONTENT}
            </span>

            <span className="mt-xs block text-xs font-normal text-neutral-500">
              {t('adminForum.contentHint')}
            </span>
          </label>

          <div className="font-body text-sm font-semibold text-heading md:col-span-2">
            <span className="block">{t('adminForum.postImage')}</span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="mt-xs flex items-center gap-md">
                <img
                  src={previewUrl}
                  alt=""
                  className="size-20 shrink-0 rounded-xl border border-neutral-200 object-cover"
                />

                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-xs font-normal text-neutral-500">
                    {image
                      ? image.file.name
                      : t('adminForum.currentImage')}
                  </p>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2xs inline-flex h-9 items-center rounded-full border border-neutral-200 px-md text-xs font-semibold text-danger transition-colors hover:border-danger"
                  >
                    {t('adminForum.removeImage')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-xs inline-flex h-11 items-center gap-xs rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-md text-sm font-semibold text-heading transition-colors hover:border-heading"
              >
                <FileImageIcon size={18} aria-hidden="true" />
                {t('adminForum.chooseImage')}
              </button>
            )}

            {imageError && (
              <p className="m-0 mt-xs text-xs font-normal text-danger">
                {imageError}
              </p>
            )}
          </div>

          <label className="font-body text-sm font-semibold text-heading md:col-span-2">
            {t('adminForum.imageAlt')}

            <input
              maxLength={MAX_ALT}
              value={form.imageAlt ?? ''}
              onChange={(event) => {
                setAltError('')
                setForm({ ...form, imageAlt: event.target.value })
              }}
              placeholder={t('adminForum.imageAltPlaceholder')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />

            {altError && (
              <span className="mt-xs block text-xs font-normal text-danger">
                {altError}
              </span>
            )}
          </label>
        </div>

        <div className="mt-xl flex flex-col-reverse gap-md sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="h-[47px] rounded-full font-body text-[17px]"
          >
            {t('adminForum.cancel')}
          </Button>

          <Button
            type="submit"
            className="h-[47px] rounded-full bg-green-500 font-body text-[17px] font-normal text-white"
          >
            {post ? t('adminForum.saveChanges') : t('adminForum.publish')}
          </Button>
        </div>
      </form>

      {pendingChanges && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('adminForum.confirmChangesTitle')}
            className="relative max-h-[90vh] w-[min(620px,92vw)] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
          >
            <button
              type="button"
              className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity hover:opacity-65"
              onClick={() => { setPendingChanges(null); setConfirmationText('') }}
              aria-label={t('adminForum.close')}
            >
              <XIcon size={20} />
            </button>
            <h3 className="m-0 text-center font-heading text-[42px] font-bold leading-none text-heading">
              {t('adminForum.confirmChangesTitle')}
            </h3>
            <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
              <p className="m-0 text-left font-body text-[16px] text-neutral-500">
                {t('adminForum.confirmChangesDescription', { word: t('adminForum.confirmWord') })}
              </p>
              <input
                autoFocus
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                aria-label={t('adminForum.confirmWord')}
                className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500"
              />
              <div className="mt-sm flex gap-md">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setPendingChanges(null); setConfirmationText('') }}
                  className="h-[47px] flex-1 rounded-full font-body text-[17px] uppercase tracking-wide"
                >
                  {t('adminForum.cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={confirmationText.trim().toLocaleUpperCase() !== t('adminForum.confirmWord').toLocaleUpperCase()}
                  onClick={() => onSubmit(pendingChanges)}
                  className="h-[47px] flex-1 rounded-full font-body text-[17px] font-normal uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('adminForum.confirmChanges')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogPostFormModal
