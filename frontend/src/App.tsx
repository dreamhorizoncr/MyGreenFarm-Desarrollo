import { Fragment, lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { Toaster } from 'sileo'

import HomePage from './pages/HomePage.tsx'
import ProtectedRoute from './routes/ProtectedRoute.tsx'
import AdminRoute from './routes/AdminRoute.tsx'
import OwnerRoute from './routes/OwnerRoute.tsx'
import ForumManagementRoute from './routes/ForumManagementRoute.tsx'
import ExpedientsRoute from './routes/ExpedientsRoute.tsx'
import Footer from './layout/Footer.tsx'
import ScrollToTopButton from './components/ScrollToTopButton.tsx'
import { ProfileAvatarProvider } from './contexts/ProfileAvatarContext.tsx'
import { ForumFeedProvider } from './contexts/ForumFeedContext.tsx'
import { AccessibilityProvider } from '../src/contexts/AccessibilityContext.tsx'
import { useMotionKey } from './hooks/useMotionKey.ts'
import { VoiceReaderProvider } from './contexts/VoiceReaderContext.tsx'
import AccessibilityMenu from './components/ui/AccessibilityMenu.tsx'
import VoiceReaderController from './components/ui/VoiceReaderController.tsx'
import ReadingGuide from './components/ui/ReadingGuide.tsx'
import { useSessionExpiredNotice } from './hooks/useSessionExpiredNotice.ts'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import BlobGooFilter from './components/ui/BlobGooFilter.tsx'
import ChatWidget from './components/chat/ChatWidget.tsx'
import GroupsRoute from './routes/GroupsRoute.tsx'
import PageLoader from './components/ui/PageLoader.tsx'
import { userStorage } from './utils/userStorage.ts'

type PageModule = { default: ComponentType }
const publicPageLoaders: (() => Promise<PageModule>)[] = []
const privatePageLoaders: (() => Promise<PageModule>)[] = []

function lazyPage(loader: () => Promise<PageModule>, isPrivate = false) {
  ;(isPrivate ? privatePageLoaders : publicPageLoaders).push(loader)
  return lazy(loader)
}

const BookingPage = lazyPage(() => import('./pages/BookingPage.tsx'))
const LoginPage = lazyPage(() => import('./pages/LoginPage.tsx'))
const ForgotPasswordPage = lazyPage(() => import('./pages/ForgotPasswordPage.tsx'))
const ResetPasswordPage = lazyPage(() => import('./pages/ResetPasswordPage.tsx'))
const AdminUsersPage = lazyPage(() => import('./pages/AdminUsersPage.tsx'), true)
const AdminDashboardPage = lazyPage(() => import('./pages/AdminDashboardPage.tsx'), true)
const AdminAppointmentsPage = lazyPage(() => import('./pages/AdminAppointmentsPage.tsx'), true)
const ProfilePage = lazyPage(() => import('./pages/ProfilePage.tsx'), true)
const NewsPage = lazyPage(() => import('./pages/NewsPage.tsx'))
const ForumPage = lazyPage(() => import('./pages/ForumPage.tsx'))
const BlogPostPage = lazyPage(() => import('./pages/BlogPostPage.tsx'))
const CommunityPostPage = lazyPage(() => import('./pages/CommunityPostPage.tsx'))
const AdminForumPage = lazyPage(() => import('./pages/AdminForumPage.tsx'), true)
const AnnouncementsPage = lazyPage(() => import('./pages/AdminAnnouncementsPage.tsx'), true)
const AdminExpedientsPage = lazyPage(() => import('./pages/AdminExpedientsPage.tsx'), true)
const AdminParentsPage = lazyPage(() => import('./pages/AdminParentPage.tsx'), true)
const AdminChildrenPage = lazyPage(() => import('./pages/AdminChildrenPage.tsx'), true)
const AdminEvaluationsPage = lazyPage(() => import('./pages/AdminEvaluationsPage.tsx'), true)
const GalleryPage = lazyPage(() => import('./pages/GalleryPage.tsx'))
const AlbumDetailPage = lazyPage(() => import('./pages/AlbumDetailPage.tsx'))
const AdminGalleryPage = lazyPage(() => import('./pages/AdminGalleryPage.tsx'), true)
const AdminCurriculumsPage = lazyPage(() => import('./pages/AdminCurriculumsPage.tsx'), true)
const VacanciesPage = lazyPage(() => import('./pages/VacanciesPage.tsx'))
const OwnerAvailabilityPage = lazyPage(() => import('./pages/OwnerAvailabilityPage.tsx'), true)
const OwnerNewsletter = lazyPage(() => import('./pages/OwnerNewsletter.tsx'), true)
const OwnerClubsPage = lazyPage(() => import('./pages/OwnerClubsPage.tsx'), true)
const ClubsPage = lazyPage(() => import('./pages/ClubsPage.tsx'))
const AboutUsPage = lazyPage(() => import('./pages/AboutUsPage.tsx'))
const AdminGroupsPage = lazyPage(() => import('./pages/AdminGroupsPage.tsx'), true)
const GreenHeartsPage = lazyPage(() => import('./pages/GreenHeartsPage.tsx'))
const ServicesPage = lazyPage(() => import('./pages/ServicesPage.tsx'))
const AdminServicePlansPage = lazyPage(() => import('./pages/AdminServicePlansPage.tsx'), true)

function SessionWatcher() {
  useSessionExpiredNotice()
  return null
}

function isDashboardPath(pathname: string) {
  return pathname === '/profile' || pathname.startsWith('/admin')
}

function MotionBoundary({ children }: Readonly<{ children: ReactNode }>) {
  return <Fragment key={useMotionKey()}>{children}</Fragment>
}

function GlobalFooter() {
  const { pathname } = useLocation()
  if (isDashboardPath(pathname)) return null
  return <Footer />
}

function PagePreloader() {
  useEffect(() => {
    const loaders = [...publicPageLoaders, ...(userStorage.getUser() ? privatePageLoaders : [])]
    let cancelled = false
    let handle = 0
    const idle = (fn: () => void) =>
      typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(fn, { timeout: 2000 }) : window.setTimeout(fn, 300)
    const next = (index: number) => {
      if (cancelled || index >= loaders.length) return
      handle = idle(() => {
        loaders[index]()
          .catch(() => undefined)
          .finally(() => next(index + 1))
      })
    }
    next(0)
    return () => {
      cancelled = true
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [])
  return null
}

function LegacyAlbumRedirect() {
  const { id } = useParams()
  return <Navigate to={`/albums/${id ?? ''}`} replace />
}

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <BrowserRouter>
          <VoiceReaderProvider>
            <Toaster position="top-right" offset={{ top: 76 }} />
            <SessionWatcher />
            <PagePreloader />
            <BlobGooFilter />
            <div className="flex min-h-svh flex-col">
              <MotionBoundary>
              <div className="flex-1">
                <ProfileAvatarProvider>
                  <ForumFeedProvider>
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route element={<ProtectedRoute />}>
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                      </Route>
                      <Route element={<ForumManagementRoute />}>
                        <Route path="/admin/forum" element={<AdminForumPage />} />
                      </Route>
                      <Route element={<AdminRoute />}>
                        <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
                        <Route path="/admin/gallery" element={<AdminGalleryPage />} />
                        <Route path="/admin/curriculums" element={<AdminCurriculumsPage />} />
                        <Route path="/admin/clubs" element={<OwnerClubsPage />} />
                        <Route path="/admin/parents" element={<AdminParentsPage />} />
                        <Route path="/admin/children" element={<AdminChildrenPage />} />
                        <Route element={<OwnerRoute />}>
                          <Route path="/admin/availability" element={<OwnerAvailabilityPage />} />
                          <Route path="/admin/newsletter" element={<OwnerNewsletter />} />
                          <Route path="/admin/services" element={<AdminServicePlansPage />} />
                        </Route>
                      </Route>
                      <Route element={<GroupsRoute />}>
                        <Route path="/admin/groups" element={<AdminGroupsPage />} />
                      </Route>
                      <Route element={<ExpedientsRoute />}>
                        <Route path="/admin/expedients" element={<AdminExpedientsPage />} />
                        <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
                      </Route>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/booking" element={<BookingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password" element={<ResetPasswordPage />} />
                      <Route path="/news" element={<NewsPage />} />
                      <Route path="/forum" element={<ForumPage />} />
                      <Route path="/forum/blog/:id" element={<BlogPostPage />} />
                      <Route path="/forum/community/:id" element={<CommunityPostPage />} />
                      <Route path="/multimedia" element={<GalleryPage />} />
                      <Route path="/services" element={<ServicesPage />} />
                      <Route path="/albums/:id" element={<AlbumDetailPage />} />
                      <Route path="/vacancies" element={<VacanciesPage />} />
                      <Route path="/clubs" element={<ClubsPage />} />
                      <Route path="/about-us" element={<AboutUsPage />} />
                      <Route path="/green-hearts" element={<GreenHeartsPage />} />
                      <Route path="/signup" element={<Navigate to="/admin/users" replace />} />
                      <Route path="/vacantes" element={<Navigate to="/vacancies" replace />} />
                      <Route path="/albumes/:id" element={<LegacyAlbumRedirect />} />
                      <Route path="/admin/citas" element={<Navigate to="/admin/appointments" replace />} />
                      <Route path="/admin/disponibilidad" element={<Navigate to="/admin/availability" replace />} />
                      <Route path="/admin/teachers" element={<Navigate to="/admin/groups" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </Suspense>
                  </ForumFeedProvider>
                </ProfileAvatarProvider>
              </div>
              <GlobalFooter />
              <ScrollToTopButton />
              <ChatWidget />
              </MotionBoundary>
              <AccessibilityMenu />
              <VoiceReaderController />
              <ReadingGuide />
            </div>
          </VoiceReaderProvider>
        </BrowserRouter>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}

export default App
