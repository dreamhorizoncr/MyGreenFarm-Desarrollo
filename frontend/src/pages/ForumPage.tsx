import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon } from '@animateicons/react/lucide'
import Navbar from '../components/Navbar.tsx'
import Container from '../components/home/Container.tsx'
import BlogPostCard from '../components/forum/BlogPostCard.tsx'
import CommunityPostCard from '../components/forum/CommunityPostCard.tsx'
import ForumSidebar from '../components/forum/ForumSidebar.tsx'
import ForumTabs from '../components/forum/ForumTabs.tsx'
import type { ForumTab } from '../components/forum/ForumTabs.tsx'
import PublishExperienceModal from '../components/forum/PublishExperienceModal.tsx'
import PublishButtonCard from '../components/forum/PublishButtonCard.tsx'
import { useForumFeedContext } from '../contexts/ForumFeedContext.tsx'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'

function ForumPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    communityPosts,
    addCommunityPost,
    blogPosts,
    getCommentCount,
    isLoading,
    error,
    isLiked,
    getLikeCount,
    toggleLike,
    toggleCommunityLike,
  } = useForumFeedContext()

  const activeTab: ForumTab =
    searchParams.get('tab') === 'community' ? 'community' : 'blog'
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [blogSearch, setBlogSearch] = useState('')
  const normalizeSearchText = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()

  const filteredBlogPosts = useMemo(() => {
    const query = normalizeSearchText(blogSearch.trim())
    if (!query) return blogPosts

    return blogPosts.filter((post) =>
      normalizeSearchText(
        [post.title, post.topic, post.authorName, post.authorRole, post.content].join(' '),
      ).includes(query),
    )
  }, [blogPosts, blogSearch])

  function handleTabChange(tab: ForumTab) {
    setSearchParams(tab === 'community' ? { tab } : {})
  }

  const blogSkeletonCount = useSkeletonCount('forum-blog', isLoading, filteredBlogPosts.length, 3)

  const communitySkeletonCount = useSkeletonCount('forum-community', isLoading, communityPosts.length, 3)

  return (
    <div id="forum-page" className="min-h-screen bg-bg-page">
      <Navbar />

      <section data-scroll-bg="green" className="flex min-h-[280px] items-start bg-green-500 px-[30px] pt-[48px] pb-[40px] text-center text-white md:min-h-[320px] md:pt-[72px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-page-title font-bold leading-tight text-white md:text-h1">
            {t('forum.title')}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-body-sm leading-[1.6] text-white md:text-body-sm">
            {t('forum.subtitle')}
          </p>

          <ForumTabs activeTab={activeTab} onChange={handleTabChange} />
        </div>
      </section>

      <main>
        <Container className="py-10 md:py-12">
          <div className="grid grid-cols-1 items-start gap-md lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-xl">
            {activeTab === 'blog' && (
              <div className="lg:contents">
                <label className="flex h-12 items-center gap-sm rounded-xl border border-neutral-200 bg-white px-md text-neutral-500 focus-within:border-heading lg:hidden">
                  <SearchIcon size={20} aria-hidden="true" />
                  <input
                    type="search"
                    value={blogSearch}
                    onChange={(event) => setBlogSearch(event.target.value)}
                    placeholder={t('forum.blog.searchPlaceholder')}
                    aria-label={t('forum.blog.searchLabel')}
                    className="h-full min-w-0 flex-1 bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
                  />
                </label>
                <nav aria-label={t('forum.sidebarLabel')} className="mt-sm flex gap-xs lg:hidden">
                  <a href="#forum-about" className="min-w-0 flex-1 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-1 py-2xs text-center font-body text-[10px] font-semibold text-neutral-500 transition-colors sm:px-sm sm:text-caption">
                    {t('forum.about.title')}
                  </a>
                  <a href="#forum-latest" className="min-w-0 flex-1 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-1 py-2xs text-center font-body text-[10px] font-semibold text-neutral-500 transition-colors sm:px-sm sm:text-caption">
                    {t('forum.latest.title')}
                  </a>
                  <a href="#forum-popular" className="min-w-0 flex-1 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-1 py-2xs text-center font-body text-[10px] font-semibold text-neutral-500 transition-colors sm:px-sm sm:text-caption">
                    {t('forum.popular.title')}
                  </a>
                </nav>
              </div>
            )}
            {activeTab === 'community' && (
              <div className="lg:hidden">
                <PublishButtonCard onPublish={() => setIsPublishOpen(true)} />
              </div>
            )}
            {activeTab === 'blog' ? (
              <section
                id="forum-feed"
                aria-label={t('forum.blog.label')}
                className="flex scroll-mt-24 flex-col gap-md"
              >
                {isLoading && (
                  <SkeletonList count={blogSkeletonCount}>{() => <BlogPostCard loading />}</SkeletonList>
                )}

                {!isLoading && error && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-danger">
                    {error}
                  </p>
                )}

                {!isLoading && !error && blogPosts.length === 0 && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-neutral-500">
                    {t('forum.blog.empty')}
                  </p>
                )}

                {!isLoading && blogPosts.length > 0 && filteredBlogPosts.length === 0 && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-neutral-500">
                    {t('forum.blog.noSearchResults')}
                  </p>
                )}

                {!isLoading && filteredBlogPosts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    commentCount={getCommentCount(post.id)}
                    isLiked={isLiked(post.id)}
                    likeCount={getLikeCount(post.id)}
                    onToggleLike={toggleLike}
                    onOpen={(postId) => navigate(`/forum/blog/${postId}`)}
                    onOpenComments={(postId) => navigate(`/forum/blog/${postId}#comments`)}
                  />
                ))}
              </section>
            ) : (
              <section
                id="forum-feed"
                aria-label={t('forum.community.label')}
                className="flex scroll-mt-24 flex-col gap-md"
              >
                {isLoading && (
                  <SkeletonList count={communitySkeletonCount}>{() => <CommunityPostCard loading />}</SkeletonList>
                )}

                {!isLoading && error && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-danger">
                    {error}
                  </p>
                )}

                {!isLoading && !error && communityPosts.length === 0 && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-neutral-500">
                    {t('forum.community.empty')}
                  </p>
                )}

                {!isLoading && communityPosts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    onToggleLike={toggleCommunityLike}
                    onOpenComments={(postId) => navigate(`/forum/community/${postId}`)}
                  />
                ))}
              </section>
            )}

            <ForumSidebar
              showPublish={activeTab === 'community'}
              onPublish={() => setIsPublishOpen(true)}
              showBlogSearch={activeTab === 'blog'}
              blogSearch={blogSearch}
              onBlogSearchChange={setBlogSearch}
              blogPosts={blogPosts}
              onOpenPost={(postId) => navigate(`/forum/blog/${postId}`)}
              showPopularTopics={activeTab === 'blog'}
            />
          </div>
        </Container>
      </main>

      {isPublishOpen && (
        <PublishExperienceModal
          onClose={() => setIsPublishOpen(false)}
          onPublish={addCommunityPost}
        />
      )}
    </div>
  )
}

export default ForumPage
