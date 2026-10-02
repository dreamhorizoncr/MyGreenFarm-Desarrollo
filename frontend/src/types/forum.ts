export interface CommunityPost {
  id: string
  name: string
  createdAt: string
  content: string
  likeCount: number
  reacted: boolean
  commentCount: number
}

export interface CommunityComment { id: string; communityPostId: string; alias: string; content: string; createdAt: string }

export interface BlogPost {
  id: string
  title: string
  topic: string
  authorName: string
  authorRole: string
  authorAvatarUrl?: string
  createdAt: string
  content: string
  imageUrl?: string
  imageAlt?: string
  likeCount: number
  reacted: boolean
  commentCount: number
}

export interface BlogComment {
  id: string
  articleId: string
  alias: string
  createdAt: string
  content: string
}

export interface BlogPostInput {
  title: string
  topic: string
  content: string
  authorName?: string
  authorRole?: string
  imageUrl?: string
  imageAlt?: string
  imageFile?: File
  removeImage?: boolean
}

export interface ForumArticleLikeResponse {
  articleId: string
  totalLikes: number
  liked: boolean
}

export interface ForumArticleResponse {
  id: string
  title: string
  topic: string
  authorName: string
  authorRole: string
  content: string
  imageUrl?: string
  imageAlt?: string
  createdAt: string
  updatedAt: string
  reactionCount: number
  reacted: boolean
  commentCount: number
}

export interface ForumArticlePage {
  content: BlogPost[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export interface ForumCommentPage {
  content: BlogComment[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}

export interface ForumCommunityPage {
  content: CommunityPost[]
  totalPages: number
  totalElements: number
  number: number
  size: number
}
