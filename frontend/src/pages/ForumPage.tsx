import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar.tsx'
import BlogPostCard from '../components/forum/BlogPostCard.tsx'
import CommunityPostCard from '../components/forum/CommunityPostCard.tsx'
import ForumSidebar from '../components/forum/ForumSidebar.tsx'
import ForumTabs from '../components/forum/ForumTabs.tsx'
import type { ForumTab } from '../components/forum/ForumTabs.tsx'
import PublishExperienceModal from '../components/forum/PublishExperienceModal.tsx'
import { useForumFeedContext } from '../contexts/ForumFeedContext.tsx'

function ForumPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    communityPosts,
    addCommunityPost,
    blogPosts,
    getComments,
    isLiked,
    getLikeCount,
    toggleLike,
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

  return (
    <div id="forum-page" className="min-h-screen bg-bg-page">
      <Navbar />

      <section className="flex min-h-[280px] items-center bg-green-500 px-[30px] py-[40px] text-center text-white xs:min-h-[320px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-white md:text-[46px]">
            {t('forum.title')}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-[13px] leading-[1.6] text-white md:text-[15px]">
            {t('forum.subtitle')}
          </p>

          <ForumTabs activeTab={activeTab} onChange={handleTabChange} />
        </div>
      </section>

      <main>
        <div className="mx-auto w-full max-w-[1120px] px-[14px] py-10 xs:px-[20px] xs:py-12">
          <div className="grid grid-cols-1 items-start gap-md lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-xl">
            {activeTab === 'blog' ? (
              <section
                id="forum-feed"
                aria-label={t('forum.blog.label')}
                className="flex scroll-mt-24 flex-col gap-md"
              >
                {blogPosts.length === 0 && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-neutral-500">
                    {t('forum.blog.empty')}
                  </p>
                )}

                {blogPosts.length > 0 && filteredBlogPosts.length === 0 && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-neutral-500">
                    {t('forum.blog.noSearchResults')}
                  </p>
                )}

                {filteredBlogPosts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    commentCount={getComments(post.id).length}
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
                {communityPosts.length === 0 && (
                  <p className="m-0 rounded-2xl border border-neutral-200 bg-white p-lg font-body text-body-sm text-neutral-500">
                    {t('forum.community.empty')}
                  </p>
                )}

                {communityPosts.map((post) => (
                  <CommunityPostCard key={post.id} post={post} />
                ))}
              </section>
            )}

            <ForumSidebar
              onGoToCommunity={() => handleTabChange('community')}
              showPublish={activeTab === 'community'}
              onPublish={() => setIsPublishOpen(true)}
              showBlogSearch={activeTab === 'blog'}
              blogSearch={blogSearch}
              onBlogSearchChange={setBlogSearch}
            />
          </div>
        </div>
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
