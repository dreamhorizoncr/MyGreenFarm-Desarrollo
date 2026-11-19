import type { PageResponse } from './page.ts'

/** Post of a family in the forum's community. */
export interface CommunityPost {
  id: string
  name: string
  createdAt: string
  content: string
  likeCount: number
  /** Whether this visitor likes it. */
  reacted: boolean
  commentCount: number
}

/** Comment of a community post. */
export interface CommunityComment {
  id: string
  communityPostId: string
  alias: string
  content: string
  createdAt: string
}

/** Article of the forum's blog, as the pages use it. */
export interface BlogPost {
  id: string
  title: string
  topic: string
  authorName?: string | null
  authorRole?: string | null
  authorAvatarUrl?: string
  createdAt: string
  content: string
  imageUrl?: string
  imageAlt?: string
  aiSummary?: string | null
  likeCount: number
  reacted: boolean
  commentCount: number
}

/** Comment of an article. */
export interface BlogComment {
  id: string
  articleId: string
  alias: string
  createdAt: string
  content: string
}

/** Data to create or update an article. */
export interface BlogPostInput {
  title: string
  topic: string
  content: string
  authorName?: string
  authorRole?: string
  imageUrl?: string
  imageAlt?: string
  imageFile?: File
  /** Whether to remove the current image. */
  removeImage?: boolean
}

/** Likes of an article after liking it or removing the like. */
export interface ForumArticleLikeResponse {
  articleId: string
  totalLikes: number
  liked: boolean
}

/** Article as the backend sends it; see {@link BlogPost}. */
export interface ForumArticleResponse {
  id: string
  title: string
  topic: string
  authorName?: string | null
  authorRole?: string | null
  content: string
  imageUrl?: string
  imageAlt?: string
  aiSummary?: string | null
  createdAt: string
  updatedAt: string
  reactionCount: number
  reacted: boolean
  commentCount: number
}

/** A page of articles. */
export type ForumArticlePage = PageResponse<BlogPost>

/** A page of comments of an article. */
export type ForumCommentPage = PageResponse<BlogComment>

/** A page of community posts. */
export type ForumCommunityPage = PageResponse<CommunityPost>
