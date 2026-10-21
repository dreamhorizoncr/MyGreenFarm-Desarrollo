import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../../ui/Button.tsx'
import { useModalExit } from '../../../hooks/useModalExit.ts'
import type { BlogPost, BlogPostInput } from '../../../types/forum.ts'
import { userStorage } from '../../../utils/userStorage.ts'
import { validateRequired, validateSafeText } from '../../../utils/validators.ts'
import ImagePickerButton from '../../ui/ImagePickerButton.tsx'
import ImageThumb, { ImageThumbList } from '../../ui/ImageThumb.tsx'
import ModalCloseButton from '../../ui/ModalCloseButton.tsx'
import FieldHint from '../../ui/FieldHint.tsx'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/svg+xml',
])

const MAX_TITLE = 120
const MAX_TOPIC = 60
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
  const currentUser = userStorage.getUser()
  const isTeacher = currentUser?.role === 'TEACHER'
  const { closing, requestClose } = useModalExit(onClose)

  const [form, setForm] = useState<BlogPostInput>(() => {
    if (post) {
      return {
        title: post.title,
        topic: post.topic,
        content: post.content,
        authorName: post.authorName ?? '',
        authorRole: post.authorRole ?? '',
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

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current
      return { ...current, [field]: null }
    })
  }

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }

    document.addEventListener('keydown', handleEscape)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
      if (image) URL.revokeObjectURL(image.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image])

  function handleFileChange(file: File | undefined) {
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

  function clearSelectedImage() {
    if (image) URL.revokeObjectURL(image.previewUrl)
    setImage(null)
  }

  function removeImage() {
    if (image) URL.revokeObjectURL(image.previewUrl)
    setImage(null)
    setForm((current) => ({ ...current, imageUrl: undefined, imageAlt: '', removeImage: true }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors: Record<string, string | null> = {
      title: validateRequired(form.title, t('adminForum.postTitle'), t) ?? validateSafeText(form.title, t),
      topic: validateRequired(form.topic, t('adminForum.postTopic'), t) ?? validateSafeText(form.topic, t),
      authorName: validateRequired(form.authorName ?? '', t('adminForum.authorName'), t) ?? validateSafeText(form.authorName ?? '', t),
      authorRole: validateRequired(form.authorRole ?? '', t('adminForum.authorRole'), t) ?? validateSafeText(form.authorRole ?? '', t),
      content: validateRequired(form.content, t('adminForum.postContent'), t) ?? validateSafeText(form.content, t),
    }

    setFieldErrors(errors)

    if (Object.values(errors).some((message) => message !== null)) return

    if ((image || form.imageUrl) && !form.imageAlt?.trim()) {
      setAltError(t('common.imageAltRequired'))
      return
    }

    const altUnsafeError = validateSafeText(form.imageAlt, t)
    if (altUnsafeError) {
      setAltError(altUnsafeError)
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

    onSubmit(input)
  }


  return (
    <div
      className="text-left fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-[16px] md:p-[30px]"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('adminForum.close')}
        className="absolute inset-0 size-full cursor-default"
        onClick={requestClose}
      />

      <form
        onSubmit={handleSubmit}
        className={`relative mx-auto max-h-full modal-scroll w-full max-w-[820px] rounded-[20px] border border-neutral-200 bg-white p-lg md:p-xl ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
      >
        <div className="flex items-center justify-between gap-md">
          <h2 className="m-0 font-heading text-h4 font-bold text-heading">
            {post ? t('adminForum.editPost') : t('adminForum.newPost')}
          </h2>

          <ModalCloseButton
            onClick={requestClose}
            aria-label={t('adminForum.close')}
          />
        </div>

        <div className="mt-lg grid grid-cols-1 gap-md md:grid-cols-2">
          <label className="font-body text-body-sm font-semibold text-heading">
            {t('adminForum.postTitle')}

            <input
              maxLength={MAX_TITLE}
              value={form.title}
              onChange={(event) => {
                setForm({ ...form, title: event.target.value })
                clearFieldError('title')
              }}
              placeholder={t('fields.post.title.placeholder')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t('fields.post.title.hint')}</FieldHint>
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
              placeholder={t('fields.post.topic.placeholder')}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t('fields.post.topic.hint')}</FieldHint>
            {fieldErrors.topic && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.topic}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t('adminForum.authorName')}
            <input
              placeholder={t('fields.post.authorName.placeholder')}
              maxLength={120}
              value={form.authorName ?? ''}
              onChange={(event) => {
                setForm({ ...form, authorName: event.target.value })
                clearFieldError('authorName')
              }}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t('fields.post.authorName.hint')}</FieldHint>
            {fieldErrors.authorName && (
              <span className="mt-xs block font-body text-body-sm font-normal text-danger">{fieldErrors.authorName}</span>
            )}
          </label>

          <label className="font-body text-body-sm font-semibold text-heading">
            {t('adminForum.authorRole')}
            <input
              placeholder={t('fields.post.authorRole.placeholder')}
              maxLength={40}
              value={form.authorRole ?? ''}
              onChange={(event) => {
                setForm({ ...form, authorRole: event.target.value })
                clearFieldError('authorRole')
              }}
              className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
            />
            <FieldHint>{t('fields.post.authorRole.hint')}</FieldHint>
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
              placeholder={t('fields.post.content.placeholder')}
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

            <ImagePickerButton
              label={t('adminForum.chooseImage')}
              replacesCurrent={Boolean(form.imageUrl)}
              accept="image/png,image/jpg,image/jpeg,image/svg+xml"
              onSelect={(files) => handleFileChange(files[0])}
            />

            {image && (
              <ImageThumbList className="mt-sm">
                <ImageThumb
                  src={image.previewUrl}
                  label={image.file.name}
                  onDelete={clearSelectedImage}
                  deleteLabel={t('adminForum.removeImage')}
                  altText={form.imageAlt ?? ''}
                  onAltChange={(value) => {
                    setAltError('')
                    setForm((current) => ({ ...current, imageAlt: value }))
                  }}
                  altError={altError || null}
                  altLabel={t('common.imageAltLabel')}
                  altPlaceholder={t('common.imageAltPlaceholder')}
                />
              </ImageThumbList>
            )}

            {!image && form.imageUrl && (
              <ImageThumbList title={t('adminForum.currentImage')} className="mt-sm">
                <ImageThumb
                  src={form.imageUrl}
                  label={t('adminForum.postImage')}
                  onDelete={removeImage}
                  deleteLabel={t('adminForum.removeImage')}
                  altText={form.imageAlt ?? ''}
                  onAltChange={(value) => {
                    setAltError('')
                    setForm((current) => ({ ...current, imageAlt: value }))
                  }}
                  altError={altError || null}
                  altLabel={t('common.imageAltLabel')}
                  altPlaceholder={t('common.imageAltPlaceholder')}
                />
              </ImageThumbList>
            )}

            {imageError && (
              <p className="m-0 mt-xs text-caption font-normal text-danger">
                {imageError}
              </p>
            )}
          </div>

        </div>

        <div className="mt-xl flex justify-end gap-md *:flex-1">
          <Button
            type="button"
            variant="secondary"
            onClick={requestClose}
            className="h-11 w-auto rounded-full border-green-500 px-lg font-body text-body-sm font-semibold text-heading hover:bg-green-50"
          >
            {t('adminForum.cancel')}
          </Button>

          <Button
            type="submit"
            disabled={!form.title.trim() || !form.topic.trim() || !(form.authorName ?? '').trim() || !(form.authorRole ?? '').trim() || !form.content.trim()}
            className="h-11 w-auto rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white hover:bg-orange-600"
          >
            {post ? t('adminForum.saveChanges') : t('adminForum.publish')}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default BlogPostFormModal
