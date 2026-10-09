import { useCallback, useEffect, useState } from 'react'
import { PlusIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../layout/AdminLayout.tsx'
import BlogPostCard from '../components/forum/BlogPostCard.tsx'
import BlogPostFormModal from '../components/forum/admin/BlogPostFormModal.tsx'
import BlogPostCommentsModal from '../components/forum/admin/BlogPostCommentsModal.tsx'
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import { useForumFeedContext } from '../contexts/ForumFeedContext.tsx'
import { notify } from '../utils/notifications.ts'
import type { BlogComment, BlogPost, BlogPostInput } from '../types/forum.ts'
import { userStorage } from '../utils/userStorage.ts'
import { forumService } from '../services/forum.ts'

function AdminForumPage() {
  const { t, i18n } = useTranslation()
  const isTeacher = userStorage.getUser()?.role === 'TEACHER'
  const isOwner = userStorage.getUser()?.role === 'OWNER'
  const {
    addBlogPost,
    updateBlogPost,
    removeBlogPost,
    getComments,
    loadComments,
    removeComment,
    getCommentCount,
    isLiked,
    getLikeCount,
    toggleLike,
  } = useForumFeedContext()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [commentsPost, setCommentsPost] = useState<BlogPost | null>(null)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const [commentToDelete, setCommentToDelete] = useState<BlogComment | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [sourcePosts, setSourcePosts] = useState<BlogPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState('')

  const refreshPosts = useCallback(async (targetPage: number, lang?: string) => {
    setPostsLoading(true)
    try {
      const result = isTeacher
        ? await forumService.getMyArticles(targetPage - 1, 10)
        : await forumService.getArticles(targetPage - 1, 10)
      setSourcePosts(result.content)
      setTotalPages(result.totalPages)
      setPostsError('')

      // Traducción dinámica (Cloud Translation, cualquier idioma origen).
      // El form de crear/editar usa el original (sourcePosts); la lista muestra traducido.
      const targetLang = (lang ?? i18n.language).split('-')[0]
      const items = result.content.flatMap((post) => [
        { entityId: post.id, fieldName: 'title', originalText: post.title },
        { entityId: post.id, fieldName: 'topic', originalText: post.topic },
        { entityId: post.id, fieldName: 'content', originalText: post.content },
        ...(post.aiSummary
          ? [{ entityId: post.id, fieldName: 'aiSummary', originalText: post.aiSummary }]
          : []),
        ...(post.authorRole
          ? [{ entityId: post.id, fieldName: 'authorRole', originalText: post.authorRole }]
          : []),
        ...(post.imageAlt
          ? [{ entityId: post.id, fieldName: 'imageAlt', originalText: post.imageAlt }]
          : []),
      ])
      if (items.length > 0) {
        try {
          const translated = await forumService.translateBatch('FORUM_ARTICLE', targetLang, items)
          setPosts(result.content.map((post) => ({
            ...post,
            title: translated[`${post.id}:title`] ?? post.title,
            topic: translated[`${post.id}:topic`] ?? post.topic,
            content: translated[`${post.id}:content`] ?? post.content,
            aiSummary: post.aiSummary
              ? translated[`${post.id}:aiSummary`] ?? post.aiSummary
              : post.aiSummary,
            authorRole: post.authorRole
              ? translated[`${post.id}:authorRole`] ?? post.authorRole
              : post.authorRole,
            imageAlt: post.imageAlt
              ? translated[`${post.id}:imageAlt`] ?? post.imageAlt
              : post.imageAlt,
          })))
        } catch {
          setPosts(result.content)
        }
      } else {
        setPosts(result.content)
      }
    } catch {
      setPostsError(isTeacher ? 'No se pudieron cargar tus publicaciones' : 'No se pudieron cargar los artículos')
    } finally {
      setPostsLoading(false)
    }
  }, [isTeacher, i18n.language])

  useEffect(() => {
    void refreshPosts(page, i18n.language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, page, i18n.language])

  // El modal de crear/editar siempre trabaja con el texto original
  const getSourcePost = (id: string) => sourcePosts.find((item) => item.id === id) ?? posts.find((item) => item.id === id) ?? null

  const visiblePosts = posts
  const visibleIsLoading = postsLoading
  const visibleError = postsError

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(post: BlogPost) {
    setEditing(getSourcePost(post.id))
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
        await refreshPosts(page, i18n.language)
        notify.success({
          title: t('adminForum.updatedToastTitle'),
          description: t('adminForum.updatedToastDescription'),
        })
      } else {
        await addBlogPost(input)
        await refreshPosts(page, i18n.language)
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

  async function openComments(postId: string) {
    const post = visiblePosts.find((item) => item.id === postId)
    if (!post) return

    setCommentsPost(post)
    setCommentsLoading(true)
    setCommentsError('')
    try {
      await loadComments(postId)
    } catch {
      setCommentsError(t('adminForum.loadCommentsError'))
    } finally {
      setCommentsLoading(false)
    }
  }

  function closeComments() {
    setCommentsPost(null)
    setCommentsError('')
  }

  async function confirmDeleteComment() {
    if (!commentsPost || !commentToDelete) return

    try {
      await removeComment(commentsPost.id, commentToDelete.id)
      notify.success({
        title: t('adminForum.commentDeletedToastTitle'),
      })
    } catch (err) {
      notify.error(t('adminForum.commentDeleteErrorToastTitle'))
      throw err
    }
  }

  async function confirmDelete() {
    if (!postToDelete) return

    try {
      await removeBlogPost(postToDelete.id)
      await refreshPosts(page, i18n.language)
    } catch (err) {
      notify.error('No se pudo eliminar el artículo')
      throw err
    }

    if (editing?.id === postToDelete.id) closeForm()

    notify.success({
      title: t('adminForum.deletedToastTitle'),
      description: t('adminForum.deletedToastDescription'),
    })
  }

  function renderBlogPosts() {
    if (visibleIsLoading) {
      return (
        <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
          <li><BlogPostCard loading isAdmin /></li>
          <li><BlogPostCard loading isAdmin /></li>
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
              onOpenComments={openComments}
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
          <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
            {t('adminForum.title')}
          </h1>

          <p className="mt-2 font-body text-body text-neutral-500">
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

      {!visibleIsLoading && !visibleError && visiblePosts.length > 0 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {formOpen && (
        <BlogPostFormModal
          post={editing}
          onClose={closeForm}
          onSubmit={handleSubmit}
        />
      )}

      {postToDelete && (
        <DeleteConfirmModal
          title={t('adminForum.deleteTitle')}
          message={t('adminForum.deleteDescription', { title: postToDelete.title })}
          onConfirm={confirmDelete}
          onClose={() => setPostToDelete(null)}
        />
      )}

      {commentsPost && (
        <BlogPostCommentsModal
          post={commentsPost}
          comments={getComments(commentsPost.id)}
          loading={commentsLoading}
          error={commentsError}
          canDelete={isOwner}
          onDeleteRequest={setCommentToDelete}
          onClose={closeComments}
        />
      )}

      {commentToDelete && (
        <DeleteConfirmModal
          title={t('adminForum.deleteCommentTitle')}
          message={t('adminForum.deleteCommentDescription', { alias: commentToDelete.alias })}
          onConfirm={confirmDeleteComment}
          onClose={() => setCommentToDelete(null)}
        />
      )}
    </AdminLayout>
  )
}

export default AdminForumPage
