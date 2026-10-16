import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CommunityPostCard from '../CommunityPostCard.tsx'
import ForumCommentsModal from './ForumCommentsModal.tsx'
import DeleteConfirmModal from '../../ui/DeleteConfirmModal.tsx'
import Pagination from '../../ui/Pagination.tsx'
import { forumService } from '../../../services/forum.ts'
import { notify } from '../../../utils/notifications.ts'
import type { CommunityComment, CommunityPost } from '../../../types/forum.ts'
import SkeletonList from '../../ui/SkeletonList.tsx'
import { useSkeletonCount } from '../../../hooks/useSkeletonCount.ts'

const COMMUNITY_POST_TRANSLATION_TYPE = 'FORUM_COMMUNITY_POST'
const COMMUNITY_COMMENT_TRANSLATION_TYPE = 'FORUM_COMMUNITY_COMMENT'

interface AdminCommunitySectionProps {
  canDelete: boolean
}

function AdminCommunitySection({ canDelete }: Readonly<AdminCommunitySectionProps>) {
  const { t, i18n } = useTranslation()
  const language = i18n.language.split('-')[0]
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentsPost, setCommentsPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const [commentToDelete, setCommentToDelete] = useState<CommunityComment | null>(null)
  const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const loadPosts = async () => {
      try {
        const result = await forumService.getCommunityPosts(page - 1, 10)
        const items = result.content.map((post) => ({ entityId: post.id, fieldName: 'content', originalText: post.content }))
        let translated: Record<string, string> = {}
        if (items.length) {
          try {
            translated = await forumService.translateBatch(COMMUNITY_POST_TRANSLATION_TYPE, language, items)
          } catch {
            // Si la traducción falla se muestran los textos originales.
          }
        }
        if (cancelled) return
        setPosts(result.content.map((post) => ({ ...post, content: translated[`${post.id}:content`] ?? post.content })))
        setTotalPages(result.totalPages)
        setError('')
      } catch {
        if (!cancelled) setError(t('adminForum.community.loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadPosts()
    return () => {
      cancelled = true
    }
  }, [page, reloadKey, t, language])

  function changePage(nextPage: number) {
    setLoading(true)
    setPage(nextPage)
  }

  async function confirmDeletePost() {
    if (!postToDelete) return

    try {
      await forumService.deleteCommunityPost(postToDelete.id)
    } catch (err) {
      notify.error(t('adminForum.community.deleteErrorToastTitle'))
      throw err
    }

    notify.success({ title: t('adminForum.community.deletedToastTitle') })
    if (posts.length === 1 && page > 1) changePage(page - 1)
    else setReloadKey((key) => key + 1)
  }

  async function openComments(postId: string) {
    const post = posts.find((item) => item.id === postId)
    if (!post) return

    setCommentsPost(post)
    setComments([])
    setCommentsLoading(true)
    setCommentsError('')
    try {
      const loaded = await forumService.getCommunityComments(postId)
      const items = loaded.map((comment) => ({ entityId: comment.id, fieldName: 'content', originalText: comment.content }))
      const translated = items.length
        ? await forumService.translateBatch(COMMUNITY_COMMENT_TRANSLATION_TYPE, language, items).catch(() => ({} as Record<string, string>))
        : {}
      setComments(loaded.map((comment) => ({ ...comment, content: translated[`${comment.id}:content`] ?? comment.content })))
    } catch {
      setCommentsError(t('adminForum.loadCommentsError'))
    } finally {
      setCommentsLoading(false)
    }
  }

  async function confirmDeleteComment() {
    if (!commentsPost || !commentToDelete) return

    try {
      await forumService.deleteCommunityComment(commentsPost.id, commentToDelete.id)
    } catch (err) {
      notify.error(t('adminForum.commentDeleteErrorToastTitle'))
      throw err
    }

    const postId = commentsPost.id
    setComments((current) => current.filter((comment) => comment.id !== commentToDelete.id))
    setPosts((current) => current.map((post) => (
      post.id === postId ? { ...post, commentCount: Math.max(0, post.commentCount - 1) } : post
    )))
    notify.success({ title: t('adminForum.commentDeletedToastTitle') })
  }

  const skeletonCount = useSkeletonCount('admin-community', loading, posts.length, 2)

  function renderPosts() {
    if (loading) {
      return (
        <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
          <SkeletonList count={skeletonCount}>{() => <li><CommunityPostCard loading /></li>}</SkeletonList>
        </ul>
      )
    }

    if (error) {
      return (
        <p className="m-0 mt-lg rounded-2xl border border-neutral-200 bg-white p-lg text-body-sm text-danger">
          {error}
        </p>
      )
    }

    if (posts.length === 0) {
      return (
        <p className="m-0 mt-lg rounded-2xl border border-neutral-200 bg-white p-lg text-body-sm text-neutral-500">
          {t('adminForum.community.empty')}
        </p>
      )
    }

    return (
      <ul className="m-0 mt-lg grid list-none grid-cols-1 items-start gap-xl p-0 lg:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id}>
            <CommunityPostCard
              post={post}
              onOpenComments={openComments}
              onDelete={canDelete ? () => setPostToDelete(post) : undefined}
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      {renderPosts()}

      {!loading && !error && posts.length > 0 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
      )}

      {commentsPost && (
        <ForumCommentsModal
          subtitle={commentsPost.name}
          comments={comments}
          loading={commentsLoading}
          error={commentsError}
          canDelete={canDelete}
          onDeleteRequest={setCommentToDelete}
          onClose={() => setCommentsPost(null)}
        />
      )}

      {postToDelete && (
        <DeleteConfirmModal
          title={t('adminForum.community.deleteTitle')}
          message={t('adminForum.community.deleteDescription', { name: postToDelete.name })}
          onConfirm={confirmDeletePost}
          onClose={() => setPostToDelete(null)}
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
    </>
  )
}

export default AdminCommunitySection
