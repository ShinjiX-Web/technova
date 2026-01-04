import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Dashboard from './pages/dashboard.tsx'
import LandingPage from './pages/landing.tsx'
import AuthCallback from './pages/auth-callback.tsx'
import ForgotPassword from './pages/forgot-password.tsx'
import AccountPage from './pages/account.tsx'
import BillingPage from './pages/billing.tsx'
import NotificationsPage from './pages/notifications.tsx'
import LifecyclePage from './pages/lifecycle.tsx'
import AnalyticsPage from './pages/analytics.tsx'
import ProjectsPage from './pages/projects.tsx'
import TeamPage from './pages/team.tsx'
import TeamChatPage from './pages/team-chat.tsx'
import DataLibraryPage from './pages/data-library.tsx'
import ReportsPage from './pages/reports.tsx'
import WordAssistantPage from './pages/word-assistant.tsx'
import SettingsPage from './pages/settings.tsx'
import HelpPage from './pages/help.tsx'
import SearchPage from './pages/search.tsx'
import PrivacyPolicy from './pages/privacy.tsx'
import TermsOfService from './pages/terms.tsx'
import { ThemeProvider } from './components/ui/theme-provider.tsx'
import { AuthProvider, useAuth } from './contexts/auth-context.tsx'
import { WaveBackground } from './components/ui/wave-background.tsx'
import { usePresence } from './hooks/use-presence.ts'
import { Analytics } from '@vercel/analytics/react'
// FloatingLiveChat disabled - using 3rd party ChatBot widget instead
// import { FloatingLiveChat } from './components/live-chat.tsx'

// Protected route component with presence tracking
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  // Track presence for authenticated users across all protected pages
  usePresence()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Auth route - redirects to dashboard if already authenticated
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, cancelOtp } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    // Clear any stale pending auth state when user is already authenticated
    cancelOtp()
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          {/* Fixed wave background across entire site */}
          <WaveBackground className="fixed z-0" />

            <div className="relative z-10">
              <Routes>
                <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <App />
                  </AuthRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <AuthRoute>
                    <App defaultSignup={true} />
                  </AuthRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/forgot-password"
                element={
                  <AuthRoute>
                    <ForgotPassword />
                  </AuthRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <BillingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lifecycle"
                element={
                  <ProtectedRoute>
                    <LifecyclePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team"
                element={
                  <ProtectedRoute>
                    <TeamPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team-chat"
                element={
                  <ProtectedRoute>
                    <TeamChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/data-library"
                element={
                  <ProtectedRoute>
                    <DataLibraryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/word-assistant"
                element={
                  <ProtectedRoute>
                    <WordAssistantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <HelpPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                }
              />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
            </Routes>
          </div>

          {/* Vercel Analytics */}
          <Analytics />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
