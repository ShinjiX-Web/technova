import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

// This page handles OAuth callback from GitHub API-based auth
export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleOAuthCallback, isAuthenticated } = useAuth()
  const [status, setStatus] = useState("Completing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error in URL params
      const error = searchParams.get("error")

      if (error) {
        console.error("OAuth error:", error)
        navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true })
        return
      }

      // Check for user data from GitHub OAuth callback
      const userParam = searchParams.get("user")
      const provider = searchParams.get("provider")

      if (userParam && provider === "github") {
        try {
          setStatus("Processing GitHub authentication...")
          const userData = JSON.parse(decodeURIComponent(userParam))

          // Handle the OAuth callback with user data
          await handleOAuthCallback(userData)

          setStatus("Redirecting to dashboard...")
          // Small delay to ensure auth context updates
          setTimeout(() => {
            navigate("/dashboard", { replace: true, state: { showSuccess: true } })
          }, 500)
        } catch (err) {
          console.error("Failed to parse user data:", err)
          navigate("/login?error=invalid_user_data", { replace: true })
        }
        return
      }

      // If already authenticated (e.g., from Firebase), redirect to dashboard
      if (isAuthenticated) {
        navigate("/dashboard", { replace: true })
        return
      }

      // No user data and not authenticated, redirect to login
      navigate("/login", { replace: true })
    }

    handleCallback()
  }, [searchParams, navigate, handleOAuthCallback, isAuthenticated])

  return (
    <div className="flex min-h-svh items-center justify-center bg-white dark:bg-neutral-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  )
}

