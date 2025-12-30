import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Dashboard from './pages/dashboard.tsx'
import LandingPage from './pages/landing.tsx'
import { ThemeProvider } from './components/ui/theme-provider.tsx'
import { AuthProvider, useAuth } from './contexts/auth-context.tsx'
import { WaveBackground } from './components/ui/wave-background.tsx'

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

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
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
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
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
