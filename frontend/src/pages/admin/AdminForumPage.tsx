import StatusMessage from '../../components/ui/StatusMessage.tsx'
import { BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PlusIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../layout/AdminLayout.tsx'
import BlogPostCard from '../../components/forum/BlogPostCard.tsx'
import BlogPostFormModal from '../../components/forum/admin/BlogPostFormModal.tsx'
import ForumCommentsModal from '../../components/forum/admin/ForumCommentsModal.tsx'
import AdminCommunitySection from '../../components/forum/admin/AdminCommunitySection.tsx'
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal.tsx'
import Pagination from '../../components/ui/Pagination.tsx'
import { useForumFeedContext } from '../../contexts/forumFeed.ts'
import { notify, notifyError } from '../../utils/notifications.ts'
import type { BlogComment, BlogPost, BlogPostInput } from '../../types/forum.ts'
import { userStorage } from '../../utils/userStorage.ts'
import { forumService } from '../../services/forum.ts'
import SkeletonList from '../../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../../hooks/useSkeletonCount.ts'
import TabHighlight from '../../components/ui/TabHighlight.tsx'
import { tabCarouselClass, useTabCarousel } from '../../hooks/useTabCarousel.ts'

type ForumAdminTab = 'posts' | 'community'

const FORUM_ADMIN_TABS: ForumAdminTab[] = ['posts', 'community']

/** Articles per page. */
const PAGE_SIZE = 10

const tabClassName = (active: boolean) =>
  `relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 ${
    active ? 'border-green-500 text-white' : 'border-green-500 bg-transparent text-heading hover:bg-green-50'
  }`

/**
 * Loads one page of forum articles and translates their texts into the given language.
 *
 * @param ownOnly - true for a teacher, who only manages their own articles
 * @param page - page number, starting at 1
 * @param languageCode - two-letter language code
 * @returns the articles as stored (which the form edits), the translated ones (which are shown) and
 *   the number of pages
 */
async function loadArticles(ownOnly: boolean, page: number, languageCode: string) {
  const result = ownOnly
    ? await forumService.getMyArticles(page - 1, PAGE_SIZE)
    : await forumService.getArticles(page - 1, PAGE_SIZE)

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

  let posts = result.content
  if (items.length > 0) {
    try {
      const translated = await forumService.translateBatch('FORUM_ARTICLE', languageCode, items)
      posts = result.content.map((post) => ({
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
      }))
    } catch {
      // without a translation the articles are shown in their original language
    }
  }

  return { sourcePosts: result.content, posts, totalPages: result.totalPages }
}

/**
 * Admin page of the forum: the articles (a teacher only sees theirs) with their comments, and the
 * community posts.
 */
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
  const tabRowRef = useTabCarousel(activeTab)
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

  const languageCode = i18n.language.split('-')[0]
  const [reloadCount, setReloadCount] = useState(0)
  const loadKey = `${isTeacher}|${page}|${languageCode}`
  const [loadedKey, setLoadedKey] = useState(loadKey)

  // changing page or language shows the skeleton right away, without a render with the old posts
  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey)
    setPostsLoading(true)
  }

  /** Loads the current page again, for example after saving or deleting an article. */
  const reloadPosts = () => {
    setPostsLoading(true)
    setReloadCount((count) => count + 1)
  }

  useEffect(() => {
    let active = true
    loadArticles(isTeacher, page, languageCode)
      .then((loaded) => {
        if (!active) return
        setSourcePosts(loaded.sourcePosts)
        setPosts(loaded.posts)
        setTotalPages(loaded.totalPages)
        setPostsError('')
      })
      .catch(() => {
        if (active) setPostsError(t(isTeacher ? 'adminForum.loadOwnPostsError' : 'adminForum.loadPostsError'))
      })
      .finally(() => {
        if (active) setPostsLoading(false)
      })
    return () => {
      active = false
    }
  }, [isTeacher, page, languageCode, reloadCount, t])

  const getSourcePost = (id: string) => sourcePosts.find((item) => item.id === id) ?? posts.find((item) => item.id === id) ?? null

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
        reloadPosts()
        notify.success({
          title: t('adminForum.updatedToastTitle'),
          description: t('adminForum.updatedToastDescription'),
        })
      } else {
        await addBlogPost(input)
        reloadPosts()
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
    const post = posts.find((item) => item.id === postId)
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
      reloadPosts()
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

  const skeletonCount = useSkeletonCount('admin-forum-blog', postsLoading, posts.length, 2)

  function renderBlogPosts() {
    if (postsLoading) {
      return (
        <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
          <SkeletonList count={skeletonCount}>{() => <li><BlogPostCard loading isAdmin /></li>}</SkeletonList>
        </ul>
      )
    }

    if (postsError) {
      return (
        <StatusMessage variant="error" description={postsError} className="mt-lg" />
      )
    }

    if (posts.length === 0) {
      return (
        <StatusMessage icon={BookOpen} description={t(isTeacher ? 'adminForum.ownEmpty' : 'adminForum.empty')} className="mt-lg" />
      )
    }

    return (
      <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
        {posts.map((post) => (
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
            className="inline-flex h-11 items-center gap-xs rounded-full blob-fill bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <PlusIcon size={18} aria-hidden="true" />
            {t('adminForum.addPost')}
          </button>
        )}
      </div>

      <div role="tablist" aria-label={t('adminForum.tabs.label')} ref={tabRowRef} className={`${tabCarouselClass} mt-[calc(var(--spacing-xl)-4px)] -mb-1`}>
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

          {!postsLoading && !postsError && posts.length > 0 && (
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
