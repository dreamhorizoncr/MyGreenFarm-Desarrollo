import { useCallback, useState } from 'react'
import {
  blogCommentsByPost as seedComments,
  blogPosts as seedBlogPosts,
  communityPosts as seedCommunityPosts,
} from '../components/forum/forumData.ts'
import type { BlogComment, BlogPost, CommunityPost } from '../types/forum.ts'

interface NameContentInput {
  name: string
  content: string
}

function useForumFeed() {
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(
    seedCommunityPosts,
  )
  const [blogPosts] = useState<BlogPost[]>(seedBlogPosts)
  const [commentsByPost, setCommentsByPost] = useState<
    Record<string, BlogComment[]>
  >(seedComments)
  const [likesByPost, setLikesByPost] = useState<Record<string, boolean>>({})

  const addCommunityPost = useCallback((input: NameContentInput) => {
    const post: CommunityPost = {
      id: `community-${Date.now()}`,
      name: input.name,
      createdAt: new Date().toISOString(),
      content: input.content,
    }

    setCommunityPosts((previous) => [post, ...previous])
  }, [])

  const getComments = useCallback(
    (postId: string) => commentsByPost[postId] ?? [],
    [commentsByPost],
  )

  const addComment = useCallback(
    (postId: string, input: NameContentInput) => {
      const comment: BlogComment = {
        id: `comment-${postId}-${Date.now()}`,
        name: input.name,
        createdAt: new Date().toISOString(),
        content: input.content,
      }

      setCommentsByPost((previous) => ({
        ...previous,
        [postId]: [...(previous[postId] ?? []), comment],
      }))
    },
    [],
  )

  const isLiked = useCallback(
    (postId: string) => likesByPost[postId] ?? false,
    [likesByPost],
  )

  const getLikeCount = useCallback(
    (postId: string) => {
      const base = seedBlogPosts.find((post) => post.id === postId)?.likeCount ?? 0

      return isLiked(postId) ? base + 1 : base
    },
    [isLiked],
  )

  const toggleLike = useCallback((postId: string) => {
    setLikesByPost((previous) => ({ ...previous, [postId]: !previous[postId] }))
  }, [])

  return {
    communityPosts,
    addCommunityPost,
    blogPosts,
    getComments,
    addComment,
    isLiked,
    getLikeCount,
    toggleLike,
  }
}

export default useForumFeed
