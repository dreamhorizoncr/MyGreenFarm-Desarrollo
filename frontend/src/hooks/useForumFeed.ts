import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { forumService } from '../services/forum.ts'
import type {
  BlogComment,
  BlogPost,
  BlogPostInput,
  CommunityPost,
} from '../types/forum.ts'

interface NameContentInput {
  name: string
  content: string
}

interface CommentInput {
  alias: string
  content: string
}

const ARTICLE_TRANSLATION_TYPE = 'FORUM_ARTICLE'
const COMMENT_TRANSLATION_TYPE = 'FORUM_COMMENT'
const COMMUNITY_TRANSLATION_TYPE = 'FORUM_COMMUNITY_POST'

function useForumFeed() {
  const { i18n } = useTranslation()
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [sourceCommunityPosts, setSourceCommunityPosts] = useState<CommunityPost[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [sourceBlogPosts, setSourceBlogPosts] = useState<BlogPost[]>([])
  const [commentsByPost, setCommentsByPost] = useState<Record<string, BlogComment[]>>({})
  const [sourceCommentsByPost, setSourceCommentsByPost] = useState<Record<string, BlogComment[]>>({})
  const [likesByPost, setLikesByPost] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadForum() {
      try {
        const [articles, likedIds, community, communityLikedIds] = await Promise.all([
          forumService.getArticles(),
          forumService.getMyLikes(),
          forumService.getCommunityPosts(),
          forumService.getMyCommunityLikes(),
        ])

        if (!active) return

        const likedIdSet = new Set(likedIds)
        const articlesWithLikes = articles.content.map((article) => ({
          ...article,
          reacted: likedIdSet.has(article.id) || article.reacted,
        }))

        setSourceBlogPosts(articlesWithLikes)
        setBlogPosts(articlesWithLikes)
        setLikesByPost(
          articlesWithLikes.reduce<Record<string, boolean>>((likes, article) => {
            likes[article.id] = article.reacted
            return likes
          }, {}),
        )
        const communityLikedSet = new Set(communityLikedIds)
        const communityWithLikes = community.content.map((post) => ({ ...post, reacted: communityLikedSet.has(post.id) }))
        setSourceCommunityPosts(communityWithLikes)
        setCommunityPosts(communityWithLikes)
      } catch {
        if (active) setError('No se pudo cargar el foro')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadForum()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const language = (i18n.resolvedLanguage ?? i18n.language).split('-')[0]
    if (!sourceBlogPosts.length && !sourceCommunityPosts.length && !Object.keys(sourceCommentsByPost).length) {
      return
    }

    let active = true
    async function translateForum() {
      try {
        const articleItems = sourceBlogPosts.flatMap((post) => [
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
        const commentItems = Object.values(sourceCommentsByPost).flatMap((comments) =>
          comments.flatMap((comment) => [
            { entityId: comment.id, fieldName: 'content', originalText: comment.content },
          ]),
        )
        const communityItems = sourceCommunityPosts.flatMap((post) => [
          { entityId: post.id, fieldName: 'content', originalText: post.content },
        ])

        const [articleTranslations, commentTranslations, communityTranslations] = await Promise.all([
          forumService.translateBatch(ARTICLE_TRANSLATION_TYPE, language, articleItems),
          forumService.translateBatch(COMMENT_TRANSLATION_TYPE, language, commentItems),
          forumService.translateBatch(COMMUNITY_TRANSLATION_TYPE, language, communityItems),
        ])

        if (!active) return

        setBlogPosts(sourceBlogPosts.map((post) => ({
          ...post,
          title: articleTranslations[`${post.id}:title`] ?? post.title,
          topic: articleTranslations[`${post.id}:topic`] ?? post.topic,
          content: articleTranslations[`${post.id}:content`] ?? post.content,
          aiSummary: post.aiSummary
            ? articleTranslations[`${post.id}:aiSummary`] ?? post.aiSummary
            : post.aiSummary,
          authorRole: post.authorRole
            ? articleTranslations[`${post.id}:authorRole`] ?? post.authorRole
            : post.authorRole,
          imageAlt: post.imageAlt
            ? articleTranslations[`${post.id}:imageAlt`] ?? post.imageAlt
            : post.imageAlt,
        })))
        setCommentsByPost(
          Object.fromEntries(
            Object.entries(sourceCommentsByPost).map(([postId, comments]) => [
              postId,
              comments.map((comment) => ({
                ...comment,
                content: commentTranslations[`${comment.id}:content`] ?? comment.content,
              })),
            ]),
          ),
        )
        setCommunityPosts(sourceCommunityPosts.map((post) => ({
          ...post,
          content: communityTranslations[`${post.id}:content`] ?? post.content,
        })))
      } catch {
        // Keep the original language visible if translation is unavailable.
      }
    }

    void translateForum()
    return () => {
      active = false
    }
  }, [i18n.language, i18n.resolvedLanguage, sourceBlogPosts, sourceCommentsByPost, sourceCommunityPosts])

  const addCommunityPost = useCallback(async (input: NameContentInput) => {
    const post = await forumService.createCommunityPost(input)
    const completePost = { ...post, likeCount: 0, commentCount: 0, reacted: false }
    setSourceCommunityPosts((previous) => [completePost, ...previous])
    setCommunityPosts((previous) => [completePost, ...previous])
  }, [])

  const toggleCommunityLike = useCallback(async (postId: string) => {
    const result = await forumService.toggleCommunityLike(postId)
    const update = (posts: CommunityPost[]) => posts.map((post) => post.id === postId
      ? { ...post, likeCount: result.totalLikes, reacted: result.liked } : post)
    setSourceCommunityPosts(update)
    setCommunityPosts(update)
  }, [])

  const addBlogPost = useCallback(async (input: BlogPostInput) => {
    const post = await forumService.createArticle(input)
    setSourceBlogPosts((previous) => [post, ...previous])
    setBlogPosts((previous) => [post, ...previous])
  }, [])

  const updateBlogPost = useCallback(async (postId: string, input: BlogPostInput) => {
    const updated = await forumService.updateArticle(postId, input)
    setSourceBlogPosts((previous) => previous.map((post) => post.id === postId ? updated : post))
    setBlogPosts((previous) => previous.map((post) => post.id === postId ? updated : post))
  }, [])

  const removeBlogPost = useCallback(async (postId: string) => {
    await forumService.deleteArticle(postId)
    setSourceBlogPosts((previous) => previous.filter((post) => post.id !== postId))
    setBlogPosts((previous) => previous.filter((post) => post.id !== postId))
    setCommentsByPost((previous) => {
      const next = { ...previous }
      delete next[postId]
      return next
    })
    setSourceCommentsByPost((previous) => {
      const next = { ...previous }
      delete next[postId]
      return next
    })
  }, [])

  const getComments = useCallback(
    (postId: string) => commentsByPost[postId] ?? [],
    [commentsByPost],
  )

  const addComment = useCallback(async (postId: string, input: CommentInput) => {
    const comment = await forumService.createComment(postId, input)
    setSourceCommentsByPost((previous) => ({
      ...previous,
      [postId]: [...(previous[postId] ?? []), comment],
    }))
    setCommentsByPost((previous) => ({
      ...previous,
      [postId]: [...(previous[postId] ?? []), comment],
    }))
    setSourceBlogPosts((previous) => previous.map((post) =>
      post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post,
    ))
    setBlogPosts((previous) => previous.map((post) =>
      post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post,
    ))
  }, [])

  const loadComments = useCallback(async (postId: string) => {
    const page = await forumService.getComments(postId)
    setSourceCommentsByPost((previous) => ({ ...previous, [postId]: page.content }))
    setCommentsByPost((previous) => ({ ...previous, [postId]: page.content }))
  }, [])

  const removeComment = useCallback(async (postId: string, commentId: string) => {
    await forumService.deleteComment(postId, commentId)
    const dropComment = (comments: BlogComment[]) => comments.filter((comment) => comment.id !== commentId)
    setSourceCommentsByPost((previous) => ({ ...previous, [postId]: dropComment(previous[postId] ?? []) }))
    setCommentsByPost((previous) => ({ ...previous, [postId]: dropComment(previous[postId] ?? []) }))
    const dropCount = (postsList: BlogPost[]) => postsList.map((post) =>
      post.id === postId ? { ...post, commentCount: Math.max(0, post.commentCount - 1) } : post,
    )
    setSourceBlogPosts(dropCount)
    setBlogPosts(dropCount)
  }, [])

  const loadArticle = useCallback(async (postId: string) => {
    const article = await forumService.getArticle(postId)
    setSourceBlogPosts((previous) => {
      const exists = previous.some((post) => post.id === postId)
      return exists ? previous.map((post) => post.id === postId ? article : post) : [article, ...previous]
    })
    setBlogPosts((previous) => {
      const exists = previous.some((post) => post.id === postId)
      return exists ? previous.map((post) => post.id === postId ? article : post) : [article, ...previous]
    })
  }, [])

  const isLiked = useCallback((postId: string) => likesByPost[postId] ?? false, [likesByPost])

  const getLikeCount = useCallback(
    (postId: string) => blogPosts.find((post) => post.id === postId)?.likeCount ?? 0,
    [blogPosts],
  )

  const getCommentCount = useCallback(
    (postId: string) => blogPosts.find((post) => post.id === postId)?.commentCount ?? 0,
    [blogPosts],
  )

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const result = await forumService.toggleLike(postId)
      setLikesByPost((previous) => ({ ...previous, [postId]: result.liked }))
      setSourceBlogPosts((previous) => previous.map((post) =>
        post.id === postId ? { ...post, likeCount: result.totalLikes, reacted: result.liked } : post,
      ))
      setBlogPosts((previous) => previous.map((post) =>
        post.id === postId ? { ...post, likeCount: result.totalLikes, reacted: result.liked } : post,
      ))
    } catch {
      setError('No se pudo actualizar la reacción')
    }
  }, [])

  return {
    communityPosts,
    addCommunityPost,
    blogPosts,
    addBlogPost,
    updateBlogPost,
    removeBlogPost,
    getComments,
    addComment,
    loadComments,
    removeComment,
    loadArticle,
    isLiked,
    getLikeCount,
    getCommentCount,
    toggleLike,
    toggleCommunityLike,
    isLoading,
    error,
  }
}

export default useForumFeed
