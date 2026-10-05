import { useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon, HeartIcon, SparklesIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar.tsx'
import Button from '../components/ui/Button.tsx'
import PostAvatar from '../components/forum/PostAvatar.tsx'
import ForumPendingReviewModal from '../components/forum/ForumPendingReviewModal.tsx'
import { useForumFeedContext } from '../contexts/ForumFeedContext.tsx'
import { notify } from '../utils/notifications.ts'
import { getErrorMessage } from '../utils/error.ts'

const MAX_CONTENT = 4000

const PARAGRAPH_BREAK = /\n{2,}/

function BlogPostPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const {
    blogPosts,
    getComments,
    addComment,
    loadComments,
    loadArticle,
    isLoading,
    isLiked,
    getLikeCount,
    toggleLike,
  } = useForumFeedContext()
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [isDetailLoading, setIsDetailLoading] = useState(true)
  const [pendingReview, setPendingReview] = useState(false)
  // Ref (not state) so a second click within the same tick, before React
  // re-renders, is still blocked synchronously — avoids firing the Gemini
  // moderation call twice for one submission.
  const isSubmittingRef = useRef(false)

  useEffect(() => {
    if (window.location.hash !== '#comments' || isLoading || isDetailLoading) return

    requestAnimationFrame(() => {
      document.getElementById('comments')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [id, isLoading, isDetailLoading])

  useEffect(() => {
    if (!id) return

    setIsDetailLoading(true)
    void Promise.all([loadArticle(id), loadComments(id)]).finally(() => {
      setIsDetailLoading(false)
    })
  }, [id, loadArticle, loadComments])

  const post = blogPosts.find((item) => item.id === id)
  const comments = post ? getComments(post.id) : []

  if (isLoading || isDetailLoading) {
    return <p className="p-lg font-body text-body-sm text-neutral-500">Cargando artículo...</p>
  }

  if (!post) return <Navigate to="/forum" replace />

  const postId = post.id
  const paragraphs = post.content.split(PARAGRAPH_BREAK).filter(Boolean)
  const seenParagraphs = new Map<string, number>()
  const keyedParagraphs = paragraphs.map((paragraph) => {
    const occurrence = (seenParagraphs.get(paragraph) ?? 0) + 1
    seenParagraphs.set(paragraph, occurrence)
    return { paragraph, key: `${occurrence}-${paragraph}` }
  })

  function handleSubmit() {
    if (isSubmittingRef.current) return

    const trimmedName = name.trim()
    const trimmedContent = content.trim()

    if (!trimmedName || !trimmedContent) {
      notify.error(
        t(
          trimmedName
            ? 'forum.blog.commentContentRequired'
            : 'forum.blog.commentNameRequired',
        ),
      )
      return
    }

    isSubmittingRef.current = true
    // Show the "sent for review" confirmation right away instead of leaving
    // the form stuck while the moderation check runs; the real outcome
    // arrives later as a toast (success or rejection reason).
    setName('')
    setContent('')
    setPendingReview(true)
    addComment(postId, { alias: trimmedName, content: trimmedContent })
      .then(() => {
        notify.success({
          title: t('forum.blog.toastTitle'),
          description: t('forum.blog.toastDescription'),
        })
      })
      .catch((err) => {
        notify.error(getErrorMessage(err))
      })
      .finally(() => {
        isSubmittingRef.current = false
      })
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <main className="mx-auto w-full max-w-[1120px] px-[14px] py-10 xs:px-[20px] xs:py-12">
        <Link
          to="/forum"
          className="flex w-fit items-center gap-xs text-left font-body text-body-sm font-semibold text-heading"
        >
          <ArrowLeftIcon size={18} />
          <span>{t('forum.blog.backToBlog')}</span>
        </Link>

        <div className="mt-md">
          <article className="flex flex-col gap-md">
            <header className="rounded-2xl border border-neutral-200 bg-white p-lg">
              <div className="flex flex-wrap items-center gap-md">
                <PostAvatar
                  name={post.authorName}
                  src={post.authorAvatarUrl}
                  size={44}
                />

                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-left font-heading text-body-sm font-bold text-heading">
                    {post.authorName}
                  </p>

                    <p className="m-0 mt-3xs truncate text-left font-body text-[14px] text-neutral-500">
                    {post.authorRole}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
                  {post.topic}
                </span>
              </div>

              <h1 className="m-0 mt-md text-left font-heading text-[26px] font-bold leading-tight text-heading md:text-page-title">
                {post.title}
              </h1>

              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.imageAlt ?? ''}
                  className="mt-md max-h-[520px] w-full rounded-xl object-cover"
                />
              )}

              {post.aiSummary && (
                <div className="mt-md rounded-[20px] bg-gradient-to-br from-green-50 to-white p-[22px] text-left shadow-sm ring-1 ring-green-100 md:p-[28px]">
                  <div className="mb-[12px] inline-flex items-center gap-[6px] rounded-full bg-green-500 px-[12px] py-[6px]">
                    <SparklesIcon size={14} className="text-white" aria-hidden="true" />
                    <span className="font-heading text-caption font-bold uppercase tracking-wide text-white">
                      {t('newspage.aiSummary')}
                    </span>
                  </div>
                  <p className="font-body text-body leading-[1.7] text-heading md:text-button">
                    {post.aiSummary}
                  </p>
                </div>
              )}

              <div className="mt-md">
                {keyedParagraphs.map(({ paragraph, key }) => (
                  <p
                    key={key}
                    className="m-0 whitespace-pre-line break-words text-left font-body text-body leading-[1.75] text-body-text [&:not(:first-child)]:mt-md"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-lg border-t border-neutral-100 pt-md">
                <button
                  type="button"
                  onClick={() => toggleLike(post.id)}
                  aria-pressed={isLiked(post.id)}
                  aria-label={t('forum.likes.label')}
                  className={`flex items-center gap-xs font-body text-body-sm transition ${
                    isLiked(post.id)
                      ? 'text-danger'
                      : 'text-neutral-500 hover:text-danger'
                  }`}
                >
                  <HeartIcon
                    size={20}
                    className={isLiked(post.id) ? 'fill-current' : ''}
                  />
                  <span>{getLikeCount(post.id)}</span>
                </button>
              </div>
            </header>

            <section id="comments" className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-lg">
              <h2 className="m-0 text-left font-heading text-h5 font-bold text-heading">
                {t('forum.blog.commentsTitle')}
              </h2>

              <div className="mt-md flex flex-col gap-lg">
                {comments.length === 0 && (
                  <p className="m-0 text-left font-body text-body-sm text-neutral-500">
                    {t('forum.blog.commentsEmpty')}
                  </p>
                )}

                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-md">
                    <PostAvatar name={comment.alias} size={32} />

                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-left font-heading text-body-sm font-bold text-heading">
                        {comment.alias}
                      </p>

                      <p className="m-0 mt-3xs whitespace-pre-line break-words text-left font-body text-body-sm leading-[1.55] text-body-text">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-lg border-t border-neutral-100 pt-md">
                <input
                  id="blog-comment-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={40}
                  aria-label={t('forum.blog.commentNameLabel')}
                  placeholder={t('forum.blog.commentNameLabel')}
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-md text-left font-body text-body-sm text-body-text outline-none focus:border-heading"
                />

                <textarea
                  id="blog-comment-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={MAX_CONTENT}
                  rows={4}
                  aria-label={t('forum.blog.commentContentLabel')}
                  placeholder={t('forum.blog.commentContentLabel')}
                  className="mt-md w-full resize-y rounded-xl border border-neutral-200 bg-white p-md text-left font-body text-body-sm text-body-text outline-none focus:border-heading"
                />

                <p className="m-0 mt-xs text-right font-body text-caption text-body-text">
                  {content.length}/{MAX_CONTENT}
                </p>

                <Button
                  onClick={handleSubmit}
                  className="mt-md h-11 rounded-full bg-orange-500 font-body text-button font-normal text-white"
                >
                  {t('forum.blog.commentSubmit')}
                </Button>
              </div>
            </section>
          </article>

        </div>
      </main>

      {pendingReview && (
        <ForumPendingReviewModal
          title={t('forum.blog.commentPendingTitle')}
          description={t('forum.blog.commentPendingDescription')}
          onClose={() => setPendingReview(false)}
        />
      )}
    </div>
  )
}

export default BlogPostPage
