export interface CommunityPost {
  id: string
  name: string
  createdAt: string
  content: string
}

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
}

export interface BlogComment {
  id: string
  name: string
  createdAt: string
  content: string
}

export interface BlogPostInput {
  title: string
  topic: string
  authorName: string
  authorRole: string
  content: string
  imageUrl?: string
  imageAlt?: string
}
