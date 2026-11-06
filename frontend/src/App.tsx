import { Fragment, lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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

// Cada página se descarga solo cuando se visita; la portada va en el bundle principal.
const BookingPage = lazy(() => import('./pages/BookingPage.tsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.tsx'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.tsx'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.tsx'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.tsx'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.tsx'))
const AdminCitasPage = lazy(() => import('./pages/AdminCitasPage.tsx'))
const AdminTeachersPage = lazy(() => import('./pages/AdminTeachersPage.tsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'))
const NewsPage = lazy(() => import('./pages/NewsPage.tsx'))
const ForumPage = lazy(() => import('./pages/ForumPage.tsx'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.tsx'))
const CommunityPostPage = lazy(() => import('./pages/CommunityPostPage.tsx'))
const AdminForumPage = lazy(() => import('./pages/AdminForumPage.tsx'))
const AnnouncementsPage = lazy(() => import('./pages/AdminAnnouncementsPage.tsx'))
const AdminExpedientsPage = lazy(() => import('./pages/AdminExpedientsPage.tsx'))
const AdminParentsPage = lazy(() => import('./pages/AdminParentPage.tsx'))
const AdminChildrenPage = lazy(() => import('./pages/AdminChildrenPage.tsx'))
const AdminEvaluationsPage = lazy(() => import('./pages/AdminEvaluationsPage.tsx'))
const GalleryPage = lazy(() => import('./pages/GalleryPage.tsx'))
const AlbumDetailPage = lazy(() => import('./pages/AlbumDetailPage.tsx'))
const AdminGalleryPage = lazy(() => import('./pages/AdminGalleryPage.tsx'))
const AdminCurriculumsPage = lazy(() => import('./pages/AdminCurriculumsPage.tsx'))
const VacanciesPage = lazy(() => import('./pages/VacanciesPage.tsx'))
const OwnerAvailabilityPage = lazy(() => import('./pages/OwnerAvailabilityPage.tsx'))
const OwnerNewsletter = lazy(() => import('./pages/OwnerNewsletter.tsx'))
const OwnerClubsPage = lazy(() => import('./pages/OwnerClubsPage.tsx'))
const ClubsPage = lazy(() => import('./pages/ClubsPage.tsx'))
const AboutUsPage = lazy(() => import('./pages/AboutUsPage.tsx'))
const AdminGroupsPage = lazy(() => import('./pages/AdminGroupsPage.tsx'))
const GreenHeartsPage = lazy(() => import('./pages/GreenHeartsPage.tsx'))

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

function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <BrowserRouter>
          <VoiceReaderProvider>
            <Toaster position="top-right" offset={{ top: 76 }} />
            <SessionWatcher />
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
                        <Route path="/admin/citas" element={<AdminCitasPage />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/teachers" element={<AdminTeachersPage />} />
                        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
                        <Route path="/admin/gallery" element={<AdminGalleryPage />} />
                        <Route path="/admin/curriculums" element={<AdminCurriculumsPage />} />
                        <Route path="/admin/clubs" element={<OwnerClubsPage />} />
                        <Route path="/admin/parents" element={<AdminParentsPage />} />
                        <Route path="/admin/children" element={<AdminChildrenPage />} />
                        <Route element={<OwnerRoute />}>
                          <Route path="/admin/disponibilidad" element={<OwnerAvailabilityPage />} />
                          <Route path="/admin/newsletter" element={<OwnerNewsletter />} />
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
                      <Route path="/albumes/:id" element={<AlbumDetailPage />} />
                      <Route path="/vacantes" element={<VacanciesPage />} />
                      <Route path="/clubs" element={<ClubsPage />} />
                      <Route path="/about-us" element={<AboutUsPage />} />
                      <Route path="/green-hearts" element={<GreenHeartsPage />} />
                      <Route path="/signup" element={<Navigate to="/admin/users" replace />} />
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
