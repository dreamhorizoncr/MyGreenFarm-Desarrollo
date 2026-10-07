import { apiClient } from './api.ts'
import type { TranslationItem } from './announcement.ts'
import type {
  BlogComment,
  BlogPost,
  BlogPostInput,
  ForumArticleResponse,
  ForumArticleLikeResponse,
  ForumArticlePage,
  ForumCommentPage,
  ForumCommunityPage,
  CommunityPost,
  CommunityComment,
} from '../types/forum.ts'

type ForumCommunityPostResponse = Omit<CommunityPost, 'likeCount' | 'reacted' | 'commentCount'> & {
  reactionCount?: number
  likeCount?: number
  reacted?: boolean
  commentCount?: number
}

function mapArticle(article: ForumArticleResponse): BlogPost {
  return {
    id: article.id,
    title: article.title,
    topic: article.topic,
    authorName: article.authorName,
    authorRole: article.authorRole,
    content: article.content,
    imageUrl: article.imageUrl,
    imageAlt: article.imageAlt,
    aiSummary: article.aiSummary,
    createdAt: article.createdAt,
    likeCount: article.reactionCount,
    reacted: article.reacted,
    commentCount: article.commentCount,
  }
}

function toArticleFormData(input: BlogPostInput): FormData {
  const formData = new FormData()
  formData.append(
    'article',
    new Blob(
      [
        JSON.stringify({
          title: input.title,
          topic: input.topic,
          content: input.content,
          authorName: input.authorName,
          authorRole: input.authorRole,
          imageAlt: input.imageAlt,
          removeImage: input.removeImage ?? false,
        }),
      ],
      { type: 'application/json' },
    ),
  )

  if (input.imageFile) formData.append('image', input.imageFile)
  return formData
}

export const forumService = {
  async getArticles(page = 0, size = 10): Promise<ForumArticlePage> {
    const response = await apiClient.get<ForumArticlePage & { content: ForumArticleResponse[] }>(
      '/forum/articles',
      {
      params: { page, size },
      },
    )
    return { ...response.data, content: response.data.content.map(mapArticle) }
  },

  async getMyArticles(page = 0, size = 10): Promise<ForumArticlePage> {
    const response = await apiClient.get<ForumArticlePage & { content: ForumArticleResponse[] }>(
      '/forum/articles/mine',
      { params: { page, size } },
    )
    return { ...response.data, content: response.data.content.map(mapArticle) }
  },

  async getArticle(id: string): Promise<BlogPost> {
    const response = await apiClient.get<ForumArticleResponse>(`/forum/articles/${id}`)
    return mapArticle(response.data)
  },

  async createArticle(input: BlogPostInput): Promise<BlogPost> {
    const response = await apiClient.post<ForumArticleResponse>(
      '/forum/articles',
      toArticleFormData(input),
    )
    return mapArticle(response.data)
  },

  async updateArticle(id: string, input: BlogPostInput): Promise<BlogPost> {
    const response = await apiClient.put<ForumArticleResponse>(
      `/forum/articles/${id}`,
      toArticleFormData(input),
    )
    return mapArticle(response.data)
  },

  async deleteArticle(id: string): Promise<void> {
    await apiClient.delete(`/forum/articles/${id}`)
  },

  async toggleLike(id: string): Promise<ForumArticleLikeResponse> {
    const response = await apiClient.post<ForumArticleLikeResponse>(
      `/forum/articles/likes/${id}`,
    )
    return response.data
  },

  async getMyLikes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/forum/articles/likes/mine')
    return response.data
  },

  async getComments(id: string, page = 0, size = 10): Promise<ForumCommentPage> {
    const response = await apiClient.get<ForumCommentPage>(
      `/forum/articles/${id}/comments`,
      { params: { page, size } },
    )
    return response.data
  },

  async createComment(
    id: string,
    input: Pick<BlogComment, 'alias' | 'content'>,
  ): Promise<BlogComment> {
    const response = await apiClient.post<BlogComment>(
      `/forum/articles/${id}/comments`,
      input,
    )
    return response.data
  },

  async deleteComment(articleId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/forum/articles/${articleId}/comments/${commentId}`)
  },

  async getCommunityPosts(page = 0, size = 10): Promise<ForumCommunityPage> {
    const response = await apiClient.get<Omit<ForumCommunityPage, 'content'> & { content: ForumCommunityPostResponse[] }>('/forum/community', {
      params: { page, size },
    })
    return { ...response.data, content: response.data.content.map((post) => ({
      ...post,
      likeCount: post.reactionCount ?? post.likeCount ?? 0,
      commentCount: post.commentCount ?? 0,
      reacted: false,
    })) }
  },

  async createCommunityPost(input: Pick<CommunityPost, 'name' | 'content'>): Promise<CommunityPost> {
    const response = await apiClient.post<CommunityPost>('/forum/community', input)
    return response.data
  },

  async toggleCommunityLike(id: string): Promise<{ communityPostId: string; totalLikes: number; liked: boolean }> {
    const response = await apiClient.post(`/forum/posts/likes/${id}`)
    return response.data
  },
  async getMyCommunityLikes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/forum/posts/likes/mine')
    return response.data
  },
  async getCommunityComments(id: string): Promise<CommunityComment[]> {
    const response = await apiClient.get<{ content: CommunityComment[] }>(`/forum/community/${id}/comments`, { params: { size: 50 } })
    return response.data.content
  },
  async createCommunityComment(id: string, input: Pick<CommunityComment, 'alias' | 'content'>): Promise<CommunityComment> {
    const response = await apiClient.post<CommunityComment>(`/forum/community/${id}/comments`, input)
    return response.data
  },

  async translateBatch(
    entityType: string,
    targetLanguage: string,
    items: TranslationItem[],
  ): Promise<Record<string, string>> {
    const response = await apiClient.post<Record<string, string>>('/translations/batch', {
      entityType,
      targetLanguage: targetLanguage.split('-')[0] || 'es',
      items,
    })
    return response.data
  },
}
