import { Fragment, lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { Toaster } from 'sileo'

import HomePage from './pages/HomePage.tsx'
import ProtectedRoute from './routes/ProtectedRoute.tsx'
import RoleRoute from './routes/RoleRoute.tsx'
import Footer from './layout/Footer.tsx'
import ScrollToTopButton from './components/navigation/ScrollToTopButton.tsx'
import { ProfileAvatarProvider } from './contexts/ProfileAvatarContext.tsx'
import { ForumFeedLayout } from './contexts/ForumFeedContext.tsx'
import { AccessibilityProvider } from './contexts/AccessibilityContext.tsx'
import { useMotionKey } from './hooks/useMotionKey.ts'
import { VoiceReaderProvider } from './contexts/VoiceReaderContext.tsx'
import ReadingGuide from './components/ui/ReadingGuide.tsx'
import { useSessionExpiredNotice } from './hooks/useSessionExpiredNotice.ts'
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx'
import BlobGooFilter from './components/ui/BlobGooFilter.tsx'
import PageLoader from './components/ui/PageLoader.tsx'
import { userStorage } from './utils/userStorage.ts'
import { setRouteSEO } from './utils/seo.ts'

/** Module of a page loaded on demand. */
type PageModule = { default: ComponentType }
/** Loaders of the public pages, preloaded by {@link PagePreloader}. */
const publicPageLoaders: (() => Promise<PageModule>)[] = []
/** Loaders of the pages that need a session; preloaded only for signed-in users. */
const privatePageLoaders: (() => Promise<PageModule>)[] = []

/**
 * Loads a page on demand and registers it to preload it later.
 *
 * @param loader - imports the page
 * @param isPrivate - whether the page needs a session
 * @returns the lazy component
 */
function lazyPage(loader: () => Promise<PageModule>, isPrivate = false) {
  ;(isPrivate ? privatePageLoaders : publicPageLoaders).push(loader)
  return lazy(loader)
}

// Floating widgets: they are not needed for the first paint, so they load in their own chunk
// instead of slowing every page. Saved accessibility settings are applied by AccessibilityProvider.
const ChatWidget = lazy(() => import('./components/chat/ChatWidget.tsx'))
const AccessibilityMenu = lazy(() => import('./components/ui/AccessibilityMenu.tsx'))
const VoiceReaderController = lazy(() => import('./components/ui/VoiceReaderController.tsx'))

const BookingPage = lazyPage(() => import('./pages/BookingPage.tsx'))
const LoginPage = lazyPage(() => import('./pages/auth/LoginPage.tsx'))
const ForgotPasswordPage = lazyPage(() => import('./pages/auth/ForgotPasswordPage.tsx'))
const ResetPasswordPage = lazyPage(() => import('./pages/auth/ResetPasswordPage.tsx'))
const AdminUsersPage = lazyPage(() => import('./pages/admin/AdminUsersPage.tsx'), true)
const AdminDashboardPage = lazyPage(() => import('./pages/admin/AdminDashboardPage.tsx'), true)
const AdminAppointmentsPage = lazyPage(() => import('./pages/admin/AdminAppointmentsPage.tsx'), true)
const ProfilePage = lazyPage(() => import('./pages/ProfilePage.tsx'), true)
const NewsPage = lazyPage(() => import('./pages/forum/NewsPage.tsx'))
const ForumPage = lazyPage(() => import('./pages/forum/ForumPage.tsx'))
const BlogPostPage = lazyPage(() => import('./pages/forum/BlogPostPage.tsx'))
const CommunityPostPage = lazyPage(() => import('./pages/forum/CommunityPostPage.tsx'))
const AdminForumPage = lazyPage(() => import('./pages/admin/AdminForumPage.tsx'), true)
const AdminAnnouncementsPage = lazyPage(() => import('./pages/admin/AdminAnnouncementsPage.tsx'), true)
const AdminExpedientsPage = lazyPage(() => import('./pages/admin/AdminExpedientsPage.tsx'), true)
const AdminParentsPage = lazyPage(() => import('./pages/admin/AdminParentsPage.tsx'), true)
const AdminChildrenPage = lazyPage(() => import('./pages/admin/AdminChildrenPage.tsx'), true)
const AdminEvaluationsPage = lazyPage(() => import('./pages/admin/AdminEvaluationsPage.tsx'), true)
const GalleryPage = lazyPage(() => import('./pages/gallery/GalleryPage.tsx'))
const AlbumDetailPage = lazyPage(() => import('./pages/gallery/AlbumDetailPage.tsx'))
const AdminGalleryPage = lazyPage(() => import('./pages/admin/AdminGalleryPage.tsx'), true)
const AdminCurriculumsPage = lazyPage(() => import('./pages/admin/AdminCurriculumsPage.tsx'), true)
const VacanciesPage = lazyPage(() => import('./pages/VacanciesPage.tsx'))
const OwnerAvailabilityPage = lazyPage(() => import('./pages/admin/OwnerAvailabilityPage.tsx'), true)
const AdminNewsletterPage = lazyPage(() => import('./pages/admin/AdminNewsletterPage.tsx'), true)
const OwnerClubsPage = lazyPage(() => import('./pages/admin/OwnerClubsPage.tsx'), true)
const ClubsPage = lazyPage(() => import('./pages/ClubsPage.tsx'))
const AboutUsPage = lazyPage(() => import('./pages/AboutUsPage.tsx'))
const AdminGroupsPage = lazyPage(() => import('./pages/admin/AdminGroupsPage.tsx'), true)
const GreenHeartsPage = lazyPage(() => import('./pages/GreenHeartsPage.tsx'))
const ServicesPage = lazyPage(() => import('./pages/ServicesPage.tsx'))
const AdminServicePlansPage = lazyPage(() => import('./pages/admin/AdminServicePlansPage.tsx'), true)

/** Updates the canonical URL and the indexing of every route. */
function SeoRouteGuard() {
  const { pathname } = useLocation()

  useEffect(() => {
    setRouteSEO(pathname)
  }, [pathname])

  return null
}

/** Warns and goes to the login page when the session ends (see {@link useSessionExpiredNotice}). */
function SessionWatcher() {
  useSessionExpiredNotice()
  return null
}

/** @returns whether the route belongs to the admin area, which has no footer */
function isDashboardPath(pathname: string) {
  return pathname === '/profile' || pathname.startsWith('/admin')
}

/** Mounts its content again when the stop animations option changes (see {@link useMotionKey}). */
function MotionBoundary({ children }: Readonly<{ children: ReactNode }>) {
  return <Fragment key={useMotionKey()}>{children}</Fragment>
}

/** Footer of every page outside the admin area. */
function GlobalFooter() {
  const { pathname } = useLocation()
  if (isDashboardPath(pathname)) return null
  return <Footer />
}

/** Wait after the page loads before preloading the other pages. */
const PRELOAD_DELAY_MS = 5000

/** Part of `navigator.connection` used to skip the preload on slow or data-saving connections. */
type NetworkInformation = {
  saveData?: boolean
  effectiveType?: string
}

/**
 * Downloads the code of the other pages one by one while the browser is idle, so navigating is
 * instant. It does nothing on slow or data-saving connections.
 */
function PagePreloader() {
  useEffect(() => {
    const { connection } = navigator as Navigator & {
      connection?: NetworkInformation
    }

    if (
      connection?.saveData ||
      /2g|3g/.test(connection?.effectiveType ?? '')
    ) return

    const loaders = [
      ...publicPageLoaders,
      ...(userStorage.getUser() ? privatePageLoaders : [])
    ]

    let cancelled = false
    let handle = 0
    let startTimer = 0

    const idle = (fn: () => void) =>
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(fn, { timeout: 2000 })
        : window.setTimeout(fn, 300)

    const next = (index: number) => {
      if (cancelled || index >= loaders.length) return

      handle = idle(() => {
        loaders[index]()
          .catch(() => undefined)
          .finally(() => next(index + 1))
      })
    }

    const start = () => {
      startTimer = window.setTimeout(
        () => next(0),
        PRELOAD_DELAY_MS
      )
    }

    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    return () => {
      cancelled = true
      window.removeEventListener('load', start)
      window.clearTimeout(startTimer)

      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(handle)
      } else {
        window.clearTimeout(handle)
      }
    }
  }, [])

  return null
}

/** Sends the old album address (`/albumes/:id`) to the new one. */
function LegacyAlbumRedirect() {
  const { id } = useParams()
  return <Navigate to={`/albums/${id ?? ''}`} replace />
}

/**
 * Root of the app: providers, routes (the admin ones guarded by role), and the global widgets: chat,
 * accessibility menu, voice reader, toasts and scroll-to-top button.
 */
function App() {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <BrowserRouter>
          <VoiceReaderProvider>
            <SeoRouteGuard />
            <Toaster position="top-right" offset={{ top: 76 }} />
            <SessionWatcher />
            <PagePreloader />
            <BlobGooFilter />

            <div className="flex min-h-svh flex-col">
              <MotionBoundary>
                <div className="flex-1">
                  <ProfileAvatarProvider>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route element={<ProtectedRoute />}>
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                          </Route>

                          <Route element={<ForumFeedLayout />}>
                            <Route element={<RoleRoute roles={['OWNER', 'TEACHER']} />}>
                              <Route path="/admin/forum" element={<AdminForumPage />} />
                            </Route>
                            <Route path="/forum" element={<ForumPage />} />
                            <Route path="/forum/blog/:id" element={<BlogPostPage />} />
                            <Route path="/forum/community/:id" element={<CommunityPostPage />} />
                          </Route>

                          <Route element={<RoleRoute roles={['OWNER', 'ADMIN']} />}>
                            <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
                            <Route path="/admin/users" element={<AdminUsersPage />} />
                            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
                            <Route path="/admin/gallery" element={<AdminGalleryPage />} />
                            <Route path="/admin/curriculums" element={<AdminCurriculumsPage />} />
                            <Route path="/admin/clubs" element={<OwnerClubsPage />} />
                            <Route path="/admin/parents" element={<AdminParentsPage />} />
                            <Route path="/admin/children" element={<AdminChildrenPage />} />

                            <Route element={<RoleRoute roles={['OWNER']} />}>
                              <Route path="/admin/availability" element={<OwnerAvailabilityPage />} />
                              <Route path="/admin/newsletter" element={<AdminNewsletterPage />} />
                              <Route path="/admin/services" element={<AdminServicePlansPage />} />
                            </Route>
                          </Route>

                          <Route element={<RoleRoute roles={['OWNER', 'TEACHER']} />}>
                            <Route path="/admin/groups" element={<AdminGroupsPage />} />
                          </Route>

                          <Route element={<RoleRoute roles={['OWNER', 'ADMIN', 'TEACHER']} />}>
                            <Route path="/admin/expedients" element={<AdminExpedientsPage />} />
                            <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
                          </Route>

                          <Route path="/" element={<HomePage />} />
                          <Route path="/booking" element={<BookingPage />} />
                          <Route path="/login" element={<LoginPage />} />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/reset-password" element={<ResetPasswordPage />} />
                          <Route path="/news" element={<NewsPage />} />
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
                  </ProfileAvatarProvider>
                </div>

                <GlobalFooter />
                <ScrollToTopButton />
                <Suspense fallback={null}>
                  <ChatWidget />
                </Suspense>
              </MotionBoundary>

              <Suspense fallback={null}>
                <AccessibilityMenu />
                <VoiceReaderController />
              </Suspense>
              <ReadingGuide />
            </div>
          </VoiceReaderProvider>
        </BrowserRouter>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}

export default App
