import { useCallback, useEffect, useState } from 'react'
import { PlusIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../layout/AdminLayout.tsx'
import BlogPostCard from '../components/forum/BlogPostCard.tsx'
import BlogPostFormModal from '../components/forum/admin/BlogPostFormModal.tsx'
import ForumCommentsModal from '../components/forum/admin/ForumCommentsModal.tsx'
import AdminCommunitySection from '../components/forum/admin/AdminCommunitySection.tsx'
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import { useForumFeedContext } from '../contexts/ForumFeedContext.tsx'
import { notify, notifyError } from '../utils/notifications.ts'
import type { BlogComment, BlogPost, BlogPostInput } from '../types/forum.ts'
import { userStorage } from '../utils/userStorage.ts'
import { forumService } from '../services/forum.ts'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'
import TabHighlight from '../components/ui/TabHighlight.tsx'

type ForumAdminTab = 'posts' | 'community'

const FORUM_ADMIN_TABS: ForumAdminTab[] = ['posts', 'community']

const tabClassName = (active: boolean) =>
  `relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${
    active ? 'border-green-500 text-white' : 'border-green-500 bg-transparent text-heading hover:bg-green-50'
  }`

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

  const [activeTab, setActiveTab] = useState<ForumAdminTab>('posts')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [commentsPost, setCommentsPost] = useState<BlogPost | null>(null)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const [commentToDelete, setCommentToDelete] = useState<BlogComment | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
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
      setPostsError(isTeacher ? t('adminForum.loadOwnPostsError') : t('adminForum.loadPostsError'))
    } finally {
      setPostsLoading(false)
    }
  }, [isTeacher, i18n.language, t])

  useEffect(() => {
    void refreshPosts(page, i18n.language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, page, i18n.language])

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
    } catch (err) {
      notifyError(t('adminForum.saveErrorToastTitle'), err)
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

    setDeletingCommentId(commentToDelete.id)
    try {
      await removeComment(commentsPost.id, commentToDelete.id)
      notify.success({
        title: t('adminForum.commentDeletedToastTitle'),
      })
    } catch (err) {
      notifyError(t('adminForum.commentDeleteErrorToastTitle'), err)
      throw err
    } finally {
      setDeletingCommentId(null)
    }
  }

  async function confirmDelete() {
    if (!postToDelete) return

    try {
      await removeBlogPost(postToDelete.id)
      await refreshPosts(page, i18n.language)
    } catch (err) {
      notifyError(t('adminForum.deleteErrorToastTitle'), err)
      throw err
    }

    if (editing?.id === postToDelete.id) closeForm()

    notify.success({
      title: t('adminForum.deletedToastTitle'),
      description: t('adminForum.deletedToastDescription'),
    })
  }

  const skeletonCount = useSkeletonCount('admin-forum-blog', visibleIsLoading, visiblePosts.length, 2)

  function renderBlogPosts() {
    if (visibleIsLoading) {
      return (
        <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
          <SkeletonList count={skeletonCount}>{() => <li><BlogPostCard loading isAdmin /></li>}</SkeletonList>
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

        {activeTab === 'posts' && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <PlusIcon size={18} aria-hidden="true" />
            {t('adminForum.addPost')}
          </button>
        )}
      </div>

      <div role="tablist" aria-label={t('adminForum.tabs.label')} className="isolate mt-xl flex flex-wrap gap-sm">
        {FORUM_ADMIN_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={tabClassName(activeTab === tab)}
          >
            {activeTab === tab && <TabHighlight layoutId="admin-forum-tab" className="bg-green-500" />}
            {t(`adminForum.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'posts' ? (
        <>
          {renderBlogPosts()}

          {!visibleIsLoading && !visibleError && visiblePosts.length > 0 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      ) : (
        <AdminCommunitySection canDelete={isOwner} />
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
        <ForumCommentsModal
          subtitle={commentsPost.title}
          comments={getComments(commentsPost.id)}
          loading={commentsLoading}
          skeletonCount={commentsPost.commentCount}
          deletingId={deletingCommentId}
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
