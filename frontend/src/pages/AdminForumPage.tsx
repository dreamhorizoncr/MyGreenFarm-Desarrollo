import { useCallback, useEffect, useState } from 'react'
import { PlusIcon, XIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../layout/AdminLayout.tsx'
import BlogPostCard from '../components/forum/BlogPostCard.tsx'
import BlogPostCardSkeleton from '../components/forum/BlogPostCardSkeleton.tsx'
import BlogPostFormModal from '../components/forum/admin/BlogPostFormModal.tsx'
import Button from '../components/ui/Button.tsx'
import { useForumFeedContext } from '../contexts/ForumFeedContext.tsx'
import { notify } from '../utils/notifications.ts'
import type { BlogPost, BlogPostInput } from '../types/forum.ts'
import { userStorage } from '../utils/userStorage.ts'
import { forumService } from '../services/forum.ts'

function AdminForumPage() {
  const { t } = useTranslation()
  const isTeacher = userStorage.getUser()?.role === 'TEACHER'
  const {
    blogPosts,
    addBlogPost,
    updateBlogPost,
    removeBlogPost,
    getCommentCount,
    isLiked,
    getLikeCount,
    toggleLike,
    isLoading,
    error,
  } = useForumFeedContext()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [teacherPosts, setTeacherPosts] = useState<BlogPost[]>([])
  const [teacherPostsLoading, setTeacherPostsLoading] = useState(isTeacher)
  const [teacherPostsError, setTeacherPostsError] = useState('')

  const refreshTeacherPosts = useCallback(async () => {
    if (!isTeacher) return

    setTeacherPostsLoading(true)
    try {
      const page = await forumService.getMyArticles()
      setTeacherPosts(page.content)
      setTeacherPostsError('')
    } catch {
      setTeacherPostsError('No se pudieron cargar tus publicaciones')
    } finally {
      setTeacherPostsLoading(false)
    }
  }, [isTeacher])

  useEffect(() => {
    if (isTeacher) void refreshTeacherPosts()
  }, [isTeacher, refreshTeacherPosts])

  const visiblePosts = isTeacher ? teacherPosts : blogPosts
  const visibleIsLoading = isLoading || (isTeacher && teacherPostsLoading)
  const visibleError = isTeacher ? teacherPostsError : error

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(post: BlogPost) {
    setEditing(post)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSubmit(input: BlogPostInput) {
    try {
      if (editing) {
        await updateBlogPost(editing.id, input)
        await refreshTeacherPosts()
        notify.success({
          title: t('adminForum.updatedToastTitle'),
          description: t('adminForum.updatedToastDescription'),
        })
      } else {
        await addBlogPost(input)
        await refreshTeacherPosts()
        notify.success({
          title: t('adminForum.createdToastTitle'),
          description: t('adminForum.createdToastDescription'),
        })
      }

      closeForm()
    } catch {
      notify.error('No se pudo guardar el artículo')
    }
  }

  async function confirmDelete() {
    if (!postToDelete) return

    try {
      await removeBlogPost(postToDelete.id)
      await refreshTeacherPosts()
    } catch {
      notify.error('No se pudo eliminar el artículo')
      return
    }

    if (editing?.id === postToDelete.id) closeForm()

    setPostToDelete(null)
    setDeleteConfirmation('')
    notify.success({
      title: t('adminForum.deletedToastTitle'),
      description: t('adminForum.deletedToastDescription'),
    })
  }

  function renderBlogPosts() {
    if (visibleIsLoading) {
      return (
        <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
          <li><BlogPostCardSkeleton isAdmin /></li>
          <li><BlogPostCardSkeleton isAdmin /></li>
        </ul>
      )
    }

    if (visibleError) {
      return (
        <p className="m-0 mt-lg rounded-2xl border border-neutral-200 bg-white p-lg text-body-sm text-danger">
          {visibleError}
        </p>
      )
    }

    if (visiblePosts.length === 0) {
      return (
        <p className="m-0 mt-lg rounded-2xl border border-neutral-200 bg-white p-lg text-body-sm text-neutral-500">
          {t(isTeacher ? 'adminForum.ownEmpty' : 'adminForum.empty')}
        </p>
      )
    }

    return (
      <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
        {visiblePosts.map((post) => (
          <li key={post.id} className="flex flex-col gap-sm">
            <BlogPostCard
              post={post}
              commentCount={getCommentCount(post.id)}
              isLiked={isLiked(post.id)}
              likeCount={getLikeCount(post.id)}
              onToggleLike={toggleLike}
              onEdit={() => openEdit(post)}
              onDelete={() => setPostToDelete(post)}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="m-0 font-heading text-3xl font-bold text-heading">
            {t('adminForum.title')}
          </h1>

          <p className="m-0 mt-2 text-body text-neutral-500">
            {t('adminForum.description')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <PlusIcon size={18} aria-hidden="true" />
          {t('adminForum.addPost')}
        </button>
      </div>

      {renderBlogPosts()}

      {formOpen && (
        <BlogPostFormModal
          post={editing}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {postToDelete && (
        <dialog
          ref={(el) => {
            if (el && !el.open) el.showModal()
          }}
          onClose={() => { setPostToDelete(null); setDeleteConfirmation('') }}
          onClick={(event) => {
            if (event.target === event.currentTarget) { setPostToDelete(null); setDeleteConfirmation('') }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { setPostToDelete(null); setDeleteConfirmation('') }
          }}
          aria-label={t('adminForum.deleteTitle')}
          className="m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
        >
          <div className="relative p-[28px_22px_30px]">
            <div className="flex items-center justify-between gap-md">
              <h2 className="m-0 w-full text-center font-heading text-h1 font-bold leading-none text-heading">
                {t('adminForum.deleteTitle')}
              </h2>

              <button
                type="button"
                onClick={() => { setPostToDelete(null); setDeleteConfirmation('') }}
                aria-label={t('adminForum.close')}
                className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity hover:opacity-65"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
              <p className="m-0 text-left font-body text-body text-neutral-500">
                {t('adminForum.deleteDescription', { title: postToDelete.title })}
              </p>

              <label className="flex flex-col font-body text-body font-normal leading-[1.6] text-body-text">
                {t('adminForum.deleteConfirmFieldLabel', { title: postToDelete.title })}
                <input
                  autoFocus
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  className="h-[38px] w-full border-b border-neutral-300 bg-transparent font-body text-body-sm text-body-text outline-none transition-colors focus:border-green-500"
                />
              </label>

              <div className="mt-sm flex gap-md">
                <Button
                  variant="secondary"
                  onClick={() => { setPostToDelete(null); setDeleteConfirmation('') }}
                  className="h-11 flex-1 rounded-full font-body text-button uppercase tracking-wide"
                >
                  {t('adminForum.cancel')}
                </Button>

                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  disabled={deleteConfirmation !== postToDelete.title}
                  className="h-11 flex-1 rounded-full font-body text-button font-normal uppercase tracking-wide"
                >
                  {t('adminForum.delete')}
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      )}
    </AdminLayout>
  )
}

export default AdminForumPage
