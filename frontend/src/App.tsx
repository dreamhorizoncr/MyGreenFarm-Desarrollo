import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sileo'

import HomePage from './pages/HomePage.tsx'
import BookingPage from './pages/BookingPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import SignUpPage from './pages/SignUpPage.tsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx'
import ResetPasswordPage from './pages/ResetPasswordPage.tsx'
import AdminUsersPage from './pages/AdminUsersPage.tsx'
import AdminDashboardPage from './pages/AdminDashboardPage.tsx'
import AdminCitasPage from './pages/AdminCitasPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import ProtectedRoute from './routes/ProtectedRoute.tsx'
import AdminRoute from './routes/AdminRoute.tsx'
import OwnerRoute from './routes/OwnerRoute.tsx'
import ForumManagementRoute from './routes/ForumManagementRoute.tsx'
import ExpedientsRoute from './routes/ExpedientsRoute.tsx'
import NewsPage from './pages/NewsPage.tsx'
import ForumPage from './pages/ForumPage.tsx'
import BlogPostPage from './pages/BlogPostPage.tsx'
import CommunityPostPage from './pages/CommunityPostPage.tsx'
import AdminForumPage from './pages/AdminForumPage.tsx'
import AnnouncementsPage from './pages/AnnouncementsPage.tsx'
import AdminExpedientsPage from './pages/AdminExpedientsPage.tsx'
import AdminParentsPage from './pages/AdminParentPage.tsx'
import AdminChildrenPage from './pages/AdminChildrenPage.tsx'
import AdminEvaluationsPage from './pages/AdminEvaluationsPage.tsx'
import GalleryPage from './pages/GalleryPage.tsx'
import AlbumDetailPage from './pages/AlbumDetailPage.tsx'
import AdminGalleryPage from './pages/AdminGalleryPage.tsx'
import ServicesPage from './pages/ServicesPage.tsx'
import AdminServicePlansPage from './pages/AdminServicePlansPage.tsx'
import PaymentSuccessPage from './pages/PaymentSuccessPage.tsx'
import PaymentFailedPage from './pages/PaymentFailedPage.tsx'
import AdminCurriculumsPage from './pages/AdminCurriculumsPage.tsx'
import VacanciesPage from './pages/VacanciesPage.tsx'
import OwnerAvailabilityPage from './pages/OwnerAvailabilityPage.tsx'
import OwnerNewsletter from './pages/OwnerNewsletter.tsx'
import Footer from './layout/Footer.tsx'
import ScrollToTopButton from './components/ScrollToTopButton.tsx'
import { ProfileAvatarProvider } from './contexts/ProfileAvatarContext.tsx'
import { ForumFeedProvider } from './contexts/ForumFeedContext.tsx'
import { useSessionExpiredNotice } from './hooks/useSessionExpiredNotice.ts'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import BlobGooFilter from './components/ui/BlobGooFilter.tsx'
import OwnerClubsPage from './pages/OwnerClubsPage.tsx'
import ClubsPage from './pages/ClubsPage.tsx'

function SessionWatcher() {
  useSessionExpiredNotice()
  return null
}

function isDashboardPath(pathname: string) {
  return pathname === '/profile' || pathname.startsWith('/admin')
}

function GlobalFooter() {
  const { pathname } = useLocation()
  if (isDashboardPath(pathname)) return null
  return <Footer />
}

function App() {
  return (
  <ErrorBoundary>
    <BrowserRouter>
      <Toaster position="top-right" offset={{ top: 76 }} />
      <SessionWatcher />
      <BlobGooFilter />
      <div className="flex min-h-svh flex-col">
        <div className="flex-1">
          <ProfileAvatarProvider>
            <ForumFeedProvider>
            <Routes>
          <Route element={<ProtectedRoute />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route element={<ForumManagementRoute />}>
            <Route path="/admin/forum" element={<AdminForumPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin/citas" element={<AdminCitasPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/announcements" element={<AnnouncementsPage />} />
            <Route path="/admin/gallery" element={<AdminGalleryPage />} />
            <Route path="/admin/curriculums" element={<AdminCurriculumsPage />} />
            <Route path="/admin/clubs" element={<OwnerClubsPage />} />
            <Route path="/admin/parents" element={<AdminParentsPage />} />
            <Route path="/admin/children" element={<AdminChildrenPage />} />
            <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
          <Route element={<OwnerRoute />}>
            <Route path="/admin/service-plans" element={<AdminServicePlansPage />} />
            <Route path="/admin/disponibilidad" element={<OwnerAvailabilityPage />} />
            <Route path="/admin/newsletter" element={<OwnerNewsletter />} />
          </Route>
        </Route>
        <Route element={<ExpedientsRoute />}>
          <Route path="/admin/expedients" element={<AdminExpedientsPage />} />
        </Route>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/blog/:id" element={<BlogPostPage />} />
        <Route path="/forum/community/:id" element={<CommunityPostPage />} />
        <Route path="/multimedia" element={<GalleryPage />} />
        <Route path="/albumes/:id" element={<AlbumDetailPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-failed" element={<PaymentFailedPage />} />
        <Route path="/vacantes" element={<VacanciesPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        {/* <Route path="/news/:id" element={<NewsDetailPage />} /> */}
        {/* Redirigir cualquier ruta no definida a la página de inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </ForumFeedProvider>
          </ProfileAvatarProvider>
        </div>
        <GlobalFooter />
        <ScrollToTopButton />
      </div>
    </BrowserRouter>
  </ErrorBoundary>
  )
}

export default App
