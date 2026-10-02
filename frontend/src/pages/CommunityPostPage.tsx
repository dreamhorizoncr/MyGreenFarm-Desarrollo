import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeftIcon } from '@animateicons/react/lucide'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar.tsx'
import PostAvatar from '../components/forum/PostAvatar.tsx'
import Button from '../components/ui/Button.tsx'
import { forumService } from '../services/forum.ts'
import type { CommunityComment, CommunityPost } from '../types/forum.ts'
import { useForumFeedContext } from '../contexts/ForumFeedContext.tsx'

function CommunityPostPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { communityPosts, isLoading: feedLoading } = useForumFeedContext()
  const post = communityPosts.find((item) => item.id === id) ?? null
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    forumService.getCommunityComments(id)
      .then((loadedComments) => {
        if (!active) return
        setComments(loadedComments)
      })
      .catch(() => { if (active) setError('No se pudo cargar la publicación') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!loading && window.location.hash === '#comments') {
      requestAnimationFrame(() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }, [loading])

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id || !name.trim() || !content.trim()) return
    setSending(true)
    setError('')
    try {
      const comment = await forumService.createCommunityComment(id, { alias: name.trim(), content: content.trim() })
      setComments((current) => [...current, comment])
      setName('')
      setContent('')
      setFormOpen(false)
    } catch {
      setError('No se pudo publicar la respuesta')
    } finally {
      setSending(false)
    }
  }

  if (loading || (feedLoading && !post)) return <p className="p-lg font-body text-body-sm text-neutral-500">{t('forum.community.commentsLoading')}</p>
  if (error && !comments.length) return <Navigate to="/forum?tab=community" replace />

  return <div className="min-h-screen bg-bg-page">
    <Navbar />
    <main className="mx-auto w-full max-w-[900px] px-[14px] py-10 xs:px-[20px]">
      <Link to="/forum?tab=community" className="flex w-fit items-center gap-xs font-body text-body-sm font-semibold text-heading">
        <ArrowLeftIcon size={18} /><span>{t('forum.community.label')}</span>
      </Link>
      {post && <article className="mt-md rounded-2xl border border-neutral-200 bg-white p-lg text-left">
        <header className="flex items-center gap-md">
          <PostAvatar name={post.name} />
          <p className="m-0 min-w-0 truncate font-heading text-h6 font-bold text-heading">{post.name}</p>
        </header>
        <p className="m-0 mt-md whitespace-pre-line break-words text-left font-body text-[16px] leading-[1.6] text-body-text">{post.content}</p>
      </article>}
      <section id="comments" className="mt-md scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-lg">
        <h1 className="m-0 border-b border-neutral-200 pb-md text-left font-heading text-h5 font-bold !text-heading">{t('forum.blog.commentsTitle')}</h1>
        <div className="mt-md flex flex-col gap-md">
          {comments.length === 0 && <p className="m-0 font-body text-body-sm text-neutral-500">{t('forum.community.commentsEmpty')}</p>}
          {comments.map((comment) => <div key={comment.id} className="flex items-start gap-md">
            <PostAvatar name={comment.alias} size={32} />
            <div className="min-w-0 flex-1 text-left">
              <p className="m-0 text-left font-heading text-[16px] font-bold !text-heading">{comment.alias}</p>
              <p className="m-0 mt-3xs whitespace-pre-line break-words text-left font-body text-[16px] leading-[1.55] text-body-text">{comment.content}</p>
            </div>
          </div>)}
        </div>
      </section>
      <div className="mt-md flex flex-col items-center">
        <button type="button" onClick={() => setFormOpen((open) => !open)} aria-expanded={formOpen} className="w-full rounded-full bg-green-500 px-lg py-sm font-body text-body-sm font-semibold text-white">
          {formOpen ? t('forum.community.cancel') : t('forum.community.addComment')}
        </button>
        {formOpen && <form onSubmit={(event) => void submitComment(event)} className="mt-md flex w-full flex-col gap-md rounded-2xl border border-neutral-200 bg-white p-lg">
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required aria-label={t('forum.community.commentNameLabel')} placeholder={t('forum.community.commentNameLabel')} className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-md font-body text-[15px] text-body-text outline-none focus:border-heading" />
          <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={4000} rows={5} required aria-label={t('forum.community.commentContentLabel')} placeholder={t('forum.community.commentContentLabel')} className="min-h-[130px] w-full resize-y rounded-xl border border-neutral-300 bg-white p-md font-body text-[15px] text-body-text outline-none focus:border-heading" />
          {error && <p role="alert" className="m-0 font-body text-body-sm text-danger">{error}</p>}
          <Button type="submit" disabled={sending} className="h-[47px] rounded-full bg-green-500 font-body text-[17px] font-normal text-white hover:opacity-100 disabled:opacity-50">{t('forum.community.commentSubmit')}</Button>
        </form>}
      </div>
    </main>
  </div>
}

export default CommunityPostPage
