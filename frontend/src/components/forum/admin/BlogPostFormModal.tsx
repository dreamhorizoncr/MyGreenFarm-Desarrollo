import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FileImageIcon, XIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import Button from '../../ui/Button.tsx'
import type { BlogPost, BlogPostInput } from '../../../types/forum.ts'
import { userStorage } from '../../../utils/userStorage.ts'
import { validateRequired } from '../../../utils/validators.ts'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/svg+xml',
])

const MAX_TITLE = 120
const MAX_TOPIC = 60
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
  const currentUser = userStorage.getUser()
  const isTeacher = currentUser?.role === 'TEACHER'

  const [form, setForm] = useState<BlogPostInput>(() => {
    if (post) {
      return {
        title: post.title,
        topic: post.topic,
        content: post.content,
        authorName: post.authorName,
        authorRole: post.authorRole,
        imageUrl: post.imageUrl,
        imageAlt: post.imageAlt,
      }
    }

    return {
      title: '',
      topic: '',
      content: '',
      authorName: `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim(),
      authorRole: t(isTeacher ? 'adminForum.defaultRole' : 'adminForum.defaultOwnerRole'),
    }
  })

  const [image, setImage] = useState<SelectedImage | null>(null)
  const [imageError, setImageError] = useState('')
  const [altError, setAltError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})
  const [pendingChanges, setPendingChanges] = useState<BlogPostInput | null>(null)
  const [confirmationText, setConfirmationText] = useState('')

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      return { ...current, [field]: null }
    })
  }

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
    setForm((current) => ({ ...current, imageAlt: '', removeImage: false }))
  }

  function removeImage() {
    if (image) URL.revokeObjectURL(image.previewUrl)
    setImage(null)
    setForm((current) => ({ ...current, imageUrl: undefined, imageAlt: '', removeImage: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      title: validateRequired(form.title, t('adminForum.postTitle'), t),
      topic: validateRequired(form.topic, t('adminForum.postTopic'), t),
      authorName: validateRequired(form.authorName ?? '', t('adminForum.authorName'), t),
      authorRole: validateRequired(form.authorRole ?? '', t('adminForum.authorRole'), t),
      content: validateRequired(form.content, t('adminForum.postContent'), t),
    }

    setFieldErrors(errors)

    if (Object.values(errors).some((message) => message !== null)) return

    if ((image || form.imageUrl) && !form.imageAlt?.trim()) {
      setAltError(t('adminForum.imageAltRequired'))
      return
    }

    const input = {
      title: form.title.trim(),
      topic: form.topic.trim(),
      content: form.content.trim(),
      imageUrl: image ? image.previewUrl : form.imageUrl,
      imageAlt: form.imageAlt?.trim() || undefined,
      imageFile: image?.file,
      removeImage: form.removeImage,
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
      className="fixed inset-0 z-50 overflow-y-auto scrollbar-none bg-black/50 p-[16px] md:p-[30px]"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('adminForum.close')}
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative mx-auto my-[20px] w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg md:my-[40px] md:p-xl"
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
          <label className="font-body text-body-sm font-semibold text-heading">
            {t('adminForum.postTitle')}

            <input
              maxLength={MAX_TITLE}
              value={form.title}
              onChange={(event) => {
                setForm({ ...form, title: event.target.value })
                clearFieldError('title')
              }}
              placeholder={t('adminForum.postTitlePlaceholder')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.title && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.title}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t('adminForum.postTopic')}

            <input
              maxLength={MAX_TOPIC}
              value={form.topic}
              onChange={(event) => {
                setForm({ ...form, topic: event.target.value })
                clearFieldError('topic')
              }}
              placeholder={t('adminForum.postTopicPlaceholder')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.topic && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.topic}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t('adminForum.authorName')}
            <input
              maxLength={120}
              value={form.authorName ?? ''}
              onChange={(event) => {
                setForm({ ...form, authorName: event.target.value })
                clearFieldError('authorName')
              }}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.authorName && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.authorName}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t('adminForum.authorRole')}
            <input
              maxLength={40}
              value={form.authorRole ?? ''}
              onChange={(event) => {
                setForm({ ...form, authorRole: event.target.value })
                clearFieldError('authorRole')
              }}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.authorRole && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.authorRole}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
            {t('adminForum.postContent')}

            <textarea
              maxLength={MAX_CONTENT}
              rows={10}
              value={form.content}
              onChange={(event) => {
                setForm({ ...form, content: event.target.value })
                clearFieldError('content')
              }}
              placeholder={t('adminForum.postContentPlaceholder')}
              className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
            />
            {fieldErrors.content && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.content}</span>
            )}

            <span className="mt-xs block text-right text-caption font-normal text-neutral-500">
              {form.content.length}/{MAX_CONTENT}
            </span>

            <span className="mt-xs block text-caption font-normal text-neutral-500">
              {t('adminForum.contentHint')}
            </span>
          </label>

          <div className="font-body text-body-sm font-semibold text-heading md:col-span-2">
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
                  <p className="m-0 truncate text-caption font-normal text-neutral-500">
                    {image
                      ? image.file.name
                      : t('adminForum.currentImage')}
                  </p>

                  <button
                    type="button"
                    onClick={removeImage}
                    className="mt-2xs inline-flex h-9 items-center rounded-full border border-neutral-200 px-md text-caption font-semibold text-danger transition-colors hover:border-danger"
                  >
                    {t('adminForum.removeImage')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-xs inline-flex h-11 items-center gap-xs rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-md text-body-sm font-semibold text-heading transition-colors hover:border-heading"
              >
                <FileImageIcon size={18} aria-hidden="true" />
                {t('adminForum.chooseImage')}
              </button>
            )}

            {imageError && (
              <p className="m-0 mt-xs text-caption font-normal text-danger">
                {imageError}
              </p>
            )}
          </div>

          <label className="font-body text-body-sm font-semibold text-heading md:col-span-2">
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
              <span className="mt-xs block text-caption font-normal text-danger">
                {altError}
              </span>
            )}
          </label>
        </div>

        <div className="mt-xl flex flex-wrap justify-end gap-sm">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
          >
            {t('adminForum.cancel')}
          </Button>

          <Button
            type="submit"
            className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
          >
            {post ? t('adminForum.saveChanges') : t('adminForum.publish')}
          </Button>
        </div>
      </form>

      {pendingChanges && (
        <dialog
          ref={(el) => {
            if (el && !el.open) el.showModal()
          }}
          onClose={() => { setPendingChanges(null); setConfirmationText('') }}
          aria-label={t('adminForum.confirmChangesTitle')}
          className="fixed inset-0 m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
        >
          <div className="relative p-[28px_22px_30px]">
            <button
              type="button"
              className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity hover:opacity-65"
              onClick={() => { setPendingChanges(null); setConfirmationText('') }}
              aria-label={t('adminForum.close')}
            >
              <XIcon size={20} />
            </button>
            <h3 className="m-0 text-center font-heading text-h1 font-bold leading-none text-heading">
              {t('adminForum.confirmChangesTitle')}
            </h3>
            <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
              <p className="m-0 text-left font-body text-body text-neutral-500">
                {t('adminForum.confirmChangesDescription', { word: t('adminForum.confirmWord') })}
              </p>
              <input
                autoFocus
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                aria-label={t('adminForum.confirmWord')}
                className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-body-sm text-body-text outline-none transition-colors focus:border-green-500"
              />
              <div className="mt-sm flex gap-md">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setPendingChanges(null); setConfirmationText('') }}
                  className="h-11 flex-1 rounded-full border-green-500 font-body text-button font-bold uppercase tracking-wide text-heading hover:bg-green-50"
                >
                  {t('adminForum.cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={confirmationText.trim().toLocaleUpperCase() !== t('adminForum.confirmWord').toLocaleUpperCase()}
                  onClick={() => onSubmit(pendingChanges)}
                  className="h-11 flex-1 rounded-full font-body text-button font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('adminForum.confirmChanges')}
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}

export default BlogPostFormModal
