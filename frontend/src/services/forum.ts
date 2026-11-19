import { apiClient } from './api.ts'
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
import { translateBatch } from './translation.ts'

/** Community post as the backend sends it: the likes come as `reactionCount`. */
type ForumCommunityPostResponse = Omit<CommunityPost, 'likeCount' | 'reacted' | 'commentCount'> & {
  reactionCount?: number
  likeCount?: number
  reacted?: boolean
  commentCount?: number
}

/**
 * @param article - article as the backend sends it
 * @returns the article as the pages use it
 */
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

/**
 * @param input - the article's fields and its image
 * @returns the multipart body the backend expects: the fields as JSON in `article` and the image
 */
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

/**
 * Forum: the school's articles, their comments and likes, and the families' community posts
 * (`/api/forum`).
 */
export const forumService = {
  /**
   * @param page - page number, starting at 0
   * @param size - articles per page
   * @returns one page of articles, newest first
   */
  async getArticles(page = 0, size = 10): Promise<ForumArticlePage> {
    const response = await apiClient.get<ForumArticlePage & { content: ForumArticleResponse[] }>(
      '/forum/articles',
      {
      params: { page, size },
      },
    )
    return { ...response.data, content: response.data.content.map(mapArticle) }
  },

  /**
   * @param page - page number, starting at 0
   * @param size - articles per page
   * @returns one page of the signed-in teacher's articles
   */
  async getMyArticles(page = 0, size = 10): Promise<ForumArticlePage> {
    const response = await apiClient.get<ForumArticlePage & { content: ForumArticleResponse[] }>(
      '/forum/articles/mine',
      { params: { page, size } },
    )
    return { ...response.data, content: response.data.content.map(mapArticle) }
  },

  /**
   * @param id - article's ID
   * @returns the article
   */
  async getArticle(id: string): Promise<BlogPost> {
    const response = await apiClient.get<ForumArticleResponse>(`/forum/articles/${id}`)
    return mapArticle(response.data)
  },

  /**
   * @param input - the article's fields and image
   * @returns the created article, with its AI summary
   */
  async createArticle(input: BlogPostInput): Promise<BlogPost> {
    const response = await apiClient.post<ForumArticleResponse>(
      '/forum/articles',
      toArticleFormData(input),
    )
    return mapArticle(response.data)
  },

  /**
   * @param id - article's ID
   * @param input - new fields and image
   * @returns the updated article
   */
  async updateArticle(id: string, input: BlogPostInput): Promise<BlogPost> {
    const response = await apiClient.put<ForumArticleResponse>(
      `/forum/articles/${id}`,
      toArticleFormData(input),
    )
    return mapArticle(response.data)
  },

  /** @param id - ID of the article to delete */
  async deleteArticle(id: string): Promise<void> {
    await apiClient.delete(`/forum/articles/${id}`)
  },

  /**
   * Likes an article, or removes the like if the visitor already gave it.
   *
   * @param id - article's ID
   * @returns whether it is liked now and its total of likes
   */
  async toggleLike(id: string): Promise<ForumArticleLikeResponse> {
    const response = await apiClient.post<ForumArticleLikeResponse>(
      `/forum/articles/likes/${id}`,
    )
    return response.data
  },

  /** @returns the IDs of the articles this visitor likes */
  async getMyLikes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/forum/articles/likes/mine')
    return response.data
  },

  /**
   * @param id - article's ID
   * @param page - page number, starting at 0
   * @param size - comments per page
   * @returns one page of its comments
   */
  async getComments(id: string, page = 0, size = 10): Promise<ForumCommentPage> {
    const response = await apiClient.get<ForumCommentPage>(
      `/forum/articles/${id}/comments`,
      { params: { page, size } },
    )
    return response.data
  },

  /**
   * The comment goes through the moderation before it is published.
   *
   * @param id - article's ID
   * @param input - alias and text
   * @returns the created comment
   */
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

  /**
   * @param articleId - article's ID
   * @param commentId - ID of the comment to delete
   */
  async deleteComment(articleId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/forum/articles/${articleId}/comments/${commentId}`)
  },

  /**
   * @param page - page number, starting at 0
   * @param size - posts per page
   * @returns one page of community posts
   */
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

  /**
   * The post goes through the moderation before it is published.
   *
   * @param input - name and text
   * @returns the created post
   */
  async createCommunityPost(input: Pick<CommunityPost, 'name' | 'content'>): Promise<CommunityPost> {
    const response = await apiClient.post<CommunityPost>('/forum/community', input)
    return response.data
  },

  /**
   * @param id - post's ID
   * @returns whether it is liked now and its total of likes
   */
  async toggleCommunityLike(id: string): Promise<{ communityPostId: string; totalLikes: number; liked: boolean }> {
    const response = await apiClient.post(`/forum/posts/likes/${id}`)
    return response.data
  },
  /** @returns the IDs of the community posts this visitor likes */
  async getMyCommunityLikes(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/forum/posts/likes/mine')
    return response.data
  },
  /**
   * @param id - post's ID
   * @returns its first 50 comments
   */
  async getCommunityComments(id: string): Promise<CommunityComment[]> {
    const response = await apiClient.get<{ content: CommunityComment[] }>(`/forum/community/${id}/comments`, { params: { size: 50 } })
    return response.data.content
  },
  /**
   * @param id - post's ID
   * @param input - alias and text
   * @returns the created comment
   */
  async createCommunityComment(id: string, input: Pick<CommunityComment, 'alias' | 'content'>): Promise<CommunityComment> {
    const response = await apiClient.post<CommunityComment>(`/forum/community/${id}/comments`, input)
    return response.data
  },
  /**
   * @param postId - post's ID
   * @param commentId - ID of the comment to delete
   */
  async deleteCommunityComment(postId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/forum/community/${postId}/comments/${commentId}`)
  },
  /** @param postId - ID of the post to delete */
  async deleteCommunityPost(postId: string): Promise<void> {
    await apiClient.delete(`/forum/community/${postId}`)
  },

  translateBatch,
}
