import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import TeacherDashboardPage from './pages/TeacherDashboardPage.tsx'
import HomePage from './pages/HomePage.tsx'
import BookingPage from './pages/BookingPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import SignUpPage from './pages/SignUpPage.tsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx'
import ResetPasswordPage from './pages/ResetPasswordPage.tsx'
import AdminUsersPage from './pages/AdminUsersPage.tsx'
import AdminDashboardPage from './pages/AdminDashboardPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import ProtectedRoute from './routes/ProtectedRoute.tsx'
import AdminRoute from './routes/AdminRoute.tsx'
import TeacherRoute from './routes/TeacherRoute.tsx'
import NewsPage from './pages/NewsPage.tsx'
import Footer from './layout/Footer.tsx'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-svh flex-col">
        <div className="flex-1">
          <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<TeacherRoute />}>
            <Route path="/teacher" element={<TeacherDashboardPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/news" element={<NewsPage />} />
        {/* Redirigir cualquier ruta no definida a la página de inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
